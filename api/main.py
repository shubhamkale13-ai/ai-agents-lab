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
    "https://www.salesforceninja.dev,http://localhost:3000,http://localhost:8000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)

app.include_router(chat_router)

app.mount("/static", StaticFiles(directory="public"), name="static")


@app.get("/")
async def root():
    return FileResponse("public/index.html")
