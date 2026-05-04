import { loadBase } from "@/lib/config";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const base = loadBase();
  return <SettingsForm initial={base} />;
}
