import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// These tests are structural: they assert the SQL UPDATEs that mark a
// playbook_jobs row 'ready' or 'failed' include the status precondition
// `WHERE id = $... AND status = 'running'`. Without the guard, a slow
// worker that finishes after the watchdog already marked the row failed
// will overwrite the terminal state — the race the architect flagged.
// A grep-style test is the cheapest way to lock the guard down without
// spinning up Postgres in CI.

function read(rel: string): string {
  return readFileSync(join(process.cwd(), rel), "utf-8");
}

function normalise(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

describe("playbook_jobs status guards", () => {
  const generateRoute = read("app/api/playbook-generate/route.ts");
  const publishRoute = read(
    "app/api/playbook-jobs/[id]/publish/route.ts",
  );

  it("the 'ready' transition is gated on status = 'running' (race guard)", () => {
    const flat = normalise(generateRoute);
    expect(flat).toMatch(
      /SET status = 'ready'[\s\S]*?WHERE id = \$2 AND status = 'running'/,
    );
  });

  it("the 'failed' transition (in runJob's catch block) is gated on status = 'running'", () => {
    const flat = normalise(generateRoute);
    expect(flat).toMatch(
      /SET status = 'failed'[\s\S]*?WHERE id = \$2 AND status = 'running'/,
    );
  });

  it("publish only allows transition from a 'ready' job", () => {
    expect(publishRoute).toMatch(/status\s*!==\s*['"]ready['"]/);
  });

  it("publish only marks the row 'published' (does not silently re-run)", () => {
    expect(publishRoute).toMatch(/SET status = 'published'/);
  });

  it("the startup reaper marks every orphaned 'running' row failed (no time threshold)", () => {
    const inst = read("instrumentation.ts");
    const flat = normalise(inst);
    expect(flat).toMatch(
      /UPDATE playbook_jobs[\s\S]*?SET status = 'failed'[\s\S]*?WHERE status = 'running' RETURNING id/,
    );
    // No time-window constraint — under single-worker, every row that is
    // still 'running' at boot is necessarily an orphan.
    expect(flat).not.toMatch(/created_at\s*<\s*NOW\(\)\s*-/);
  });
});
