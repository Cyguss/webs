"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Check, Loader2, Save } from "lucide-react";
import { useToast } from "@/components/toast-context";

interface ProfileClientProps {
  initialName: string;
  email: string;
}

export function ProfileClient({ initialName, email }: ProfileClientProps) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(initialName || "");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const hasChanges = name.trim() !== (initialName || "").trim();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Invalid Name", "Display name must be at least 2 characters long.");
      return;
    }

    setLoading(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile name");
      }

      toast.success("Profile Updated", "Your display name has been successfully changed.");
      setSavedSuccess(true);
      router.refresh();
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      toast.error("Error", err.message || "Could not save display name");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={17} color="var(--color-foreground)" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-foreground)" }}>
              Account Profile
            </h3>
            <p style={{ fontSize: 12, color: "var(--color-muted-foreground)", margin: "2px 0 0 0" }}>
              Your merchant public display name and account email
            </p>
          </div>
        </div>

        {savedSuccess && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: "#10b981",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              padding: "4px 10px",
              borderRadius: 99,
            }}
          >
            <Check size={13} /> Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {/* Display Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="label">
              Display Name <span style={{ color: "var(--color-primary-light)", fontSize: 11 }}>(Changeable)</span>
            </label>
            <input
              type="text"
              className="input-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satoshi Vault"
              maxLength={50}
              required
              style={{ height: 42 }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
              Visible on customer receipts, invoices, and your merchant dashboard.
            </span>
          </div>

          {/* Email Address — Read Only */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label className="label">Account Email</label>
            <input
              type="email"
              className="input-base"
              defaultValue={email}
              disabled
              style={{
                height: 42,
                opacity: 0.7,
                cursor: "not-allowed",
                background: "var(--color-surface-2)",
              }}
            />
            <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
              Primary sign-in and security notifications address.
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 4 }}>
          <button
            type="submit"
            disabled={!hasChanges || loading}
            className="btn btn-primary"
            style={{
              height: 38,
              padding: "0 18px",
              fontSize: 13,
              gap: 8,
              opacity: !hasChanges && !loading ? 0.5 : 1,
              cursor: !hasChanges && !loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
