import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

app = FastAPI(title="CRM Chat Agent")

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from agent.agent import chat as agent_chat  # noqa: E402 — after load_dotenv


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class ChatResponse(BaseModel):
    response: str
    history: list[Message]


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]
    try:
        response_text = await agent_chat(req.message, history_dicts)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    updated_history = req.history + [
        Message(role="user", content=req.message),
        Message(role="assistant", content=response_text),
    ]
    return ChatResponse(response=response_text, history=updated_history)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "service": "crm-chat-agent",
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }
