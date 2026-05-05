"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Hard navigation guarantees the just-set cookie is sent on the next request.
        // router.push can race the cookie store and bounce back to /admin/login.
        window.location.assign(from);
      } else {
        setError("Incorrect password.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <div
            style={{
              width: 40,
              height: 40,
              background: "var(--ink-900)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontFamily: "var(--serif)",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            F
          </div>
        </div>
        <h1 className="login-h">Admin</h1>
        <p className="login-sub">Find a Business Pro · Content Admin</p>
        {error && <div className="login-err">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--ink-700)", fontWeight: 500 }}>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              autoFocus
              style={{
                font: "14.5px var(--sans)",
                color: "var(--ink-900)",
                padding: "12px 14px",
                border: "0.5px solid var(--rule)",
                background: "#fff",
                borderRadius: "var(--r-md)",
                outline: "none",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "13px 20px",
              background: "var(--accent-deep)",
              color: "#fff",
              border: 0,
              borderRadius: "var(--r-md)",
              font: "500 14px var(--sans)",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>
        <div
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "0.5px solid var(--rule)",
            fontFamily: "var(--mono)",
            fontSize: 10,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--ink-500)",
            textAlign: "center",
          }}
        >
          <a
            href="https://www.findabusinesspro.com"
            style={{ textDecoration: "none", color: "inherit" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            findabusinesspro.com →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
