"use client";

import { useState } from "react";
import { Upload, FileText, Image, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function UploadClaimPage() {
  const [formData, setFormData] = useState({
    customer_name: "",
    policy_number: "",
    incident_date: "",
  });
  const [files, setFiles] = useState<{
    claim_form: File | null;
    police_report: File | null;
    damage_photo: File | null;
  }>({ claim_form: null, police_report: null, damage_photo: null });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create claim record
      const { data: claim, error: claimError } = await supabase
        .from("claims")
        .insert({
          customer_name: formData.customer_name,
          policy_number: formData.policy_number,
          incident_date: formData.incident_date,
          status: "pending",
        })
        .select()
        .single();

      if (claimError) throw claimError;

      // 2. Upload files to Supabase Storage
      const fileEntries = Object.entries(files).filter(([, f]) => f !== null);
      for (const [fileType, file] of fileEntries) {
        if (!file) continue;
        const path = `claims/${claim.id}/${fileType}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("claim-files")
          .upload(path, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("claim-files")
          .getPublicUrl(path);

        await supabase.from("claim_files").insert({
          claim_id: claim.id,
          file_type: fileType,
          file_url: urlData.publicUrl,
          file_name: file.name,
        });
      }

      // 3. Trigger processing pipeline
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/claims/${claim.id}/process`,
        { method: "POST" }
      );

      setClaimId(claim.id);
      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit claim. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="card p-12">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Claim Submitted Successfully
          </h2>
          <p className="text-slate-600 mb-6">
            Your claim ID is{" "}
            <span className="font-mono font-medium text-primary">
              {claimId}
            </span>
          </p>
          <p className="text-sm text-slate-500 mb-8">
            Our AI agents are now processing your claim. You can track the
            status in the Claim Status page.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ customer_name: "", policy_number: "", incident_date: "" });
              setFiles({ claim_form: null, police_report: null, damage_photo: null });
            }}
            className="btn-primary"
          >
            Submit Another Claim
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Submit Insurance Claim
        </h1>
        <p className="text-slate-600">
          Upload your documents and our AI agents will process your claim
          automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Details */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Customer Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-sm font-medium text-slate-700 mb-1">
                Customer Name
              </label>
              <input
                id="customer_name"
                type="text"
                required
                className="input-field"
                placeholder="John Doe"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="policy_number" className="block text-sm font-medium text-slate-700 mb-1">
                Policy Number
              </label>
              <input
                id="policy_number"
                type="text"
                required
                className="input-field"
                placeholder="POL-2024-XXXXX"
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="incident_date" className="block text-sm font-medium text-slate-700 mb-1">
                Incident Date
              </label>
              <input
                id="incident_date"
                type="date"
                required
                className="input-field"
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* File Uploads */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Documents & Evidence
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FileUploadCard
              label="Claim Form (PDF)"
              accept=".pdf"
              icon={<FileText className="w-8 h-8" />}
              file={files.claim_form}
              onChange={(f) => setFiles({ ...files, claim_form: f })}
            />
            <FileUploadCard
              label="Police Report (PDF)"
              accept=".pdf"
              icon={<FileText className="w-8 h-8" />}
              file={files.police_report}
              onChange={(f) => setFiles({ ...files, police_report: f })}
            />
            <FileUploadCard
              label="Damage Photo"
              accept=".png,.jpg,.jpeg"
              icon={<Image className="w-8 h-8" />}
              file={files.damage_photo}
              onChange={(f) => setFiles({ ...files, damage_photo: f })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full justify-center text-base py-4"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Submit Claim
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function FileUploadCard({
  label,
  accept,
  icon,
  file,
  onChange,
}: {
  label: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-accent hover:bg-accent/5 transition-colors duration-200 cursor-pointer text-center">
      <div className={file ? "text-success" : "text-slate-400"}>{icon}</div>
      <span className="text-sm font-medium text-slate-700 mt-2">{label}</span>
      {file && (
        <span className="text-xs text-success mt-1 truncate max-w-full">
          {file.name}
        </span>
      )}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
