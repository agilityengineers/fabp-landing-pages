import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "16px",
        fontFamily: "var(--sans)",
        background: "var(--paper)",
        color: "var(--ink-900)",
        textAlign: "center",
        padding: "32px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--mono)",
          fontSize: "11px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-500)",
        }}
      >
        404 · Industry not found
      </div>
      <h1
        style={{
          fontFamily: "var(--serif)",
          fontSize: "clamp(32px, 5vw, 52px)",
          letterSpacing: "-0.02em",
          margin: 0,
        }}
      >
        This page doesn&rsquo;t exist yet.
      </h1>
      <p style={{ color: "var(--ink-500)", fontSize: "17px", maxWidth: "480px", margin: 0 }}>
        We may not have launched this industry yet. Browse the directory or check back soon.
      </p>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <Link href="/business-services-professionals" className="btn btn-primary">
          View Business Services page
        </Link>
        <a
          href="https://www.findabusinesspro.com"
          className="btn btn-ghost"
          target="_blank"
          rel="noopener noreferrer"
        >
          Browse the directory →
        </a>
      </div>
    </div>
  );
}
