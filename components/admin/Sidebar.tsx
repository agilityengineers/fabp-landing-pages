"use client";

import Image from "next/image";
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
        <Link href="/admin/settings" className={isActive("/admin/settings") ? "active" : ""}>
          ⚙️ Brand & Founder
        </Link>
      </nav>
      <div style={{ flex: 1 }} />
      <div className="admin-side-foot">v1.0 · Find a Business Pro</div>
    </aside>
  );
}
