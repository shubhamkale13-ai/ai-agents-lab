from fastapi import APIRouter
from pydantic import BaseModel
from agents.crm_chat.agent import chat as agent_chat

router = APIRouter(prefix="/api")


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[Message] = []


class ChatResponse(BaseModel):
    response: str
    history: list[Message]


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    history_dicts = [{"role": m.role, "content": m.content} for m in req.history]

    response_text = await agent_chat(req.message, history_dicts)

    updated_history = req.history + [
        Message(role="user", content=req.message),
        Message(role="assistant", content=response_text),
    ]

    return ChatResponse(response=response_text, history=updated_history)


@router.get("/health")
async def health():
    return {"status": "ok", "service": "salesforce-crm-ai-agent"}
