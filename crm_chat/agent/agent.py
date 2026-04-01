import os
import logging
from groq import AsyncGroq
from agent.prompts import CRM_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")
    return AsyncGroq(api_key=api_key)


async def chat(message: str, history: list[dict]) -> str:
    """
    Send a message with conversation history to Groq.
    history: list of {"role": "user"|"assistant", "content": "..."} dicts.
    """
    client = _get_client()

    messages = [{"role": "system", "content": CRM_SYSTEM_PROMPT}]
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
