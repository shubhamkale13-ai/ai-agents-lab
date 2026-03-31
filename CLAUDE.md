# AI Agents Lab — Claude Session Context

## What This Repo Is

`ai-agents-lab` is the **Python backend** for the AI Agent Marketplace on salesforceninja.dev.
It runs as a FastAPI server deployed to **Hugging Face Spaces** (Docker SDK).
The frontend lives in a separate repo: `salesforceninja-dev` (Vercel-hosted Next.js/static site).

**Live backend URL (after HF deploy):** `https://salesforceninja-ai-agents.hf.space`

---

## Architecture

```
ai-agents-lab/
├── api/
│   ├── main.py                  # FastAPI app, CORS, router registration
│   ├── requirements.txt
│   └── routes/
│       ├── lead_qualifier.py
│       ├── web_scraper.py
│       ├── support_resolver.py
│       ├── doc_intelligence.py
│       └── social_content.py
│
├── agents/
│   ├── lead_qualifier/
│   │   ├── agent.py             # Core Gemini logic
│   │   └── prompts.py           # Prompt templates
│   ├── web_scraper/
│   ├── support_resolver/
│   ├── doc_intelligence/
│   └── social_content/
│
├── Dockerfile                   # HuggingFace Spaces Docker deployment
├── CLAUDE.md                    # ← You are here
└── .gitignore
```

**Integration flow:**
1. User pays via Razorpay on salesforceninja.dev
2. JS on salesforceninja.dev calls `POST https://salesforceninja-ai-agents.hf.space/<agent>`
3. FastAPI receives → Python agent runs → calls Gemini API → returns JSON
4. Website renders results as table + download CSV

---

## Tech Stack

| Layer | Tech |
|-------|------|
| API framework | FastAPI |
| AI model | Groq — `llama-3.3-70b-versatile` (`groq` SDK) |
| Web scraping | `playwright`, `beautifulsoup4` |
| Data processing | `pandas` |
| PDF handling | `PyMuPDF` (`fitz`) |
| OCR (fallback) | `pytesseract` |
| Hosting | Hugging Face Spaces (Docker) |
| Secret management | HF Spaces secrets → `GEMINI_API_KEY` env var |

---

## Agents — Status Tracker

| # | Agent | Route | Status |
|---|-------|-------|--------|
| 1 | Lead Qualifier | `POST /lead-qualifier` | ✅ Phase 1 — Built |
| 2 | Web Scraper | `POST /web-scraper` | 🔲 Phase 2 |
| 3 | Support Resolver | `POST /support-resolver` | 🔲 Phase 2 |
| 4 | Document Intelligence | `POST /doc-intelligence` | 🔲 Phase 3 |
| 5 | Social Content | `POST /social-content` | 🔲 Phase 3 |

---

## Agent #1 — Lead Qualifier

**Route:** `POST /lead-qualifier`

**Request body:**
```json
{
  "leads": [
    {
      "name": "John Doe",
      "company": "Acme Corp",
      "title": "VP Sales",
      "email": "john@acme.com",
      "linkedin_url": "https://linkedin.com/in/johndoe",
      "notes": "Attended webinar on automation"
    }
  ],
  "scoring_criteria": "B2B SaaS company, 50-500 employees, decision maker",
  "output_format": "json"
}
```

**Response:**
```json
{
  "results": [
    {
      "name": "John Doe",
      "company": "Acme Corp",
      "score": "Hot",
      "score_value": 87,
      "reasoning": "Decision maker title, B2B company, showed buying intent",
      "recommended_action": "Call within 24 hours",
      "enriched_role": "VP Sales — likely budget authority",
      "fit_tags": ["decision_maker", "b2b", "intent_signal"]
    }
  ],
  "summary": "3 Hot, 5 Warm, 2 Cold out of 10 leads",
  "csv_data": "name,company,score,score_value,reasoning\n..."
}
```

---

## Agent #2 — Web Scraper

**Route:** `POST /web-scraper`

**Request body:**
```json
{
  "urls": ["https://example.com"],
  "extraction_instructions": "Extract product names, prices, and descriptions",
  "output_format": "json"
}
```

---

## Agent #3 — Support Resolver

**Route:** `POST /support-resolver`

**Request body:**
```json
{
  "ticket_text": "My invoice shows wrong amount charged",
  "knowledge_base": "FAQ content or paste your policies here...",
  "tone": "professional"
}
```

---

## Agent #4 — Document Intelligence

**Route:** `POST /doc-intelligence`

**Request body (multipart or JSON with base64):**
```json
{
  "document_text": "...extracted or pasted text...",
  "fields_to_extract": ["invoice_number", "date", "total_amount", "vendor_name"],
  "detect_anomalies": true
}
```

---

## Agent #5 — Social Content

**Route:** `POST /social-content`

**Request body:**
```json
{
  "topic": "Benefits of AI in Salesforce",
  "source_url": "https://blog.example.com/article",
  "platforms": ["linkedin", "twitter", "instagram"],
  "brand_tone": "professional and insightful",
  "posts_per_platform": 2
}
```

---

## Environment Variables

| Variable | Purpose | Where to set |
|----------|---------|--------------|
| `GROQ_API_KEY` | Groq API key (primary LLM) | HF Spaces secrets / local `.env` |
| `GEMINI_API_KEY` | Google Gemini key (backup/future use) | HF Spaces secrets / local `.env` |

Local dev: `.env` file in repo root (already gitignored and created):
```
GROQ_API_KEY=...
GEMINI_API_KEY=...
```

---

## HuggingFace Deployment Checklist

- [ ] Create HF Space: `salesforceninja-ai-agents`, SDK: Docker
- [ ] Link to this GitHub repo (`ai-agents-lab`)
- [ ] Add secret: `GROQ_API_KEY`
- [ ] Add secret: `GEMINI_API_KEY` (for future agents)
- [ ] Push code → auto deploys
- [ ] Verify live at: `https://salesforceninja-ai-agents.hf.space/health`

---

## Phase Roadmap

### Phase 1 — Lead Qualifier (Current)
- [x] CLAUDE.md + repo context setup
- [x] FastAPI main.py + CORS
- [x] requirements.txt
- [x] agents/lead_qualifier/prompts.py
- [x] agents/lead_qualifier/agent.py
- [x] api/routes/lead_qualifier.py
- [x] Dockerfile
- [ ] Deploy to HuggingFace Spaces
- [ ] Test full end-to-end flow

### Phase 2 — Web Scraper + Support Resolver
- [ ] agents/web_scraper/
- [ ] agents/support_resolver/
- [ ] api/routes/web_scraper.py
- [ ] api/routes/support_resolver.py

### Phase 3 — Doc Intelligence + Social Content + Polish
- [ ] agents/doc_intelligence/
- [ ] agents/social_content/
- [ ] api/routes/doc_intelligence.py
- [ ] api/routes/social_content.py

### Phase 4 — Launch
- [ ] Product Hunt launch
- [ ] AI directories submission
- [ ] Demo videos

---

## Coding Conventions

- Python 3.11+
- All agent functions are `async`
- Gemini calls use `google-generativeai` SDK
- Pydantic models for all request/response schemas (defined in routes)
- No secrets in code — always `os.getenv()`
- Return structured JSON always — never raw text
- Error responses: `{"error": "message", "detail": "..."}`
