"""Decision Agent - Makes final triage decision based on all agent outputs."""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class DecisionRequest(BaseModel):
    claim_id: str
    fraud_score: int
    fraud_risk_level: str
    policy_valid: bool
    policy_expired: bool
    damage_severity: str
    estimated_cost: float


class DecisionResponse(BaseModel):
    decision: str  # APPROVE, REVIEW, ESCALATE
    confidence: int
    reasons: list[str]


@router.post("/decision", response_model=DecisionResponse)
async def make_decision(request: DecisionRequest):
    """Make final triage decision based on all agent outputs."""
    reasons = []
    decision = "REVIEW"
    confidence = 50

    # Rule 1: High fraud score → ESCALATE
    if request.fraud_score > 80:
        decision = "ESCALATE"
        confidence = 95
        reasons.append(f"Critical fraud score: {request.fraud_score}/100")

    # Rule 2: Invalid or expired policy → ESCALATE
    elif not request.policy_valid:
        decision = "ESCALATE"
        confidence = 90
        if request.policy_expired:
            reasons.append("Policy is expired")
        else:
            reasons.append("Policy validation failed")

    # Rule 3: Low risk, low damage → AUTO APPROVE
    elif (
        request.fraud_score < 30
        and request.damage_severity == "LOW"
        and request.policy_valid
    ):
        decision = "APPROVE"
        confidence = 92
        reasons.append("Low fraud risk, minor damage, valid policy")

    # Rule 4: Medium fraud + any severity → REVIEW
    elif request.fraud_score >= 30 and request.fraud_score <= 60:
        decision = "REVIEW"
        confidence = 70
        reasons.append(f"Moderate fraud indicators: {request.fraud_score}/100")

    # Rule 5: High damage but low fraud → REVIEW (cost verification)
    elif request.damage_severity == "HIGH" and request.fraud_score < 60:
        decision = "REVIEW"
        confidence = 75
        reasons.append(
            f"High damage (${request.estimated_cost:,.0f}) requires cost verification"
        )

    # Rule 6: Fraud 61-80 → ESCALATE
    elif request.fraud_score > 60:
        decision = "ESCALATE"
        confidence = 85
        reasons.append(f"High fraud score: {request.fraud_score}/100")

    # Default: REVIEW
    else:
        decision = "REVIEW"
        confidence = 60
        reasons.append("Claim requires manual review")

    return DecisionResponse(
        decision=decision,
        confidence=confidence,
        reasons=reasons,
    )
