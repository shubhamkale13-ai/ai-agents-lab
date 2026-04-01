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


async def chat(message: str, history: list[dict]) -> str:
    """Run one turn of the Sales Assistant agent."""
    client = _get_client()

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
