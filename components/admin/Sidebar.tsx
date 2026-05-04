"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <aside className="admin-side">
      <div className="admin-logo">
        <div className="admin-logo-mark">F</div>
        <div className="admin-logo-text">
          <div>Find a Business Pro</div>
          <div>Admin</div>
        </div>
      </div>
      <nav className="admin-nav" aria-label="Admin navigation">
        <Link href="/admin" className={isActive("/admin") ? "active" : ""}>
          📋 Industries
        </Link>
        <Link href="/admin/applications" className={isActive("/admin/applications") ? "active" : ""}>
          📊 Applications
        </Link>
        <Link href="/admin/settings" className={isActive("/admin/settings") ? "active" : ""}>
          ⚙️ Brand & Founder
        </Link>
      </nav>
      <div style={{ flex: 1 }} />
      <div className="admin-side-foot">
        v1.0 · Find a Business Pro
      </div>
    </aside>
  );
}
