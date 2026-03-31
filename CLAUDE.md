# AI Agents Lab — Claude Session Context

## What This Repo Is

`ai-agents-lab` is a **FastAPI backend for a Salesforce CRM AI Agent**.
It deploys to **Vercel** (Python serverless). The chat UI is a static HTML page served from `public/`.

**Live URL (after Vercel deploy):** `https://<project>.vercel.app`

---

## Architecture

```
ai-agents-lab/
├── api/
│   ├── main.py              # FastAPI ASGI app — entry point for Vercel
│   ├── requirements.txt
│   └── routes/
│       └── chat.py          # POST /api/chat, GET /api/health
│
├── agents/
│   └── crm_chat/
│       ├── agent.py         # Groq async chat with conversation history
│       └── prompts.py       # CRM system prompt
│
├── public/
│   └── index.html           # ChatGPT-style chat UI (served by Vercel static)
│
├── vercel.json              # Rewrites /api/* → FastAPI
├── requirements.txt         # Root-level (for Vercel Python runtime)
└── .env                     # Local secrets (gitignored)
```

---

## API Design

**Stateless** — client sends full conversation history with every request.

### `POST /api/chat`
```json
Request:
{
  "message": "How do I write a bulk-safe trigger?",
  "history": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}

Response:
{
  "response": "...",
  "history": [...updated history including new exchange...]
}
```

### `GET /api/health`
```json
{ "status": "ok", "service": "salesforce-crm-ai-agent" }
```

---

## Chat UI

- **Location:** `public/index.html` (single self-contained file)
- **Features:** ChatGPT-style, sidebar with session list, localStorage persistence, markdown rendering, typing indicator
- **API:** calls `POST /api/chat` with full history
- **Session storage:** client-side only (localStorage), no server-side state

---

## Tech Stack

| Layer | Tech |
|-------|------|
| API framework | FastAPI |
| AI model | Groq — `llama-3.3-70b-versatile` |
| Hosting | Vercel (Python serverless) |
| Static UI | `public/index.html` (Vercel static serving) |
| Secret management | Vercel Environment Variables |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Groq API key |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |

Local dev: `.env` file in repo root (gitignored).

---

## Local Dev

```bash
uvicorn api.main:app --reload --port 8000
# Chat UI: open public/index.html in browser, or
# visit http://localhost:8000 (returns API info)
```

---

## Vercel Deployment

1. Push repo to GitHub
2. Connect to Vercel, select repo
3. Add Environment Variable: `GROQ_API_KEY`
4. Deploy — Vercel auto-detects Python from `requirements.txt`
5. `public/index.html` is served at `/` as static
6. `/api/*` routes to `api/main.py` via `vercel.json` rewrites

---

## Coding Conventions

- Python 3.11+
- All agent functions are `async`
- Pydantic v2 models for all request/response schemas
- No secrets in code — always `os.getenv()`
- API always returns structured JSON
- Error responses: `{"error": "message", "detail": "..."}`
