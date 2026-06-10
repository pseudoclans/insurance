"use client";

import { useState } from "react";
import { Search, Clock, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase, Claim } from "@/lib/supabase";

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "bg-slate-100 text-slate-700", icon: <Clock className="w-4 h-4" />, label: "Pending" },
  processing: { color: "bg-blue-100 text-blue-700", icon: <Loader2 className="w-4 h-4 animate-spin" />, label: "Processing" },
  approved: { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle className="w-4 h-4" />, label: "Approved" },
  denied: { color: "bg-red-100 text-red-700", icon: <XCircle className="w-4 h-4" />, label: "Denied" },
  review: { color: "bg-amber-100 text-amber-700", icon: <AlertTriangle className="w-4 h-4" />, label: "Under Review" },
  escalated: { color: "bg-orange-100 text-orange-700", icon: <AlertTriangle className="w-4 h-4" />, label: "Escalated" },
};

export default function ClaimStatusPage() {
  const [query, setQuery] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    const { data, error } = await supabase
      .from("claims")
      .select("*")
      .or(`policy_number.ilike.%${query}%,customer_name.ilike.%${query}%,id.eq.${query}`)
      .order("created_at", { ascending: false });

    if (!error && data) setClaims(data);
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Claim Status</h1>
        <p className="text-slate-600">
          Search by Claim ID, Policy Number, or Customer Name.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            className="input-field pl-12"
            placeholder="Enter Claim ID, Policy Number, or Customer Name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {searched && claims.length === 0 && !loading && (
        <div className="card text-center py-12">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No claims found matching your search.</p>
        </div>
      )}

      {claims.length > 0 && (
        <div className="space-y-4">
          {claims.map((claim) => {
            const status = statusConfig[claim.status] || statusConfig.pending;
            return (
              <div key={claim.id} className="card hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">
                        {claim.customer_name}
                      </h3>
                      <span className={`badge ${status.color} flex items-center gap-1`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Policy</span>
                        <p className="font-medium text-slate-900">{claim.policy_number}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Fraud Score</span>
                        <p className="font-medium text-slate-900">
                          {claim.fraud_score !== null ? `${claim.fraud_score}/100` : "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Damage</span>
                        <p className="font-medium text-slate-900">
                          {claim.damage_severity || "—"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Decision</span>
                        <p className="font-medium text-slate-900">
                          {claim.decision || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(claim.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
