import os
from dotenv import load_dotenv
load_dotenv()

import gradio as gr
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from api.routes import lead_qualifier
from api.chat_ui import build_ui

app = FastAPI(
    title="AI Agents Lab",
    description="AI agent backend for salesforceninja.dev",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://www.salesforceninja.dev,http://localhost:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Accept"],
)

app.include_router(lead_qualifier.router)

# Mount Gradio chat UI at /chat
gradio_app = build_ui()
app = gr.mount_gradio_app(app, gradio_app, path="/chat")


@app.get("/")
async def root():
    return RedirectResponse(url="/chat")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-agents-lab"}
