import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LeadsTable } from "@/components/admin/LeadsTable";

export const dynamic = "force-dynamic";

export default async function PlaybookLeadsPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  return <LeadsTable />;
}
