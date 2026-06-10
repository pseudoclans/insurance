import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Claim = {
  id: string;
  customer_name: string;
  policy_number: string;
  incident_date: string;
  status: "pending" | "processing" | "approved" | "denied" | "review" | "escalated";
  fraud_score: number | null;
  damage_severity: string | null;
  estimated_cost: number | null;
  decision: string | null;
  confidence: number | null;
  created_at: string;
};

export type ClaimFile = {
  id: string;
  claim_id: string;
  file_type: "claim_form" | "police_report" | "damage_photo";
  file_url: string;
  file_name: string;
};

export type Review = {
  id: string;
  claim_id: string;
  adjuster_name: string;
  decision: "approved" | "denied" | "request_info";
  notes: string;
  created_at: string;
};
