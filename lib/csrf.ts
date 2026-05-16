/**
 * Same-origin guard for cookie-authenticated, state-changing API requests.
 *
 * Primary defense against CSRF is the SameSite=Strict admin cookie; this
 * Origin/Referer check is defense-in-depth for older browsers and for
 * environments (proxies, embed frames) where SameSite might be relaxed.
 *
 * Returns null when the request is OK, or a 403 Response when it should be
 * rejected. Use only on routes that mutate state via cookie auth — skip on
 * cron/bearer-token routes (browsers can't add custom Authorization headers
 * cross-site without CORS preflight).
 */

import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function requireSameOrigin(req: NextRequest): Response | null {
  if (SAFE_METHODS.has(req.method)) return null;

  const host = req.headers.get("host");
  if (!host) {
    return new Response(
      JSON.stringify({ error: "Missing Host header" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const expectedHosts = new Set<string>([host]);
  // Allow Replit's preview/deployment public hostnames as well, in case the
  // app is reached through a proxied domain that rewrites Host. Operators can
  // pin additional trusted origins via ALLOWED_ORIGINS (comma-separated).
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    for (const raw of extra.split(",")) {
      try {
        expectedHosts.add(new URL(raw.trim()).host);
      } catch {
        // ignore malformed entry
      }
    }
  }

  const matches = (value: string | null): boolean => {
    if (!value) return false;
    try {
      return expectedHosts.has(new URL(value).host);
    } catch {
      return false;
    }
  };

  if (origin) {
    if (!matches(origin)) {
      return new Response(
        JSON.stringify({ error: "Cross-origin request denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    return null;
  }

  // No Origin (some browsers omit on same-origin POSTs) — fall back to Referer.
  if (referer) {
    if (!matches(referer)) {
      return new Response(
        JSON.stringify({ error: "Cross-origin request denied" }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }
    return null;
  }

  // Neither header present. Reject — legitimate browser POSTs always include
  // at least one. Server-to-server callers should use bearer-token routes.
  return new Response(
    JSON.stringify({ error: "Missing Origin/Referer header" }),
    { status: 403, headers: { "Content-Type": "application/json" } },
  );
}
