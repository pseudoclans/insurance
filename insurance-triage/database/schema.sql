-- Insurance Triage - Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Claims table
CREATE TABLE claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    policy_number TEXT NOT NULL,
    incident_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'denied', 'review', 'escalated')),
    fraud_score INTEGER,
    damage_severity TEXT CHECK (damage_severity IN ('LOW', 'MEDIUM', 'HIGH')),
    estimated_cost DECIMAL(10,2),
    decision TEXT CHECK (decision IN ('APPROVE', 'REVIEW', 'ESCALATE')),
    confidence INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Claim files table
CREATE TABLE claim_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('claim_form', 'police_report', 'damage_photo')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table (Human Adjuster decisions)
CREATE TABLE reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    adjuster_name TEXT NOT NULL,
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'denied', 'request_info')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_policy ON claims(policy_number);
CREATE INDEX idx_claim_files_claim_id ON claim_files(claim_id);
CREATE INDEX idx_reviews_claim_id ON reviews(claim_id);

-- Row Level Security (RLS)
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies (open for now, tighten for production)
CREATE POLICY "Allow all on claims" ON claims FOR ALL USING (true);
CREATE POLICY "Allow all on claim_files" ON claim_files FOR ALL USING (true);
CREATE POLICY "Allow all on reviews" ON reviews FOR ALL USING (true);

-- Storage bucket (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('claim-files', 'claim-files', true);
