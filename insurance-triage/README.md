# Insurance Triage - AI Claims Processing System

AI-powered insurance claims triage system with multi-agent pipeline, human-in-the-loop review, and UiPath Maestro orchestration.

## Architecture

```
User Uploads Claim
        ↓
Next.js Frontend → Supabase Storage
        ↓
UiPath Maestro Orchestration
        ↓
┌──────────┬──────────────┐
│ OCR Agent │ Policy Agent │
└──────────┴──────────────┘
        ↓
   Fraud Agent
        ↓
  Damage Agent
        ↓
  Decision Agent
        ↓
┌─────────────────────────────────┐
│ Auto Approve │ Human Review     │
└─────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, Tailwind CSS, Supabase JS |
| Backend | Python FastAPI, GPT-4o |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI Models | GPT-4o (Vision + Text) |
| Orchestration | UiPath Maestro |

## Quick Start

### 1. Database Setup

Run `database/schema.sql` in your Supabase SQL Editor. Create a storage bucket named `claim-files`.

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Fill in your keys
cd agents
uvicorn main:app --reload
```

API docs available at: `http://localhost:8000/docs`

### 3. Frontend

```bash
cd frontend/nextjs-app
npm install
cp .env.local.example .env.local  # Fill in your keys
npm run dev
```

App available at: `http://localhost:3000`

## Pages

1. **Upload Claim** — Submit documents (PDF, images) with customer details
2. **Claim Status** — Search and track claim processing
3. **Adjuster Dashboard** — Human review interface for escalated claims

## Agent Pipeline

| Agent | Function | Model |
|-------|----------|-------|
| OCR Agent | Extract text from documents | GPT-4o Vision |
| Policy Agent | Validate policy status/coverage | Rule-based + mock DB |
| Fraud Agent | Detect fraud indicators | GPT-4o |
| Damage Agent | Assess vehicle damage severity | GPT-4o Vision |
| Decision Agent | Final triage decision | Rule-based logic |

## Decision Rules

| Condition | Decision |
|-----------|----------|
| Fraud > 80 | ESCALATE |
| Policy Invalid | ESCALATE |
| Low fraud + Low damage + Valid policy | APPROVE |
| Fraud 30-60 | REVIEW |
| High damage + Low fraud | REVIEW |
| Fraud 61-80 | ESCALATE |
