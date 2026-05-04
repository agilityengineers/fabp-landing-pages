export type ApplicationData = {
  name: string;
  email: string;
  phone?: string;
  profession: string;
  city: string;
  years?: string;
  website?: string;
  spend?: string;
  fit?: string;
  industrySlug: string;
  submittedAt: string;
};

// TODO(decision): Wire to Resend / HubSpot / GoHighLevel / Calendly before launch.
// Until then, logs to console. Replace this function body with real integration.
export async function submitApplication(data: ApplicationData): Promise<void> {
  console.log("[FABP Application]", JSON.stringify(data, null, 2));

  // TODO(decision): Resend integration example:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "noreply@invitation.findabusinesspro.com",
  //   to: "admin@findabusinesspro.com",
  //   subject: `New application: ${data.name} (${data.profession})`,
  //   text: JSON.stringify(data, null, 2),
  // });
}
