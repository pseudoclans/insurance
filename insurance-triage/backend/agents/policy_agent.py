"""Policy Validation Agent - Validates claims against policy database."""

from fastapi import APIRouter
from pydantic import BaseModel
from config import openai_client

router = APIRouter()

# Mock policy database
MOCK_POLICIES = {
    "POL-2024-00123": {
        "holder": "John Doe",
        "type": "comprehensive",
        "status": "active",
        "expiry": "2025-12-31",
        "coverage_limit": 50000,
    },
    "POL-2024-00456": {
        "holder": "Jane Smith",
        "type": "third_party",
        "status": "active",
        "expiry": "2025-06-30",
        "coverage_limit": 25000,
    },
    "POL-2023-00789": {
        "holder": "Bob Wilson",
        "type": "comprehensive",
        "status": "expired",
        "expiry": "2024-01-15",
        "coverage_limit": 75000,
    },
}


class PolicyRequest(BaseModel):
    policy_number: str
    incident_date: str


class PolicyResponse(BaseModel):
    valid: bool
    policy_active: bool
    coverage_type: str
    coverage_limit: float
    policy_expired: bool
    reason: str


@router.post("/policy", response_model=PolicyResponse)
async def validate_policy(request: PolicyRequest):
    """Validate policy number against the insurance database."""
    policy = MOCK_POLICIES.get(request.policy_number)

    if not policy:
        return PolicyResponse(
            valid=False,
            policy_active=False,
            coverage_type="none",
            coverage_limit=0,
            policy_expired=False,
            reason="Policy number not found in database",
        )

    is_expired = request.incident_date > policy["expiry"]
    is_active = policy["status"] == "active" and not is_expired

    reason = "Policy is valid and active"
    if is_expired:
        reason = f"Policy expired on {policy['expiry']}"
    elif policy["status"] != "active":
        reason = f"Policy status: {policy['status']}"

    return PolicyResponse(
        valid=is_active,
        policy_active=is_active,
        coverage_type=policy["type"],
        coverage_limit=policy["coverage_limit"],
        policy_expired=is_expired,
        reason=reason,
    )
