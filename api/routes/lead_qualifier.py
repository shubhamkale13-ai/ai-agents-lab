from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Literal
from agents.lead_qualifier.agent import qualify_leads

router = APIRouter(prefix="/lead-qualifier", tags=["Lead Qualifier"])


class Lead(BaseModel):
    name: str = Field(..., description="Full name of the lead")
    company: str = Field(..., description="Company name")
    title: str = Field(default="", description="Job title")
    email: str = Field(default="", description="Email address")
    linkedin_url: str = Field(default="", description="LinkedIn profile URL")
    notes: str = Field(default="", description="Any additional context or notes")


class LeadQualifierRequest(BaseModel):
    leads: list[Lead] = Field(..., min_length=1, max_length=50, description="List of leads to qualify (max 50)")
    scoring_criteria: str = Field(
        default="B2B company with budget authority, 50-500 employees, decision maker",
        description="Describe your ideal customer profile",
    )
    output_format: Literal["json", "csv"] = Field(default="json")


class LeadResult(BaseModel):
    name: str
    company: str
    score: Literal["Hot", "Warm", "Cold"]
    score_value: int
    reasoning: str
    recommended_action: str
    enriched_role: str
    fit_tags: list[str]


class LeadQualifierResponse(BaseModel):
    results: list[LeadResult]
    summary: str
    csv_data: str = ""


@router.post("", response_model=LeadQualifierResponse)
async def run_lead_qualifier(request: LeadQualifierRequest) -> LeadQualifierResponse:
    leads_as_dicts = [lead.model_dump() for lead in request.leads]

    try:
        result = await qualify_leads(
            leads=leads_as_dicts,
            scoring_criteria=request.scoring_criteria,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    if request.output_format == "csv":
        return LeadQualifierResponse(
            results=result["results"],
            summary=result["summary"],
            csv_data=result["csv_data"],
        )

    return LeadQualifierResponse(
        results=result["results"],
        summary=result["summary"],
        csv_data=result.get("csv_data", ""),
    )
