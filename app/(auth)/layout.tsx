import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ShoppingBag } from "lucide-react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  if (session) {
    redirect("/dashboard");
  }
  return (
    <div
      className="gradient-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Link href="/" style={{ textDecoration: "none", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1, #c084fc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={20} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 22, color: "var(--color-foreground)" }}>
            Vaultly
          </span>
        </div>
      </Link>
      <div className="page-transition" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}
