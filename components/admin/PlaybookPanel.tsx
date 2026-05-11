"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Industry } from "@/config/schema";

interface PlaybookPanelProps {
  slug: string;
  initialPlaybook?: Industry["playbook"];
}

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

interface JobState {
  id: number;
  status: "running" | "ready" | "failed" | "published";
  draftUrl: string | null;
  errorMessage: string | null;
}

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

  const [generationNotes, setGenerationNotes] = useState("");
  const [job, setJob] = useState<JobState | null>(null);
  const [generating, setGenerating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearPoll() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => clearPoll, []);

  async function pollJob(jobId: number) {
    try {
      const res = await fetch(`/api/playbook-jobs/${jobId}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        id: number;
        status: JobState["status"];
        draftUrl: string | null;
        errorMessage: string | null;
      };
      setJob({
        id: data.id,
        status: data.status,
        draftUrl: data.draftUrl,
        errorMessage: data.errorMessage,
      });
      if (data.status !== "running") clearPoll();
    } catch (err) {
      console.error("[PlaybookPanel] poll failed:", err);
    }
  }

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
      };
      if (!res.ok || !payload.ok) {
        setStatus({ kind: "error", message: payload.error ?? "Upload failed." });
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
    if (
      !confirm(
        "Revert to the default playbook? This industry's uploaded file will no longer be served.",
      )
    ) {
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
        setStatus({ kind: "error", message: payload.error ?? "Revert failed." });
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

  async function handleGenerate() {
    setGenerating(true);
    setStatus({ kind: "idle" });
    setJob(null);
    try {
      const res = await fetch("/api/playbook-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          notes: generationNotes.trim() || undefined,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        jobId?: number;
        error?: string;
      };
      if (!res.ok || !payload.ok || !payload.jobId) {
        setStatus({
          kind: "error",
          message: payload.error ?? "Generation could not start.",
        });
        return;
      }
      const jobId = payload.jobId;
      setJob({
        id: jobId,
        status: "running",
        draftUrl: null,
        errorMessage: null,
      });
      clearPoll();
      pollRef.current = setInterval(() => pollJob(jobId), 3000);
      pollJob(jobId);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Generation failed.",
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handlePublish() {
    if (!job || job.status !== "ready") return;
    if (
      !confirm(
        "Publish this draft as the live playbook for this industry? The current playbook will be replaced.",
      )
    ) {
      return;
    }
    setPublishing(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch(`/api/playbook-jobs/${job.id}/publish`, {
        method: "POST",
      });
      const payload = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        playbook?: Industry["playbook"];
        error?: string;
      };
      if (!res.ok || !payload.ok) {
        setStatus({
          kind: "error",
          message: payload.error ?? "Publish failed.",
        });
        return;
      }
      setPlaybook(payload.playbook);
      setJob({ ...job, status: "published" });
      setStatus({
        kind: "success",
        message: "Published. This industry now serves the new playbook.",
      });
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Publish failed.",
      });
    } finally {
      setPublishing(false);
    }
  }

  const busy = uploading || reverting || generating || publishing;

  return (
    <div className="form-section">
      <div className="form-section-h">Provider Playbook</div>
      <p className="field-hint" style={{ marginBottom: 16 }}>
        Upload a per-industry PDF or generate one from the industry config.
        Uploads and generated drafts both go to S3; the public form serves a
        fresh presigned link to every lead.
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
          disabled={busy}
          style={{ display: "none" }}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {uploading ? "Uploading…" : playbook ? "Replace PDF" : "Upload PDF"}
        </button>
        {playbook && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleRevert}
            disabled={busy}
          >
            {reverting ? "Reverting…" : "Revert to default"}
          </button>
        )}
      </div>

      <hr style={{ border: 0, borderTop: "0.5px solid var(--rule)", margin: "20px 0" }} />

      <div className="form-section-h" style={{ fontSize: 13, marginBottom: 8 }}>
        Generate from industry config
      </div>
      <p className="field-hint" style={{ marginBottom: 12 }}>
        Drafts the playbook by filling Clarence&rsquo;s template with
        industry-specific copy via Claude. Review the draft before it replaces
        the live file.
      </p>
      <div className="field" style={{ marginBottom: 12 }}>
        <label htmlFor={`gen-notes-${slug}`}>
          Optional notes for Claude
        </label>
        <textarea
          id={`gen-notes-${slug}`}
          value={generationNotes}
          onChange={(e) => setGenerationNotes(e.target.value)}
          placeholder="e.g. focus on industrial &amp; flex space, mid-market deal sizes"
          rows={2}
          style={{ width: "100%", minHeight: 60 }}
          disabled={busy || job?.status === "running"}
        />
      </div>

      <div className="playbook-panel-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={busy || job?.status === "running"}
        >
          {generating
            ? "Starting…"
            : job?.status === "running"
              ? "Generating…"
              : "Generate playbook draft"}
        </button>
      </div>

      {job && (
        <div className="playbook-panel-status" style={{ marginTop: 12 }}>
          <div>
            <strong>Job #{job.id}:</strong> {job.status}
          </div>
          {job.status === "running" && (
            <div className="field-hint">
              Generating slot copy and rendering PDF — usually 30 to 90 seconds.
            </div>
          )}
          {job.status === "failed" && job.errorMessage && (
            <div className="playbook-error" style={{ marginTop: 8 }}>
              {job.errorMessage}
            </div>
          )}
          {job.status === "ready" && (
            <div className="playbook-panel-actions" style={{ marginTop: 10 }}>
              {job.draftUrl && (
                <a
                  className="btn btn-ghost"
                  href={job.draftUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Review draft PDF
                </a>
              )}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePublish}
                disabled={publishing}
              >
                {publishing ? "Publishing…" : "Publish draft as live"}
              </button>
            </div>
          )}
          {job.status === "published" && (
            <div className="field-hint" style={{ color: "var(--green-700)" }}>
              Draft published. This industry now serves the new file.
            </div>
          )}
        </div>
      )}

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
