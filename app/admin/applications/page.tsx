import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FailedSubmissionsTable } from "@/components/admin/FailedSubmissionsTable";

export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
  return <FailedSubmissionsTable />;
}
