"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth-client";
import { useToast } from "@/components/toast-context";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ShoppingBag,
  Store,
  Sparkles,
  Shield,
  ArrowRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  LogOut,
  Copy,
  Check,
  Rocket,
  Plus,
  Key,
  CreditCard,
  Palette,
  Lock,
} from "lucide-react";

const ACCENT_COLORS = [
  { name: "Indigo", hex: "#6366f1" },
  { name: "Violet", hex: "#8b5cf6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Cyan", hex: "#06b6d4" },
];

export default function OnboardingClient({ user }: { user: any }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [description, setDescription] = useState("");
  const [accentColor, setAccentColor] = useState("#6366f1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdShop, setCreatedShop] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustomized) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generated);
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setIsSlugCustomized(true);
    const cleaned = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    setSlug(cleaned);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      const msg = "Please enter a name for your store";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!slug.trim() || slug.length < 3) {
      const msg = "Store slug must contain at least 3 characters (letters, numbers, hyphens)";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/storefront", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || `Official ${name.trim()} storefront`,
          accentColor,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error || "Failed to create store";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Store successfully created!");
      setCreatedShop(data.shop);
    } catch (err: any) {
      const msg = err?.message || "Could not connect to the server";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyStoreUrl() {
    if (!createdShop) return;
    const url = `${window.location.origin}/${createdShop.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success("Storefront URL copied to clipboard!");
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <div
      className="page-transition"
      style={{
        minHeight: "100vh",
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s ease",
      }}
    >
      {/* Top Navbar */}
      <header
        style={{
          height: 64,
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          backdropFilter: "blur(16px)",
          padding: "0 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px rgba(99, 102, 241, 0.4)",
            }}
          >
            <ShoppingBag size={18} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em" }}>Vaultly</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ThemeToggle />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              borderRadius: 20,
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: "var(--color-primary)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--color-muted-foreground)" }}>
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="btn btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12, gap: 6, color: "var(--color-danger)" }}
          >
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          maxWidth: 680,
          margin: "0 auto",
          padding: "48px 24px 80px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {createdShop ? (
          /* Redesigned Vaultly Obsidian Success Screen */
          <div
            className="card animate-fade-in"
            style={{
              padding: "44px 36px",
              borderRadius: 24,
              background: "var(--card-bg, #0f1015)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 25px 65px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}
          >
            {/* Ambient Radial Mesh Lighting */}
            <div
              style={{
                position: "absolute",
                top: -60,
                left: "50%",
                transform: "translateX(-50%)",
                width: 420,
                height: 200,
                background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, rgba(99, 102, 241, 0.07) 45%, transparent 70%)",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {/* Header Section */}
            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "5px 14px",
                  borderRadius: 99,
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  color: "var(--color-success, #10b981)",
                  fontSize: 11.5,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  marginBottom: 16,
                  boxShadow: "0 0 16px rgba(16, 185, 129, 0.12)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 8px #10b981",
                  }}
                />
                Storefront Online • Network Ready
              </div>

              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 20,
                  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(99, 102, 241, 0.15))",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
                }}
              >
                <CheckCircle2 size={34} style={{ color: "#10b981" }} />
              </div>

              <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--color-foreground)", marginBottom: 8 }}>
                Your Store is Ready!
              </h1>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
                Store <strong style={{ color: "var(--color-foreground)" }}>{createdShop.name}</strong> is live. You can now publish digital products, stock serial keys, and start processing instant customer checkouts.
              </p>
            </div>

            {/* Storefront URL Mini Browser Pill */}
            <div
              style={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                position: "relative",
                zIndex: 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)" }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
                  <Lock size={13} style={{ color: "#10b981", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--color-muted-foreground)", flexShrink: 0 }}>
                    vaultly.io/
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--color-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {createdShop.slug}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={copyStoreUrl}
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
                >
                  {copiedUrl ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                  <span>{copiedUrl ? "Copied" : "Copy"}</span>
                </button>
                <a
                  href={`/${createdShop.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ padding: "6px 12px", fontSize: 12, gap: 6 }}
                >
                  <span>Visit</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            {/* Quick Launchpad: 3 Next Steps */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Recommended Next Steps
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                {/* Step 1 */}
                <div
                  className="card card-hover-glow"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/dashboard/products/new")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(99, 102, 241, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#818cf8" }}>
                      <Key size={16} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(99, 102, 241, 0.12)", color: "#a5b4fc" }}>
                      Step 1
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 2 }}>
                      Add License Keys
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--color-muted-foreground)", lineHeight: 1.4 }}>
                      Upload digital codes with automated instant delivery.
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div
                  className="card card-hover-glow"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/dashboard/earnings")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16, 185, 129, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                      <CreditCard size={16} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(16, 185, 129, 0.12)", color: "#34d399" }}>
                      Step 2
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 2 }}>
                      Connect Payouts
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--color-muted-foreground)", lineHeight: 1.4 }}>
                      Configure payout wallets or automated bank settlements.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div
                  className="card card-hover-glow"
                  style={{
                    padding: "14px 16px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => router.push("/dashboard/storefront")}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(244, 63, 94, 0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fb7185" }}>
                      <Palette size={16} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: "rgba(244, 63, 94, 0.12)", color: "#fb7185" }}>
                      Step 3
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 2 }}>
                      Theme & Branding
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--color-muted-foreground)", lineHeight: 1.4 }}>
                      Customize banner, brand colors, and credentials.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 1 }}>
              <button
                onClick={() => {
                  router.push("/dashboard");
                }}
                className="btn btn-primary"
                style={{ width: "100%", height: 48, fontSize: 14.5, fontWeight: 700, gap: 8 }}
              >
                <span>Enter Merchant Dashboard</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Centered Store Creation Wizard Form */
          <div className="animate-fade-in">
            {/* Header Badge & Title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  borderRadius: 99,
                  background: "rgba(99, 102, 241, 0.12)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  color: "var(--color-primary-light)",
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 16,
                }}
              >
                <Sparkles size={14} />
                Store Configuration • Step 1 of 1
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 10 }}>
                Configure Your Digital Storefront
              </h1>
              <p style={{ color: "var(--color-muted-foreground)", fontSize: 15, maxWidth: 520, margin: "0 auto" }}>
                Set up your brand and URL. You will immediately be able to add digital products, license keys, and accept instant payments.
              </p>
            </div>

            {/* Focused Centered Card Form */}
            <div
              className="card"
              style={{
                padding: "36px 32px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                borderRadius: 20,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
              }}
            >
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                {/* Store Name */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Store Name <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <Store
                      size={17}
                      style={{ position: "absolute", left: 14, top: 13, color: "var(--color-muted-foreground)" }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Cyber Vault, Pro Digital..."
                      value={name}
                      onChange={handleNameChange}
                      required
                      style={{ paddingLeft: 42, height: 44, fontSize: 15 }}
                      autoFocus
                    />
                  </div>
                  <span style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 6, display: "block" }}>
                    Displayed at the top of your shop and on customer invoices.
                  </span>
                </div>

                {/* Store Slug / URL */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Storefront Slug (URL Subpath) <span style={{ color: "var(--color-danger)" }}>*</span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <span
                      style={{
                        padding: "0 14px",
                        height: 44,
                        display: "flex",
                        alignItems: "center",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRight: "1px solid var(--color-border)",
                        color: "var(--color-muted-foreground)",
                        fontSize: 13,
                        fontWeight: 500,
                        userSelect: "none",
                      }}
                    >
                      vaultly.io/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={handleSlugChange}
                      placeholder="my-store"
                      required
                      style={{
                        flex: 1,
                        height: 44,
                        padding: "0 14px",
                        background: "transparent",
                        border: "none",
                        color: "var(--color-foreground)",
                        fontSize: 14,
                        fontWeight: 600,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                      Lowercase letters, numbers, and hyphens only.
                    </span>
                    <span style={{ fontSize: 12, color: "var(--color-primary-light)", fontWeight: 600 }}>
                      {slug ? `vaultly.io/${slug}` : ""}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Tagline / Description
                  </label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="e.g. Automated instant 24/7 delivery for accounts and digital software keys."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ padding: 12, fontSize: 14, resize: "none" }}
                  />
                </div>

                {/* Accent Color */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
                    Accent Branding Color
                  </label>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {ACCENT_COLORS.map((col) => (
                      <button
                        key={col.hex}
                        type="button"
                        onClick={() => setAccentColor(col.hex)}
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: "50%",
                          background: col.hex,
                          border: accentColor === col.hex ? "3px solid var(--color-foreground)" : "2px solid transparent",
                          boxShadow: accentColor === col.hex ? `0 0 14px ${col.hex}` : "none",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title={col.name}
                      >
                        {accentColor === col.hex && <CheckCircle2 size={18} color="white" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Security Policy Alert */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: "var(--radius-md)",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <Shield size={18} style={{ color: "var(--color-primary-light)", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--color-muted-foreground)" }}>
                    <strong style={{ color: "var(--color-foreground)" }}>Store Policy:</strong> Stores start in private preview mode. Once configured, you can submit an approval request to the administration team to make your shop publicly accessible.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim() || !slug.trim()}
                  className="btn btn-primary"
                  style={{ height: 48, fontSize: 15, fontWeight: 700, gap: 10, marginTop: 6 }}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                  {loading ? "Creating store..." : "Create Store & Enter Dashboard"}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
