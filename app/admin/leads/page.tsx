import { redirect } from "next/navigation";

// Legacy URL — superseded by /admin/playbook-leads. Keep this redirect so
// existing bookmarks and Slack notifications continue to work.
export default function LegacyLeadsRedirect() {
  redirect("/admin/playbook-leads");
}
