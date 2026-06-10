"""Insurance Triage API - Master FastAPI Gateway with Swagger documentation."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ocr_agent import router as ocr_router
from policy_agent import router as policy_router
from fraud_agent import router as fraud_router
from damage_agent import router as damage_router
from decision_agent import router as decision_router
from config import supabase_client

app = FastAPI(
    title="Insurance Triage AI API",
    description=(
        "AI-powered insurance claims processing pipeline. "
        "Orchestrates OCR, Policy Validation, Fraud Detection, "
        "Damage Assessment, and Decision agents."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register individual agent routers
app.include_router(ocr_router, tags=["OCR Agent"])
app.include_router(policy_router, tags=["Policy Agent"])
app.include_router(fraud_router, tags=["Fraud Agent"])
app.include_router(damage_router, tags=["Damage Agent"])
app.include_router(decision_router, tags=["Decision Agent"])


class PipelineResponse(BaseModel):
    claim_id: str
    status: str
    ocr_result: dict | None = None
    policy_result: dict | None = None
    fraud_result: dict | None = None
    damage_result: dict | None = None
    decision_result: dict | None = None


@app.post("/api/claims/{claim_id}/process", response_model=PipelineResponse, tags=["Pipeline"])
async def process_claim_pipeline(claim_id: str):
    """
    Full pipeline: Runs all agents sequentially on a claim.

    Flow: OCR → Policy Validation → Fraud Detection → Damage Assessment → Decision
    """
    # Update status to processing
    supabase_client.table("claims").update({"status": "processing"}).eq("id", claim_id).execute()

    # Get claim files
    files_resp = supabase_client.table("claim_files").select("*").eq("claim_id", claim_id).execute()
    files = {f["file_type"]: f["file_url"] for f in files_resp.data}

    # Get claim data
    claim_resp = supabase_client.table("claims").select("*").eq("id", claim_id).single().execute()
    claim = claim_resp.data

    results = {}

    # Step 1: OCR
    from ocr_agent import extract_document, OCRRequest

    if "claim_form" in files:
        ocr_req = OCRRequest(claim_id=claim_id, file_url=files["claim_form"], file_type="pdf")
        results["ocr"] = await extract_document(ocr_req)

    # Step 2: Policy Validation
    from policy_agent import validate_policy, PolicyRequest

    policy_req = PolicyRequest(
        policy_number=claim["policy_number"],
        incident_date=claim.get("incident_date", ""),
    )
    results["policy"] = await validate_policy(policy_req)

    # Step 3: Fraud Detection
    from fraud_agent import detect_fraud, FraudRequest

    ocr_data = results.get("ocr")
    fraud_req = FraudRequest(
        claim_id=claim_id,
        customer_name=claim["customer_name"],
        policy_number=claim["policy_number"],
        incident_date=claim.get("incident_date", ""),
        incident_description=ocr_data.incident_description if ocr_data else "No description available",
        police_report_text=None,
    )
    results["fraud"] = await detect_fraud(fraud_req)

    # Step 4: Damage Assessment
    from damage_agent import assess_damage, DamageRequest

    if "damage_photo" in files:
        damage_req = DamageRequest(claim_id=claim_id, image_url=files["damage_photo"])
        results["damage"] = await assess_damage(damage_req)

    # Step 5: Decision
    from decision_agent import make_decision, DecisionRequest

    damage_data = results.get("damage")
    decision_req = DecisionRequest(
        claim_id=claim_id,
        fraud_score=results["fraud"].fraud_score,
        fraud_risk_level=results["fraud"].risk_level,
        policy_valid=results["policy"].valid,
        policy_expired=results["policy"].policy_expired,
        damage_severity=damage_data.severity if damage_data else "MEDIUM",
        estimated_cost=damage_data.estimated_cost if damage_data else 0,
    )
    results["decision"] = await make_decision(decision_req)

    # Update claim in database
    final_decision = results["decision"]
    status_map = {"APPROVE": "approved", "REVIEW": "review", "ESCALATE": "escalated"}

    supabase_client.table("claims").update({
        "status": status_map.get(final_decision.decision, "review"),
        "fraud_score": results["fraud"].fraud_score,
        "damage_severity": damage_data.severity if damage_data else None,
        "estimated_cost": damage_data.estimated_cost if damage_data else None,
        "decision": final_decision.decision,
        "confidence": final_decision.confidence,
    }).eq("id", claim_id).execute()

    return PipelineResponse(
        claim_id=claim_id,
        status=status_map.get(final_decision.decision, "review"),
        ocr_result=results.get("ocr").model_dump() if results.get("ocr") else None,
        policy_result=results["policy"].model_dump(),
        fraud_result=results["fraud"].model_dump(),
        damage_result=damage_data.model_dump() if damage_data else None,
        decision_result=final_decision.model_dump(),
    )


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "insurance-triage-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
