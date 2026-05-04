import Link from "next/link";

interface SidebarProps {
  activeNav?: string;
}

export function Sidebar({ activeNav = "industries" }: SidebarProps) {
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
        <Link href="/admin" className={activeNav === "industries" ? "active" : ""}>
          📋 Industries
        </Link>
        <Link href="/admin/applications" className={activeNav === "applications" ? "active" : ""}>
          📊 Applications
        </Link>
        <Link href="/admin/settings" className={activeNav === "settings" ? "active" : ""}>
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
