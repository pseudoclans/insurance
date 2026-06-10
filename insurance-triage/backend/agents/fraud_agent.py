"""Fraud Detection Agent - Analyzes claims for fraud indicators using GPT-4o."""

import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from config import openai_client

router = APIRouter()


class FraudRequest(BaseModel):
    claim_id: str
    customer_name: str
    policy_number: str
    incident_date: str
    incident_description: str
    police_report_text: str | None = None


class FraudResponse(BaseModel):
    fraud_score: int
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    reasons: List[str]
    recommendation: str


@router.post("/fraud", response_model=FraudResponse)
async def detect_fraud(request: FraudRequest):
    """Analyze claim for fraud indicators using GPT-4o."""
    try:
        prompt = f"""Analyze this insurance claim for potential fraud indicators.

CLAIM DATA:
- Customer: {request.customer_name}
- Policy: {request.policy_number}
- Incident Date: {request.incident_date}
- Description: {request.incident_description}
- Police Report: {request.police_report_text or 'Not provided'}

ANALYZE FOR:
1. Inconsistent dates or timelines
2. Suspicious or vague wording
3. Conflicting information between description and police report
4. Missing critical information
5. Known fraud patterns (staged accidents, inflated claims, etc.)
6. Unusual filing timing (too fast or too delayed)

Return JSON with:
- fraud_score: 0-100 (0 = no fraud indicators, 100 = definite fraud)
- risk_level: "LOW" (0-30), "MEDIUM" (31-60), "HIGH" (61-80), "CRITICAL" (81-100)
- reasons: array of specific fraud indicators found
- recommendation: "APPROVE", "REVIEW", or "ESCALATE"
"""

        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert insurance fraud analyst. Be thorough but fair. Return ONLY valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        result = json.loads(response.choices[0].message.content)
        return FraudResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fraud analysis failed: {str(e)}")
