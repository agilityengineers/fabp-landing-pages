import { listApplications } from "@/lib/forms";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";

export const dynamic = "force-dynamic";

export default function ApplicationsPage() {
  const applications = listApplications();
  return <ApplicationsTable applications={applications} />;
}
