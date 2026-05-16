import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/csrf";

const TARGETS = {
  alerts: {
    envVar: "ALERT_WEBHOOK_URL",
    label: "BD failure alerts",
    text: "Test alert from Find a Business Pro admin — wiring confirmed for ALERT_WEBHOOK_URL.",
  },
  playbook: {
    envVar: "PLAYBOOK_SLACK_WEBHOOK_URL",
    label: "Provider Playbook leads",
    text: "Test message from Find a Business Pro admin — wiring confirmed for PLAYBOOK_SLACK_WEBHOOK_URL.",
  },
} as const;

type TargetKey = keyof typeof TARGETS;

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    targets: (Object.keys(TARGETS) as TargetKey[]).map((key) => ({
      key,
      envVar: TARGETS[key].envVar,
      label: TARGETS[key].label,
      configured: Boolean(process.env[TARGETS[key].envVar]),
    })),
  });
}

export async function POST(req: NextRequest) {
  const csrf = requireSameOrigin(req);
  if (csrf) return csrf;
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { target?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const target = body.target as TargetKey | undefined;
  if (!target || !(target in TARGETS)) {
    return NextResponse.json(
      { error: `target must be one of: ${Object.keys(TARGETS).join(", ")}` },
      { status: 400 }
    );
  }

  const cfg = TARGETS[target];
  const url = process.env[cfg.envVar];

  if (!url) {
    return NextResponse.json(
      {
        ok: false,
        error: `${cfg.envVar} is not set. Add it in Replit Secrets (workspace and deployment) and restart.`,
      },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({
    text: `:white_check_mark: ${cfg.text}\n• Time (UTC): ${timestamp}`,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return NextResponse.json(
        {
          ok: false,
          error: `Slack returned ${res.status}: ${detail || "no body"}`,
        },
        { status: 502 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: `Test message sent to Slack via ${cfg.envVar}. Check the channel.`,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: `Network error: ${detail}` },
      { status: 502 }
    );
  }
}
