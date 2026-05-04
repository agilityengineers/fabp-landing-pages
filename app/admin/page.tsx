import { listIndustries } from "@/lib/config";
import { IndustriesTable } from "@/components/admin/IndustriesTable";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const industries = listIndustries();
  return <IndustriesTable industries={industries} />;
}
