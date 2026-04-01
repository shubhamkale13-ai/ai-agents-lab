"""
Salesforce tool implementations for the Sales Assistant agent.

Dynamic approach — LLM calls describe_salesforce_object first to discover
real field names (including custom __c fields), then calls run_soql_query
with a schema-accurate SOQL statement.

All tools are synchronous (run via asyncio.to_thread in the agent).
"""

import json
import logging
import re
from agents.sales_assistant.sf_client import get_sf_client, describe_object_for_llm

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Tool: describe_salesforce_object
# ---------------------------------------------------------------------------

def describe_salesforce_object(object_name: str) -> str:
    """
    Return full field metadata for any Salesforce object.
    LLM must call this before writing SOQL for an object it hasn't described yet.
    Includes standard fields, custom fields (__c), picklist values, and relationship names.
    Results are cached — safe to call multiple times, only one API hit per object.
    """
    try:
        return describe_object_for_llm(object_name)
    except Exception as e:
        logger.error("describe_salesforce_object failed for '%s': %s", object_name, e)
        return f"Error describing object '{object_name}': {e}"


# ---------------------------------------------------------------------------
# Tool: run_soql_query  (dynamic — LLM writes the SOQL)
# ---------------------------------------------------------------------------

_BLOCKED_KEYWORDS = {"INSERT", "UPDATE", "DELETE", "UPSERT", "UNDELETE", "MERGE", "CONVERTLEAD"}
_DEFAULT_LIMIT = 20
_MAX_LIMIT = 200


def _escape_soql_string(value: str) -> str:
    return value.replace("\\", "\\\\").replace("'", "\\'")


def _clean_soql(soql: str) -> str:
    """Strip markdown code fences and extra whitespace."""
    soql = soql.strip()
    if soql.startswith("```"):
        lines = soql.splitlines()
        soql = "\n".join(l for l in lines if not l.startswith("```")).strip()
    return soql


def _extract_limit_value(soql: str) -> int | None:
    match = re.search(r"\bLIMIT\s+(\d+)", soql, flags=re.IGNORECASE)
    return int(match.group(1)) if match else None


def _is_aggregate_only(upper_soql: str) -> bool:
    """
    Returns True for queries that return a single aggregate row (no LIMIT needed/allowed).
    Cases: SELECT COUNT() ... or SELECT COUNT(x)/SUM/AVG/MAX/MIN without GROUP BY.
    """
    import re
    if re.search(r"SELECT\s+COUNT\s*\(\s*\)", upper_soql):
        return True
    has_aggregate = bool(re.search(r"\b(COUNT|SUM|AVG|MAX|MIN)\s*\(", upper_soql))
    has_group_by = "GROUP BY" in upper_soql
    return has_aggregate and not has_group_by


def _enforce_limit(soql: str) -> str:
    """
    Ensure SOQL has a LIMIT clause capped at _MAX_LIMIT.
    Skips aggregate-only queries where LIMIT is not applicable.
    """
    import re
    upper = soql.upper()

    if _is_aggregate_only(upper):
        return soql.rstrip(";").rstrip()

    if "LIMIT" in upper:
        def cap_limit(m):
            val = min(int(m.group(1)), _MAX_LIMIT)
            return f"LIMIT {val}"
        soql = re.sub(r"LIMIT\s+(\d+)", cap_limit, soql, flags=re.IGNORECASE)
    else:
        soql = soql.rstrip(";").rstrip() + f" LIMIT {_DEFAULT_LIMIT}"

    return soql


