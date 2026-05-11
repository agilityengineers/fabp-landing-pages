import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LeadsManager } from "@/components/admin/LeadsManager";

export const dynamic = "force-dynamic";

export default async function InvitationLeadsPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  return <LeadsManager leadType="invitation" />;
}
