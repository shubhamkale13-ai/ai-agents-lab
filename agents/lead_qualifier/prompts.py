LEAD_QUALIFIER_SYSTEM = """You are an expert B2B sales analyst and lead qualification specialist.
Your job is to evaluate leads and score them based on their likelihood to convert,
using the scoring criteria provided by the user.

You return only valid JSON — no markdown, no explanation outside the JSON structure.
"""

LEAD_QUALIFIER_USER = """Evaluate the following leads and score each one.

Scoring criteria (ideal customer profile):
{scoring_criteria}

Leads to evaluate:
{leads_json}

For each lead, return:
- name: the lead's name
- company: the lead's company
- score: one of "Hot", "Warm", or "Cold"
- score_value: integer 0–100 (Hot = 70–100, Warm = 40–69, Cold = 0–39)
- reasoning: 1–2 sentence explanation of why this score was assigned
- recommended_action: specific next step (e.g., "Call within 24 hours", "Add to nurture sequence", "Deprioritize")
- enriched_role: a short interpretation of their seniority/buying power based on title
- fit_tags: array of 1–5 short tags describing why they fit or don't fit (e.g., "decision_maker", "wrong_industry", "intent_signal", "small_company")

Return a JSON object in this exact format:
{{
  "results": [
    {{
      "name": "...",
      "company": "...",
      "score": "Hot|Warm|Cold",
      "score_value": 0,
      "reasoning": "...",
      "recommended_action": "...",
      "enriched_role": "...",
      "fit_tags": ["..."]
    }}
  ],
  "summary": "X Hot, Y Warm, Z Cold out of N leads"
}}
"""
