---
title: AI Agents Lab
emoji: 🤖
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# AI Agents Lab

FastAPI backend for the [salesforceninja.dev](https://www.salesforceninja.dev) AI Agent Marketplace.

Deployed to **Hugging Face Spaces** (Docker). The website at salesforceninja.dev calls this API after Razorpay payment success.

---

## Live URL

```
https://salesforceninja-ai-agents.hf.space
```

## Endpoints

| Method | Route | Agent | Status |
|--------|-------|-------|--------|
| GET | `/health` | Health check | ✅ |
| POST | `/lead-qualifier` | Lead Qualifier | ✅ |
| POST | `/web-scraper` | Web Scraper | 🔲 Phase 2 |
| POST | `/support-resolver` | Support Resolver | 🔲 Phase 2 |
| POST | `/doc-intelligence` | Document Intelligence | 🔲 Phase 3 |
| POST | `/social-content` | Social Content Generator | 🔲 Phase 3 |

---

## Local Development

### 1. Clone and set up environment

```bash
git clone https://github.com/shubham1284/ai-agents-lab.git
cd ai-agents-lab
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r api/requirements.txt
```

### 2. Set environment variables

Create a `.env` file in the repo root (already gitignored):

```
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=https://www.salesforceninja.dev,http://localhost:3000
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

### 3. Run locally

```bash
uvicorn api.main:app --reload --port 8000
```

API docs available at: `http://localhost:8000/docs`

---

## HuggingFace Spaces Deployment

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Name: `salesforceninja-ai-agents`
3. SDK: **Docker**
4. Link to this GitHub repo
5. Go to **Settings → Secrets** → add `GEMINI_API_KEY`
6. Push any commit → auto-deploys
7. Verify: `https://salesforceninja-ai-agents.hf.space/health`

---

## Lead Qualifier — Example Request

```bash
curl -X POST https://salesforceninja-ai-agents.hf.space/lead-qualifier \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "name": "Priya Sharma",
        "company": "TechFlow India",
        "title": "VP Engineering",
        "email": "priya@techflow.in",
        "notes": "Downloaded whitepaper on Salesforce automation"
      }
    ],
    "scoring_criteria": "B2B SaaS, 50-500 employees, technical decision maker",
    "output_format": "json"
  }'
```

---

## Project Structure

```
ai-agents-lab/
├── api/
│   ├── main.py              # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   └── routes/
│       └── lead_qualifier.py
├── agents/
│   ├── lead_qualifier/
│   │   ├── agent.py         # Gemini API logic
│   │   └── prompts.py       # Prompt templates
│   ├── web_scraper/         # Phase 2
│   ├── support_resolver/    # Phase 2
│   ├── doc_intelligence/    # Phase 3
│   └── social_content/      # Phase 3
├── Dockerfile
├── CLAUDE.md                # Session context for Claude Code
└── .gitignore
```
