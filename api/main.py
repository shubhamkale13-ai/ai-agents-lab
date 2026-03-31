import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import lead_qualifier

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


@app.get("/")
async def root():
    return {
        "service": "AI Agents Lab — salesforceninja.dev",
        "status": "running",
        "agents": [
            {"name": "Lead Qualifier", "route": "/lead-qualifier", "status": "live"},
            {"name": "Web Scraper", "route": "/web-scraper", "status": "coming_soon"},
            {"name": "Support Resolver", "route": "/support-resolver", "status": "coming_soon"},
            {"name": "Document Intelligence", "route": "/doc-intelligence", "status": "coming_soon"},
            {"name": "Social Content", "route": "/social-content", "status": "coming_soon"},
        ],
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-agents-lab"}
