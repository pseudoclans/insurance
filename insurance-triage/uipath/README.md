# UiPath Maestro Orchestration

## Workflow Overview

UiPath Maestro orchestrates the AI agent pipeline as a sequential workflow with human-in-the-loop capabilities.

## Flow

```
Claim Submitted
    ↓
OCR Agent (POST /ocr)
    ↓
Policy Validation Agent (POST /policy)
    ↓
Fraud Detection Agent (POST /fraud)
    ↓
Damage Assessment Agent (POST /damage)
    ↓
Decision Agent (POST /decision)
    ↓
┌─────────────────────────────────────┐
│  Decision = APPROVE → Auto Approve  │
│  Decision = REVIEW  → Human Task    │
│  Decision = ESCALATE → Adjuster     │
└─────────────────────────────────────┘
```

## API Endpoints (FastAPI)

| Agent | Endpoint | Method |
|-------|----------|--------|
| OCR | `/ocr` | POST |
| Policy | `/policy` | POST |
| Fraud | `/fraud` | POST |
| Damage | `/damage` | POST |
| Decision | `/decision` | POST |
| Full Pipeline | `/api/claims/{id}/process` | POST |

## UiPath Maestro Configuration

### 1. Create API Activities

For each agent, create an HTTP Request activity:
- Method: POST
- URL: `https://your-api-url.com/{endpoint}`
- Headers: `Content-Type: application/json`
- Body: JSON payload matching the agent's request schema

### 2. Decision Logic

```
IF decision.decision == "APPROVE" THEN
    → Update claim status to "approved"
    → Send approval notification

ELSE IF decision.decision == "REVIEW" THEN
    → Create Human Task
    → Assign to Claims Reviewer queue
    → Wait for human decision

ELSE IF decision.decision == "ESCALATE" THEN
    → Create High Priority Human Task
    → Assign to Senior Adjuster queue
    → Flag for immediate review
```

### 3. Human Task Form Fields

| Field | Type | Source |
|-------|------|--------|
| Claim Summary | Text | OCR Agent |
| Fraud Score | Number | Fraud Agent |
| Fraud Reasons | List | Fraud Agent |
| Damage Report | Text | Damage Agent |
| Estimated Cost | Currency | Damage Agent |
| Policy Status | Text | Policy Agent |
| AI Recommendation | Text | Decision Agent |
| Confidence | Percentage | Decision Agent |

### Actions Available:
- Approve
- Reject
- Request More Information

### 4. Deployment

Deploy the FastAPI backend to:
- Railway (recommended for demos)
- Render
- Azure App Service

Configure UiPath Maestro to call the deployed API URL.
