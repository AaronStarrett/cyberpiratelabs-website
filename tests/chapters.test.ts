import { describe, expect, it } from "vitest";
import { chapterOf } from "../shared/demo/chapters";
import { initialState, reduceDemo, visibleSteps } from "../shared/demo/engine";
import { scenarios } from "../shared/demo/scenarios";

describe("story chapters", () => {
  it("keeps each default path in request, plan, work, wrap order", () => {
    for (const scenario of scenarios) {
      const needsApproval = scenario.steps.some((step) => step.gate === "approved" || step.gate === "sync-ok");
      const state = needsApproval
        ? reduceDemo(initialState(scenario.id), { type: "approve" }, scenarios)
        : initialState(scenario.id);
      const chapters = visibleSteps(scenario, state).map((step) => chapterOf(scenario.id, step.id));
      for (let i = 1; i < chapters.length; i += 1) {
        expect(chapters[i]).toBeGreaterThanOrEqual(chapters[i - 1]!);
      }
      expect(chapters[0]).toBe(0);
      expect(chapters.at(-1)).toBe(3);
    }
  });

  it("closes field work when the inspection sample needs changes", () => {
    const rejected = reduceDemo(initialState("inspection"), { type: "reject" }, scenarios);
    const ids = visibleSteps(scenarios[0]!, rejected).map((step) => step.id);
    expect(chapterOf("inspection", "revision")).toBe(1);
    expect(ids.every((id) => chapterOf("inspection", id) < 2)).toBe(true);
  });
});
