"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

interface PublishToggleProps {
  slug: string;
  published: boolean;
}

export function PublishToggle({ slug, published }: PublishToggleProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/industries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          action: published ? "unpublish" : "publish",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || pending;

  return (
    <>
      <button
        type="button"
        className="ind-action"
        onClick={toggle}
        disabled={busy}
        title={error ?? undefined}
      >
        {busy ? "…" : published ? "Unpublish" : "Publish"}
      </button>
      {error && (
        <span style={{ color: "var(--red-600, #b91c1c)", fontSize: 11, marginLeft: 6 }}>
          {error}
        </span>
      )}
    </>
  );
}