def run_soql_query(soql: str) -> str:
    """
    Execute any read-only SOQL query against the Salesforce org.
    Blocks DML keywords. Returns JSON with results.
    Use describe_salesforce_object first to get correct field names.
    """
    soql = _clean_soql(soql)
    upper_soql = soql.upper()

    if not upper_soql.lstrip().startswith("SELECT"):
        return "Error: only SELECT queries are allowed."

    for kw in _BLOCKED_KEYWORDS:
        if kw in upper_soql:
            return f"Error: '{kw}' is not allowed in read-only queries."

    soql = _enforce_limit(soql)
    sf = get_sf_client()

    try:
        result = sf.query_all(soql)
    except Exception as e:
        logger.error("run_soql_query failed — SOQL: %s — Error: %s", soql, e)
        return f"SOQL error: {e}"

    records = result.get("records", [])
    total_size = result.get("totalSize", 0)
    limit_value = _extract_limit_value(soql)
    partial_result = bool(limit_value and total_size > len(records))

    if not records:
        return json.dumps({
            "total": 0,
            "total_size": total_size,
            "returned": 0,
            "partial_result": False,
            "records": [],
            "note": "No records matched.",
        })

    # Strip SF metadata attributes and flatten one level of nested objects
    clean_records = []
    for r in records:
        clean = {k: v for k, v in r.items() if k != "attributes"}
        flat = {}
        for k, v in clean.items():
            if isinstance(v, dict) and "attributes" in v:
                for sub_k, sub_v in v.items():
                    if sub_k != "attributes":
                        flat[f"{k}.{sub_k}"] = sub_v
            else:
                flat[k] = v
        clean_records.append(flat)

    payload = {
        "total_size": total_size,
        "returned": len(clean_records),
        "partial_result": partial_result,
        "records": clean_records,
    }
    if partial_result:
        payload["note"] = "Partial result set returned. Additional matching records were not included."
    return json.dumps(payload, indent=2, default=str)


# ---------------------------------------------------------------------------
# Tool: create_task_in_sf
# ---------------------------------------------------------------------------

_VALID_TASK_TYPES    = {"Call", "Email", "Meeting", "Other"}
_VALID_TASK_STATUSES = {"Not Started", "In Progress", "Completed", "Waiting on someone else", "Deferred"}


def _resolve_related_opportunity(sf, related_opportunity_name: str) -> tuple[str | None, str | None]:
    escaped_name = _escape_soql_string(related_opportunity_name.strip())
    exact = sf.query(
        f"SELECT Id, Name FROM Opportunity WHERE Name = '{escaped_name}' LIMIT 2"
    ).get("records", [])
    if len(exact) == 1:
        return exact[0]["Id"], None
    if len(exact) > 1:
        return None, (
            f"Multiple opportunities exactly matched '{related_opportunity_name}'. "
            "Task was created without linking to an opportunity."
        )

    fuzzy = sf.query(
        f"SELECT Id, Name FROM Opportunity WHERE Name LIKE '%{escaped_name}%' LIMIT 2"
    ).get("records", [])
    if len(fuzzy) == 1:
        return None, (
            f"No exact opportunity match for '{related_opportunity_name}'. "
            f"Closest match was '{fuzzy[0].get('Name')}', but the task was left unlinked for safety."
        )
    if len(fuzzy) > 1:
        return None, (
            f"Multiple similar opportunities matched '{related_opportunity_name}'. "
            "Task was created without linking to an opportunity."
        )
    return None, f"No opportunity matched '{related_opportunity_name}'. Task was created without a linked opportunity."


def create_task_in_sf(
    subject: str,
    due_date: str = None,
    priority: str = "Normal",
    task_type: str = None,
    status: str = "Not Started",
    related_opportunity_name: str = None,
) -> str:
    """
    Create a Task in Salesforce.
    due_date format: YYYY-MM-DD
    priority: High / Normal / Low
    task_type: Call / Email / Meeting / Other
    status: Not Started / In Progress / Completed / Waiting on someone else / Deferred
    """
    sf = get_sf_client()

    task_data = {
        "Subject": subject,
        "Status": status if status in _VALID_TASK_STATUSES else "Not Started",
        "Priority": priority if priority in ("High", "Normal", "Low") else "Normal",
    }
    warning = None
    linked_opportunity_id = None

    if task_type and task_type in _VALID_TASK_TYPES:
        task_data["Type"] = task_type

    if due_date:
        task_data["ActivityDate"] = due_date

    if related_opportunity_name:
        try:
            linked_opportunity_id, warning = _resolve_related_opportunity(
                sf, related_opportunity_name
            )
            if linked_opportunity_id:
                task_data["WhatId"] = linked_opportunity_id
        except Exception as e:
            logger.warning("Could not find opp for task creation: %s", e)
            warning = f"Could not verify opportunity link: {e}"

    try:
        result = sf.Task.create(task_data)
        if result.get("success"):
            payload = {
                "success": True,
                "task_id": result.get("id"),
                "message": f"Task '{subject}' created successfully in Salesforce.",
                "linked_opportunity_id": linked_opportunity_id,
            }
            if warning:
                payload["warning"] = warning
            return json.dumps(payload)
        return json.dumps({"success": False, "errors": result.get("errors", [])})
    except Exception as e:
        logger.error("create_task_in_sf failed: %s", e)
        return f"Error creating task: {e}"


