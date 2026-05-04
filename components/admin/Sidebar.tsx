"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname() ?? "";

  const isActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/admin") {
      // Industries section also covers /admin/new and /admin/[slug],
      // but not /admin/applications or /admin/settings.
      if (pathname.startsWith("/admin/applications")) return false;
      if (pathname.startsWith("/admin/settings")) return false;
      return pathname.startsWith("/admin/");
    }
    return pathname.startsWith(`${href}/`);
  };

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
        <Link
          href="/admin/applications"
          className={isActive("/admin/applications") ? "active" : ""}
        >
          📊 Applications
        </Link>
        <Link
          href="/admin/settings"
          className={isActive("/admin/settings") ? "active" : ""}
        >
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
