import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("s3 helpers", () => {
  const originalPrefix = process.env.AWS_S3_PREFIX;

  beforeEach(() => {
    delete process.env.AWS_S3_PREFIX;
  });

  afterEach(() => {
    if (originalPrefix === undefined) {
      delete process.env.AWS_S3_PREFIX;
    } else {
      process.env.AWS_S3_PREFIX = originalPrefix;
    }
  });

  describe("buildPlaybookKey + getDefaultPlaybookKey", () => {
    it("returns the suffix unchanged when no prefix is set", async () => {
      const mod = await import("@/lib/s3");
      expect(mod.buildPlaybookKey("playbooks/_default.pdf")).toBe(
        "playbooks/_default.pdf",
      );
      expect(mod.getDefaultPlaybookKey()).toBe("playbooks/_default.pdf");
    });

    it("prepends the configured prefix and normalises slashes", async () => {
      process.env.AWS_S3_PREFIX = "fabp-landing-pages";
      // re-import to pick up the env change (module reads env at call time
      // anyway, but this is defensive in case the implementation ever caches)
      const mod = await import("@/lib/s3");
      expect(mod.buildPlaybookKey("playbooks/foo.pdf")).toBe(
        "fabp-landing-pages/playbooks/foo.pdf",
      );
      expect(mod.getDefaultPlaybookKey()).toBe(
        "fabp-landing-pages/playbooks/_default.pdf",
      );
    });

    it("strips leading and trailing slashes from the prefix", async () => {
      process.env.AWS_S3_PREFIX = "/some/prefix/";
      const mod = await import("@/lib/s3");
      expect(mod.buildPlaybookKey("playbooks/x.pdf")).toBe(
        "some/prefix/playbooks/x.pdf",
      );
    });

    it("strips a leading slash from the suffix so we never produce a double slash", async () => {
      process.env.AWS_S3_PREFIX = "p";
      const mod = await import("@/lib/s3");
      expect(mod.buildPlaybookKey("/playbooks/x.pdf")).toBe(
        "p/playbooks/x.pdf",
      );
    });
  });

  describe("encodeS3Key (used by copyObject as the CopySource)", () => {
    it("preserves slashes between key segments", async () => {
      const { __testing } = await import("@/lib/s3");
      expect(__testing.encodeS3Key("playbooks/drafts/agile-12.pdf")).toBe(
        "playbooks/drafts/agile-12.pdf",
      );
    });

    it("percent-encodes characters that are unsafe in a URL path segment", async () => {
      const { __testing } = await import("@/lib/s3");
      expect(__testing.encodeS3Key("playbooks/drafts/file name (1).pdf")).toBe(
        "playbooks/drafts/file%20name%20(1).pdf",
      );
    });

    it("does not turn the slashes into %2F (the bug copyObject had)", async () => {
      const { __testing } = await import("@/lib/s3");
      const encoded = __testing.encodeS3Key("a/b/c");
      expect(encoded).not.toContain("%2F");
      expect(encoded).toBe("a/b/c");
    });
  });
});
