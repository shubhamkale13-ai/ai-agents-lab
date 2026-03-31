import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.routes.chat import router as chat_router

app = FastAPI(
    title="Salesforce CRM AI Agent",
    description="AI assistant for Salesforce CRM — chat API",
    version="2.0.0",
)

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "*",  # Vercel: frontend and API are same origin, CORS not needed
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)

app.include_router(chat_router)

# Local dev only — Vercel serves public/ as static files automatically
if os.path.exists("public/assets"):
    app.mount("/assets", StaticFiles(directory="public/assets"), name="assets")


@app.get("/")
async def root():
    if os.path.exists("public/index.html"):
        return FileResponse("public/index.html")
    return {"service": "Salesforce CRM AI Agent", "version": "2.0.0"}
