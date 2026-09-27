import { Loader2 } from "lucide-react";

export default function OnboardingLoading() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-background)",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 30px rgba(255, 255, 255, 0.05)",
        }}
      >
        <Loader2 size={26} className="animate-spin" style={{ color: "var(--color-foreground)" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted-foreground)", letterSpacing: "0.02em" }}>
        Loading Onboarding...
      </span>
    </div>
  );
}
