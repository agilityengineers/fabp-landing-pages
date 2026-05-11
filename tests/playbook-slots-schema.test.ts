import { describe, it, expect } from "vitest";
import { playbookSlotsSchema } from "@/lib/playbook";

function validSlots() {
  const longBody = "x".repeat(200);
  const longerBody = "x".repeat(300);
  return {
    coverTagline: "x".repeat(100),
    letterIntroParagraph: "x".repeat(400),
    villains: [
      { title: "Title one", body: longBody },
      { title: "Title two", body: longBody },
      { title: "Title three", body: longBody },
      { title: "Title four", body: longBody },
    ],
    pillarReputationWhy: longerBody,
    pillarSocialWhy: longerBody,
    pillarFunnelsWhy: longerBody,
    pillarPaidWhy: longerBody,
  };
}

describe("playbookSlotsSchema", () => {
  it("accepts a fully-populated, valid slot set", () => {
    expect(() => playbookSlotsSchema.parse(validSlots())).not.toThrow();
  });

  it("requires exactly four villains", () => {
    const tooFew = validSlots();
    tooFew.villains = tooFew.villains.slice(0, 3);
    expect(() => playbookSlotsSchema.parse(tooFew)).toThrow();

    const tooMany = validSlots();
    tooMany.villains = [...tooMany.villains, tooMany.villains[0]];
    expect(() => playbookSlotsSchema.parse(tooMany)).toThrow();
  });

  it("rejects a too-short cover tagline", () => {
    const bad = validSlots();
    bad.coverTagline = "too short";
    expect(() => playbookSlotsSchema.parse(bad)).toThrow();
  });

  it("rejects an over-long pillar passage", () => {
    const bad = validSlots();
    bad.pillarReputationWhy = "x".repeat(800);
    expect(() => playbookSlotsSchema.parse(bad)).toThrow();
  });

  it("rejects a missing slot", () => {
    const bad = validSlots() as Record<string, unknown>;
    delete bad.pillarPaidWhy;
    expect(() => playbookSlotsSchema.parse(bad)).toThrow();
  });

  it("rejects a villain with no body", () => {
    const bad = validSlots();
    bad.villains[0] = { title: "ok title", body: "too short" };
    expect(() => playbookSlotsSchema.parse(bad)).toThrow();
  });
});
