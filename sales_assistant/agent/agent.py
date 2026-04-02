"""
Sales Assistant Agent — Groq-powered agentic loop with dynamic Salesforce tool calling.

Flow:
  1. User message + history → Groq (with 3 tools: describe, query, create_task)
  2. LLM calls describe_salesforce_object to discover real field names (incl. custom __c)
  3. LLM calls run_soql_query with schema-accurate SOQL
  4. LLM generates final response from results
  5. Repeat tool rounds up to MAX_TOOL_ROUNDS before returning
"""

import os
import json
import logging
import asyncio
import re
from groq import AsyncGroq
from agent.prompts import SALES_ASSISTANT_FALLBACK_PROMPT, SALES_ASSISTANT_SYSTEM_PROMPT
from agent.tools import TOOL_DEFINITIONS, describe_salesforce_object, run_soql_query, create_task_in_sf

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"
MAX_TOOL_ROUNDS = 8

_TOOL_REGISTRY = {
    "describe_salesforce_object": describe_salesforce_object,
    "run_soql_query": run_soql_query,
    "create_task_in_sf": create_task_in_sf,
}


def _get_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncGroq(api_key=api_key)


async def _execute_tool(name: str, arguments: dict) -> str:
    fn = _TOOL_REGISTRY.get(name)
    if fn is None:
        return f"Unknown tool: {name}"
    try:
        result = await asyncio.to_thread(fn, **arguments)
        return result
    except TypeError as e:
        logger.error("Tool %s called with wrong args %s: %s", name, arguments, e)
        return f"Tool argument error: {e}"
    except Exception as e:
        logger.error("Tool %s failed: %s", name, e)
        return f"Tool execution error: {e}"


def _build_messages(system_prompt: str, message: str, history: list[dict]) -> list[dict]:
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})
    return messages


def _is_tool_validation_error(error: Exception) -> bool:
    text = str(error).lower()
    return "tool call validation failed" in text or "tool_use_failed" in text


def _extract_failed_tool_call(error: Exception) -> tuple[str, dict] | None:
    text = str(error)
    match = re.search(r"<function=([a-zA-Z0-9_]+)\s+(\{.*?\})\s*</function>", text, flags=re.DOTALL)
    if not match:
        return None

    tool_name = match.group(1)
    try:
        arguments = json.loads(match.group(2))
    except json.JSONDecodeError:
        logger.warning("Could not parse failed tool-call arguments from error: %s", text)
        return None

    return tool_name, arguments


def _empty_salesmeta() -> dict:
    return {
        "opportunity_insights": {
            "deal_value": None,
            "stage": None,
            "risk_level": None,
            "last_activity": None,
        },
        "account_summary": {
            "key_contacts": [],
            "engagement_score": None,
        },
        "recommended_actions": [],
        "email": {
            "subject": None,
            "body": None,
        },
    }


def _format_currency(value) -> str | None:
    if value in (None, ""):
        return None
    try:
        return f"${float(value):,.0f}"
    except (TypeError, ValueError):
        return str(value)


def _format_sales_response(text: str, metadata: dict | None = None) -> str:
    payload = metadata or _empty_salesmeta()
    return f"{text}\n```salesmeta\n{json.dumps(payload, indent=2)}\n```"


def _parse_soql_result(payload: str) -> dict | None:
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        logger.warning("Could not parse SOQL payload: %s", payload)
        return None


def _is_total_opportunities_request(message: str) -> bool:
    lower = message.lower()
    return "opportunit" in lower and any(term in lower for term in ["total", "count", "how many"])


def _is_list_opportunities_request(message: str) -> bool:
    lower = message.lower()
    return "opportunit" in lower and any(term in lower for term in ["list", "show", "all", "details"])


def _is_highest_revenue_request(message: str) -> bool:
    lower = message.lower()
    return (
        ("opportunit" in lower or "deal" in lower)
        and any(term in lower for term in ["highest revenue", "largest revenue", "highest amount", "biggest deal", "top deal"])
    )


