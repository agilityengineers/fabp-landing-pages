"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Industry } from "@/config/schema";

interface PlaybookPanelProps {
  slug: string;
  initialPlaybook?: Industry["playbook"];
}

type Status = { kind: "idle" } | { kind: "error"; message: string } | { kind: "success"; message: string };

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function PlaybookPanel({ slug, initialPlaybook }: PlaybookPanelProps) {
  const router = useRouter();
  const [playbook, setPlaybook] = useState<Industry["playbook"]>(initialPlaybook);
  const [uploading, setUploading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type && file.type !== "application/pdf") {
      setStatus({ kind: "error", message: "Please choose a PDF file." });
      e.target.value = "";
      return;
    }

    setUploading(true);
    setStatus({ kind: "idle" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/playbook-upload/${slug}`, {
        method: "POST",
        body: formData,
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        playbook?: Industry["playbook"];
        error?: string;
        detail?: string;
      };
      if (!res.ok || !payload.ok) {
        setStatus({
          kind: "error",
          message: payload.error ?? "Upload failed.",
        });
        return;
      }
      setPlaybook(payload.playbook);
      setStatus({ kind: "success", message: "Playbook uploaded." });
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRevert() {
    if (!confirm("Revert to the default playbook? This industry's uploaded file will no longer be served.")) {
      return;
    }
    setReverting(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(`/api/playbook-upload/${slug}`, {
        method: "DELETE",
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!res.ok || !payload.ok) {
        setStatus({
          kind: "error",
          message: payload.error ?? "Revert failed.",
        });
        return;
      }
      setPlaybook(undefined);
      setStatus({ kind: "success", message: "Reverted to default playbook." });
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Revert failed.",
      });
    } finally {
      setReverting(false);
    }
  }

  return (
    <div className="form-section">
      <div className="form-section-h">Provider Playbook</div>
      <p className="field-hint" style={{ marginBottom: 16 }}>
        Upload a per-industry PDF to override the default playbook on this
        landing page. Uploads go to S3; the public form serves a fresh
        presigned link to every lead.
      </p>

      <div className="playbook-panel-status">
        {playbook ? (
          <>
            <div>
              <strong>Current file:</strong> {playbook.fileName}
            </div>
            <div className="field-hint">
              Source: {playbook.source} · Updated {fmtDate(playbook.updatedAt)}
            </div>
            <div className="field-hint" style={{ wordBreak: "break-all" }}>
              S3 key: <code>{playbook.s3Key}</code>
            </div>
          </>
        ) : (
          <div>
            Currently serving the <strong>default playbook</strong> for this
            industry.
          </div>
        )}
      </div>

      <div className="playbook-panel-actions">
        <input
          type="file"
          accept="application/pdf"
          ref={fileInputRef}
          onChange={handleUpload}
          disabled={uploading || reverting}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || reverting}
        >
          {uploading ? "Uploading…" : playbook ? "Replace PDF" : "Upload PDF"}
        </button>
        {playbook && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleRevert}
            disabled={uploading || reverting}
          >
            {reverting ? "Reverting…" : "Revert to default"}
          </button>
        )}
      </div>

      {status.kind === "error" && (
        <div className="playbook-error" style={{ marginTop: 12 }}>
          {status.message}
        </div>
      )}
      {status.kind === "success" && (
        <div className="field-hint" style={{ color: "var(--green-700)", marginTop: 12 }}>
          {status.message}
        </div>
      )}
    </div>
  );
}
