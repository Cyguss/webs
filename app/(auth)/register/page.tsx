"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp, signIn, useSession } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path fill="#EA4335" d="M12 5c1.56 0 2.97.55 4.09 1.45l3.07-3.07C17.3 1.63 14.85 1 12 1 7.6 1 3.82 3.51 2.01 7.18l3.66 2.84C6.54 7.2 9.04 5 12 5z" />
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.66 2.84c2.14-1.98 3.76-4.91 3.76-8.66z" />
      <path fill="#FBBC05" d="M5.67 14.02a7.1 7.1 0 0 1 0-4.04L2.01 7.18A11.97 11.97 0 0 0 1 12c0 1.92.46 3.74 1.01 4.82l3.66-2.8z" />
      <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.66-2.84c-1.08.72-2.45 1.16-4.27 1.16-2.96 0-5.46-2.2-6.33-5.02L2.01 16.23C3.82 20.49 7.6 23 12 23z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const toast = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session && !sessionPending) {
      router.replace("/dashboard");
    }
  }, [session, sessionPending, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        const msg = result.error.message || "Could not create account";
        setError(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }

      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err?.message || "Failed to create account";
      setError(msg);
      toast.error(msg);
      setLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    setError("");
    try {
      const res = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      if (res?.error) {
        let msg = res.error.message || "Failed to sign up with Google";
        if (res.error.message?.toLowerCase().includes("not found")) {
          msg = "Google sign-up requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET configured in .env.local.";
        }
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = "Google sign-up requires GOOGLE_CLIENT_ID configured in .env.local.";
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <div className="card animate-fade-in" style={{ width: "100%", maxWidth: 420 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Create your account</h1>
      <p style={{ color: "var(--color-muted-foreground)", marginBottom: 24, fontSize: 14 }}>
        Launch your digital storefront in minutes
      </p>

      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="btn btn-secondary"
        style={{
          width: "100%",
          padding: "11px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          marginBottom: 20,
          fontSize: 14,
        }}
      >
        <GoogleIcon size={18} />
        Sign up with Google
      </button>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          margin: "18px 0",
          color: "var(--color-muted-foreground)",
          fontSize: 12,
        }}
      >
        <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
        <span style={{ padding: "0 12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>or with email</span>
        <div style={{ flex: 1, height: 1, background: "var(--color-border)" }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label htmlFor="name" style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-foreground-muted)" }}>
            Full Name or Brand
          </label>
          <input
            id="name"
            type="text"
            className="input-base"
            placeholder="Nova Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>

        <div>
          <label htmlFor="email" style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-foreground-muted)" }}>
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="input-base"
            placeholder="seller@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, color: "var(--color-foreground-muted)" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input-base"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>


        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: 12, marginTop: 4 }}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : null}
          {loading ? "Creating Storefront..." : "Create Storefront"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--color-muted-foreground)" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--color-primary-hover)", textDecoration: "none", fontWeight: 500 }}>
          Sign in
        </Link>
      </p>

      <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--color-muted-foreground)" }}>
        By registering, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
}
