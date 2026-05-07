type BlockKitField = { title: string; value: string; short?: boolean };

type BlockKitAttachment = {
  color?: "good" | "warning" | "danger" | string;
  fields?: BlockKitField[];
};

export type BlockKitPayload = {
  text: string;
  attachments?: BlockKitAttachment[];
};

export type SlackPostResult = "sent" | "skipped" | "failed";

export async function postSlackBlockKit(
  webhookUrl: string | undefined,
  payload: BlockKitPayload,
  logTag: string,
): Promise<SlackPostResult> {
  if (!webhookUrl) {
    console.warn(`[${logTag}] Slack webhook URL not set — skipping post`);
    return "skipped";
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[${logTag}] Slack webhook responded with ${res.status}`);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error(`[${logTag}] Slack webhook post failed:`, err);
    return "failed";
  }
}
