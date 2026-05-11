import { describe, it, expect } from "vitest";
import { DEFAULT_PLAYBOOK_KEY } from "@/lib/s3";

describe("DEFAULT_PLAYBOOK_KEY", () => {
  it("points at the generic Business Services playbook PDF at the bucket root", () => {
    expect(DEFAULT_PLAYBOOK_KEY).toBe(
      "Provider_Playbook_Business_Services_Professionals-2026.pdf",
    );
  });

  it("is a bare object key (no leading slash, no folder prefix)", () => {
    expect(DEFAULT_PLAYBOOK_KEY.startsWith("/")).toBe(false);
    expect(DEFAULT_PLAYBOOK_KEY.includes("/")).toBe(false);
  });

  it("targets a .pdf file", () => {
    expect(DEFAULT_PLAYBOOK_KEY.toLowerCase().endsWith(".pdf")).toBe(true);
  });
});