# ---------------------------------------------------------------------------
# Tool definitions for Groq function calling
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "describe_salesforce_object",
            "description": (
                "Retrieve the complete field list for any Salesforce object — standard or custom. "
                "ALWAYS call this before writing SOQL for an object to get exact field API names, "
                "data types, valid picklist values, and relationship names. "
                "Custom fields end in __c and appear automatically. "
                "Call once per object per conversation — results are cached."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "object_name": {
                        "type": "string",
                        "description": (
                            "Salesforce object API name. "
                            "Standard examples: Opportunity, Account, Contact, Lead, Task, Contract, Case, Event, OpportunityHistory, OpportunityContactRole. "
                            "Custom objects use __c suffix: e.g. Revenue__c, Territory__c"
                        ),
                    },
                },
                "required": ["object_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_soql_query",
            "description": (
                "Execute any read-only SOQL SELECT query against the live Salesforce org. "
                "Use this for all data retrieval: counts, aggregates, filters, lists, reports. "
                "Supports all standard SOQL features: WHERE, GROUP BY, ORDER BY, LIMIT, subqueries, date literals. "
                "Only SELECT is allowed — no DML."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "soql": {
                        "type": "string",
                        "description": (
                            "A valid SOQL SELECT statement. Use ONLY field names from describe_salesforce_object. "
                            "Use date literals for time filters: TODAY, THIS_WEEK, THIS_MONTH, THIS_QUARTER, THIS_YEAR, "
                            "LAST_N_DAYS:n, LAST_N_MONTHS:n, NEXT_N_MONTHS:n, etc. "
                            "Examples:\n"
                            "  SELECT StageName, COUNT(Id) cnt, SUM(Amount) total FROM Opportunity WHERE IsClosed = false GROUP BY StageName\n"
                            "  SELECT Id, ContractNumber, EndDate, Account.Name FROM Contract WHERE EndDate = THIS_MONTH ORDER BY EndDate ASC\n"
                            "  SELECT Id, Name FROM Account WHERE Id NOT IN (SELECT AccountId FROM Opportunity WHERE IsClosed = false) LIMIT 20"
                        ),
                    },
                },
                "required": ["soql"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task_in_sf",
            "description": (
                "Create a new Task in Salesforce. Only call this after the user explicitly confirms "
                "they want to create a task. Use status='Completed' and task_type='Call' when logging a past call."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {
                        "type": "string",
                        "description": "Task subject / title",
                    },
                    "due_date": {
                        "type": "string",
                        "description": "Due date in YYYY-MM-DD format",
                    },
                    "priority": {
                        "type": "string",
                        "enum": ["High", "Normal", "Low"],
                        "description": "Task priority — default Normal",
                    },
                    "task_type": {
                        "type": "string",
                        "enum": ["Call", "Email", "Meeting", "Other"],
                        "description": "Type of activity — use 'Call' when logging a phone call",
                    },
                    "status": {
                        "type": "string",
                        "enum": ["Not Started", "In Progress", "Completed", "Waiting on someone else", "Deferred"],
                        "description": "Task status — use 'Completed' when logging a past activity. Default: Not Started",
                    },
                    "related_opportunity_name": {
                        "type": "string",
                        "description": "Name of the opportunity to link this task to",
                    },
                },
                "required": ["subject"],
            },
        },
    },
]
