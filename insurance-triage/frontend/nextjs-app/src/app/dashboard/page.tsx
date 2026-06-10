"use client";

import { useState, useEffect } from "react";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Loader2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { supabase, Claim } from "@/lib/supabase";

export default function AdjusterDashboard() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [adjusterName, setAdjusterName] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    const { data } = await supabase
      .from("claims")
      .select("*")
      .in("status", ["review", "escalated"])
      .order("created_at", { ascending: false });

    if (data) setClaims(data);
    setLoading(false);
  };

  const handleDecision = async (decision: "approved" | "denied" | "request_info") => {
    if (!selectedClaim || !adjusterName.trim()) return;
    setSubmittingReview(true);

    await supabase.from("reviews").insert({
      claim_id: selectedClaim.id,
      adjuster_name: adjusterName,
      decision,
      notes: reviewNote,
    });

    const newStatus = decision === "request_info" ? "review" : decision;
    await supabase
      .from("claims")
      .update({ status: newStatus, decision })
      .eq("id", selectedClaim.id);

    setSelectedClaim(null);
    setReviewNote("");
    setSubmittingReview(false);
    fetchClaims();
  };

  const stats = {
    total: claims.length,
    escalated: claims.filter((c) => c.status === "escalated").length,
    review: claims.filter((c) => c.status === "review").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Human Adjuster Dashboard
        </h1>
        <p className="text-slate-600">
          Review AI-flagged claims that need human judgment.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500">Pending Review</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.escalated}</p>
            <p className="text-sm text-slate-500">Escalated</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{stats.review}</p>
            <p className="text-sm text-slate-500">Needs Review</p>
          </div>
        </div>
      </div>

      {/* Claims List */}
      {claims.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
          <p className="text-slate-600 font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm">No claims need manual review right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedClaim(claim)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      claim.status === "escalated"
                        ? "bg-orange-100"
                        : "bg-amber-100"
                    }`}
                  >
                    {claim.status === "escalated" ? (
                      <ShieldAlert className="w-5 h-5 text-orange-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {claim.customer_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Policy: {claim.policy_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-slate-500">Fraud Score</p>
                    <p
                      className={`font-bold ${
                        (claim.fraud_score ?? 0) > 70
                          ? "text-danger"
                          : (claim.fraud_score ?? 0) > 40
                          ? "text-warning"
                          : "text-success"
                      }`}
                    >
                      {claim.fraud_score ?? "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Damage</p>
                    <p className="font-bold text-slate-900">
                      {claim.damage_severity ?? "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-500">Cost Est.</p>
                    <p className="font-bold text-slate-900">
                      {claim.estimated_cost
                        ? `$${claim.estimated_cost.toLocaleString()}`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Review Claim
            </h2>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Customer</span>
                  <p className="font-medium">{selectedClaim.customer_name}</p>
                </div>
                <div>
                  <span className="text-slate-500">Policy</span>
                  <p className="font-medium">{selectedClaim.policy_number}</p>
                </div>
                <div>
                  <span className="text-slate-500">Fraud Score</span>
                  <p className="font-bold text-danger">
                    {selectedClaim.fraud_score}/100
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Damage Severity</span>
                  <p className="font-medium">{selectedClaim.damage_severity}</p>
                </div>
                <div>
                  <span className="text-slate-500">Estimated Cost</span>
                  <p className="font-medium">
                    ${selectedClaim.estimated_cost?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">AI Recommendation</span>
                  <p className="font-medium uppercase">
                    {selectedClaim.decision}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="adjuster" className="block text-sm font-medium text-slate-700 mb-1">
                  Adjuster Name
                </label>
                <input
                  id="adjuster"
                  type="text"
                  className="input-field"
                  placeholder="Your name"
                  value={adjusterName}
                  onChange={(e) => setAdjusterName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Review Notes
                </label>
                <textarea
                  id="notes"
                  className="input-field min-h-[100px] resize-none"
                  placeholder="Add your observations..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleDecision("approved")}
                disabled={submittingReview || !adjusterName.trim()}
                className="flex-1 bg-success hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleDecision("denied")}
                disabled={submittingReview || !adjusterName.trim()}
                className="flex-1 bg-danger hover:bg-red-600 text-white font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Deny
              </button>
              <button
                onClick={() => handleDecision("request_info")}
                disabled={submittingReview || !adjusterName.trim()}
                className="flex-1 bg-warning hover:bg-amber-600 text-white font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Request Info
              </button>
            </div>

            <button
              onClick={() => setSelectedClaim(null)}
              className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
