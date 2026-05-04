import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <div style={{ minWidth: 0, overflow: "auto" }}>{children}</div>
    </div>
  );
}
