import json
import os
import logging
from groq import AsyncGroq
from agents.lead_qualifier.prompts import LEAD_QUALIFIER_SYSTEM, LEAD_QUALIFIER_USER

logger = logging.getLogger(__name__)

GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_groq_client() -> AsyncGroq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY environment variable is not set")
    return AsyncGroq(api_key=api_key)


def _build_csv(results: list[dict]) -> str:
    if not results:
        return ""
    headers = ["name", "company", "score", "score_value", "reasoning", "recommended_action", "enriched_role", "fit_tags"]
    rows = [",".join(headers)]
    for r in results:
        fit_tags = "|".join(r.get("fit_tags", []))
        row = [
            _csv_escape(r.get("name", "")),
            _csv_escape(r.get("company", "")),
            _csv_escape(r.get("score", "")),
            str(r.get("score_value", 0)),
            _csv_escape(r.get("reasoning", "")),
            _csv_escape(r.get("recommended_action", "")),
            _csv_escape(r.get("enriched_role", "")),
            _csv_escape(fit_tags),
        ]
        rows.append(",".join(row))
    return "\n".join(rows)


def _csv_escape(value: str) -> str:
    if "," in value or '"' in value or "\n" in value:
        return '"' + value.replace('"', '""') + '"'
    return value


async def qualify_leads(leads: list[dict], scoring_criteria: str) -> dict:
    """
    Takes a list of lead dicts and a scoring criteria string.
    Returns structured qualification results with scores, reasoning, and CSV data.
    """
    if not leads:
        return {"results": [], "summary": "No leads provided", "csv_data": ""}

    client = _get_groq_client()

    prompt = LEAD_QUALIFIER_USER.format(
        scoring_criteria=scoring_criteria or "B2B company with budget authority, 50-500 employees, decision maker",
        leads_json=json.dumps(leads, indent=2),
    )

    try:
        response = await client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": LEAD_QUALIFIER_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4096,
        )

        raw = response.choices[0].message.content.strip()
        parsed = json.loads(raw)

        results = parsed.get("results", [])
        summary = parsed.get("summary", f"{len(results)} leads processed")
        csv_data = _build_csv(results)

        return {
            "results": results,
            "summary": summary,
            "csv_data": csv_data,
        }

    except json.JSONDecodeError as e:
        logger.error("Failed to parse Groq JSON response: %s", e)
        raise ValueError(f"AI returned malformed JSON: {e}") from e
    except Exception as e:
        logger.error("Groq API call failed: %s", e)
        raise RuntimeError(f"AI processing failed: {e}") from e
