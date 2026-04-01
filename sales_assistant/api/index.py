import os
import json
import re
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

app = FastAPI(title="Sales Assistant Agent")

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from agent.agent import chat as sales_agent_chat  # noqa: E402 — after load_dotenv


class Message(BaseModel):
    role: str
    content: str
    metadata: dict | None = None


class SalesChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class SalesChatResponse(BaseModel):
    response: str
    history: list[Message]
    metadata: dict | None = None


_EMPTY_METADATA = {
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


def _extract_sales_metadata(response_text: str) -> tuple[str, dict | None]:
    match = re.search(r"```salesmeta\s*(\{.*?\})\s*```", response_text, flags=re.DOTALL)
    if not match:
        return response_text.strip(), None

    cleaned = re.sub(r"\n?```salesmeta\s*\{.*?\}\s*```", "", response_text, flags=re.DOTALL).strip()
    try:
        parsed = json.loads(match.group(1))
    except json.JSONDecodeError:
        return cleaned, None

    metadata = json.loads(json.dumps(_EMPTY_METADATA))
    metadata["opportunity_insights"].update(parsed.get("opportunity_insights", {}))
    metadata["account_summary"].update(parsed.get("account_summary", {}))
    metadata["recommended_actions"] = parsed.get("recommended_actions", []) or []
    metadata["email"].update(parsed.get("email", {}))
    return cleaned, metadata


@app.post("/api/sales/chat", response_model=SalesChatResponse)
async def sales_chat(req: SalesChatRequest):
    if not os.getenv("SF_USERNAME") or not os.getenv("SF_PASSWORD"):
        raise HTTPException(
            status_code=503,
            detail="Salesforce credentials not configured. Set SF_USERNAME, SF_PASSWORD, SF_SECURITY_TOKEN in environment.",
        )

    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
    try:
        response_text = await sales_agent_chat(req.message, history_dicts)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    clean_response, metadata = _extract_sales_metadata(response_text)

    updated_history = req.history + [
        Message(role="user", content=req.message),
        Message(role="assistant", content=clean_response, metadata=metadata),
    ]

    return SalesChatResponse(response=clean_response, history=updated_history, metadata=metadata)


@app.get("/api/sales/health")
async def sales_health():
    sf_configured = bool(os.getenv("SF_USERNAME") and os.getenv("SF_PASSWORD"))
    return {
        "status": "ok",
        "service": "sales-assistant-agent",
        "salesforce_configured": sf_configured,
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
        "sf_security_token_configured": bool(os.getenv("SF_SECURITY_TOKEN")),
        "sf_domain": os.getenv("SF_DOMAIN", "login"),
    }
