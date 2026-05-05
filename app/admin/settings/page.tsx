import { isAuthenticated } from "@/lib/auth";
import { loadBase } from "@/lib/config";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!(await isAuthenticated())) {
    redirect("/admin/login?from=/admin/settings");
  }

  const base = loadBase();
  return <SettingsForm base={base} />;
}