async def _handle_opportunity_shortcuts(message: str) -> str | None:
    if _is_total_opportunities_request(message):
        result = await _execute_tool("run_soql_query", {"soql": "SELECT COUNT(Id) totalCount FROM Opportunity"})
        parsed = _parse_soql_result(result)
        total = None
        if parsed and parsed.get("records"):
            total = parsed["records"][0].get("expr0") or parsed["records"][0].get("totalCount")
        if total is None:
            return None
        return _format_sales_response(f"There are {total} total opportunities.")

    if _is_highest_revenue_request(message):
        result = await _execute_tool(
            "run_soql_query",
            {"soql": "SELECT Id, Name, Amount, StageName, CloseDate, Account.Name FROM Opportunity WHERE Amount != NULL ORDER BY Amount DESC LIMIT 1"},
        )
        parsed = _parse_soql_result(result)
        records = (parsed or {}).get("records", [])
        if not records:
            return _format_sales_response("I could not find any opportunities with an amount populated.")
        top = records[0]
        amount = _format_currency(top.get("Amount"))
        account_name = top.get("Account.Name") or "Unknown account"
        answer = (
            f"The highest-revenue deal is {top.get('Name', 'Unknown opportunity')} at {amount or 'an unknown amount'}.\n"
            f"Stage: {top.get('StageName') or 'Unknown'}\n"
            f"Account: {account_name}\n"
            f"Close date: {top.get('CloseDate') or 'Unknown'}"
        )
        metadata = _empty_salesmeta()
        metadata["opportunity_insights"]["deal_value"] = amount
        metadata["opportunity_insights"]["stage"] = top.get("StageName")
        return _format_sales_response(answer, metadata)

    if _is_list_opportunities_request(message):
        result = await _execute_tool(
            "run_soql_query",
            {"soql": "SELECT Name, Amount, StageName, CloseDate, Account.Name FROM Opportunity ORDER BY Amount DESC LIMIT 200"},
        )
        parsed = _parse_soql_result(result)
        records = (parsed or {}).get("records", [])
        if not records:
            return _format_sales_response("I could not find any opportunities.")
        lines = [f"There are {len(records)} opportunities in the returned result set:"]
        for record in records:
            lines.append(
                f"- {record.get('Name', 'Unknown opportunity')} | "
                f"{_format_currency(record.get('Amount')) or 'No amount'} | "
                f"{record.get('StageName') or 'No stage'} | "
                f"Close: {record.get('CloseDate') or 'No close date'} | "
                f"Account: {record.get('Account.Name') or 'Unknown account'}"
            )
        return _format_sales_response("\n".join(lines))

    return None


async def chat(message: str, history: list[dict]) -> str:
    """Run one turn of the Sales Assistant agent."""
    client = _get_client()

    shortcut_response = await _handle_opportunity_shortcuts(message)
    if shortcut_response is not None:
        return shortcut_response

    messages = _build_messages(SALES_ASSISTANT_SYSTEM_PROMPT, message, history)
    used_fallback_prompt = False

    for round_num in range(MAX_TOOL_ROUNDS):
        try:
            response = await client.chat.completions.create(
                model=GROQ_MODEL,
                messages=messages,
                tools=TOOL_DEFINITIONS,
                tool_choice="auto",
                temperature=0.3,
                max_tokens=2048,
            )
        except Exception as e:
            if _is_tool_validation_error(e):
                failed_tool_call = _extract_failed_tool_call(e)
                if failed_tool_call is not None:
                    tool_name, tool_args = failed_tool_call
                    logger.warning(
                        "Recovering from malformed tool call by executing %s with args %s",
                        tool_name,
                        tool_args,
                    )
                    tool_result = await _execute_tool(tool_name, tool_args)
                    messages.append({
                        "role": "system",
                        "content": (
                            f"The previous tool call was malformed, but the runtime executed it anyway.\n"
                            f"Tool: {tool_name}\n"
                            f"Arguments: {json.dumps(tool_args)}\n"
                            f"Result:\n{tool_result}\n\n"
                            "Do not emit <function=...> tags. Either use the native tool interface correctly "
                            "or answer directly from the tool result."
                        ),
                    })
                    used_fallback_prompt = True
                    continue

            if not used_fallback_prompt and _is_tool_validation_error(e):
                logger.warning("Retrying with fallback prompt after tool validation failure")
                messages = _build_messages(SALES_ASSISTANT_FALLBACK_PROMPT, message, history)
                used_fallback_prompt = True
                continue
            logger.error("Groq API call failed (round %d): %s", round_num, e)
            return f"Sorry, I ran into an error talking to the AI: {e}"

        choice = response.choices[0]

        if choice.finish_reason != "tool_calls":
            return choice.message.content or ""

        tool_calls = choice.message.tool_calls or []
        if not tool_calls:
            return choice.message.content or ""

        messages.append(choice.message.model_dump(exclude_none=True))

        tool_tasks = [
            _execute_tool(tc.function.name, json.loads(tc.function.arguments))
            for tc in tool_calls
        ]
        tool_results = await asyncio.gather(*tool_tasks)

        for tc, result in zip(tool_calls, tool_results):
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": result,
            })

        logger.debug("Round %d: executed %d tool(s): %s", round_num + 1, len(tool_calls),
                     [tc.function.name for tc in tool_calls])

    return (
        "I reached the maximum number of tool calls without a final answer. "
        "Please try rephrasing your question."
    )
