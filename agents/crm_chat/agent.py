import os
import json
import logging
from groq import AsyncGroq

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are an expert CRM AI assistant and sales analyst for salesforceninja.dev.
You help sales teams with:
- Lead qualification and scoring (Hot/Warm/Cold with 0-100 score)
- Lead enrichment and ICP matching
- Sales pipeline analysis
- Follow-up action recommendations
- Drafting outreach emails and messages
- Answering CRM and Salesforce-related questions

When a user gives you leads (as a list, table, or natural text), automatically qualify them.
Format lead scores clearly using emojis: 🔥 Hot | 🌤️ Warm | ❄️ Cold

When qualifying leads, always provide:
1. Score (🔥/🌤️/❄️) + number (0-100)
2. Why (1 sentence)
3. Recommended next action

Be conversational, concise, and actionable. You are a senior sales advisor.
"""


def _get_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncGroq(api_key=api_key)


async def chat(message: str, history: list[dict]) -> str:
    """
    Sends a message with full conversation history to Groq.
    history is a list of {"role": "user"|"assistant", "content": "..."} dicts.
    """
    client = _get_client()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": message})

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.4,
            max_tokens=2048,
        )
        return response.choices[0].message.content

    except Exception as e:
        logger.error("Groq chat failed: %s", e)
        return f"Sorry, I ran into an error: {e}"
