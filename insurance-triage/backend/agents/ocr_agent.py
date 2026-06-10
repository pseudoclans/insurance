"""OCR Agent - Extracts structured data from claim documents using GPT-4o Vision."""

import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import openai_client, supabase_client

router = APIRouter()


class OCRRequest(BaseModel):
    claim_id: str
    file_url: str
    file_type: str  # "pdf" or "image"


class OCRResponse(BaseModel):
    customer_name: str
    policy_number: str
    incident_date: str
    incident_description: str
    claim_id: str


@router.post("/ocr", response_model=OCRResponse)
async def extract_document(request: OCRRequest):
    """Extract structured data from a claim document using GPT-4o Vision."""
    try:
        # Build the message content based on file type
        messages = [
            {
                "role": "system",
                "content": (
                    "You are an insurance document OCR specialist. "
                    "Extract the following fields from the document: "
                    "customer_name, policy_number, incident_date (YYYY-MM-DD format), "
                    "incident_description. "
                    "Return ONLY valid JSON with these exact keys. "
                    "If a field is not found, use 'NOT_FOUND' as the value."
                ),
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": request.file_url, "detail": "high"},
                    },
                    {
                        "type": "text",
                        "text": "Extract all insurance claim information from this document.",
                    },
                ],
            },
        ]

        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            response_format={"type": "json_object"},
            max_tokens=1000,
        )

        result = eval(response.choices[0].message.content)
        result["claim_id"] = request.claim_id

        return OCRResponse(**result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR extraction failed: {str(e)}")
