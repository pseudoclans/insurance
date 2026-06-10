"""Damage Assessment Agent - Evaluates vehicle damage via GPT-4o Vision."""

import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import openai_client

router = APIRouter()


class DamageRequest(BaseModel):
    claim_id: str
    image_url: str


class DamageResponse(BaseModel):
    severity: str  # LOW, MEDIUM, HIGH
    estimated_cost: float
    description: str
    damaged_parts: list[str]


@router.post("/damage", response_model=DamageResponse)
async def assess_damage(request: DamageRequest):
    """Assess vehicle damage severity from uploaded photo using GPT-4o Vision."""
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert vehicle damage assessor for insurance claims. "
                        "Analyze the image and determine damage severity and estimated repair cost. "
                        "Return ONLY valid JSON."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": request.image_url, "detail": "high"},
                        },
                        {
                            "type": "text",
                            "text": (
                                "Assess this vehicle damage. Return JSON with:\n"
                                '- severity: "LOW" (cosmetic, <$1000), "MEDIUM" ($1000-$5000), "HIGH" (>$5000 or structural)\n'
                                "- estimated_cost: number in USD\n"
                                "- description: brief damage description\n"
                                "- damaged_parts: array of damaged vehicle parts"
                            ),
                        },
                    ],
                },
            ],
            response_format={"type": "json_object"},
            max_tokens=800,
        )

        result = json.loads(response.choices[0].message.content)
        return DamageResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Damage assessment failed: {str(e)}"
        )
