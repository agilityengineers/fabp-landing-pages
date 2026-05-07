"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <aside className="admin-side">
      <div className="admin-logo">
        <Image
          src="/New-White-Logo-2026_1777935147444.png"
          alt="Find a Business Pro"
          width={320}
          height={90}
          className="admin-logo-image"
          priority
        />
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        <Link href="/admin" className={isActive("/admin") ? "active" : ""}>
          📋 Industries
        </Link>
        <Link href="/admin/applications" className={isActive("/admin/applications") ? "active" : ""}>
          📊 Applications
        </Link>
        <Link href="/admin/leads" className={isActive("/admin/leads") ? "active" : ""}>
          📘 Playbook leads
        </Link>
        <Link href="/admin/settings" className={isActive("/admin/settings") ? "active" : ""}>
          ⚙️ Brand & Founder
        </Link>
      </nav>
      <div style={{ flex: 1 }} />
      <div className="admin-side-foot">
        <span>v1.0 · Find a Business Pro</span>
        <button
          onClick={handleLogout}
          style={{
            display: "block",
            marginTop: 10,
            width: "100%",
            padding: "7px 10px",
            background: "rgba(255,255,255,0.06)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            color: "rgba(255,255,255,0.55)",
            fontFamily: "var(--mono)",
            fontSize: 9.5,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            textAlign: "left",
            transition: "background .15s, color .15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
          }}
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
