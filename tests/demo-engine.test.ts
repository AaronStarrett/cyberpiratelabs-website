import { describe, expect, it } from "vitest";
import { initialState, reduceDemo, visibleSteps } from "../shared/demo/engine";
import { scenarios } from "../shared/demo/scenarios";

const inspection = scenarios[0]!;
const field = scenarios[1]!;

describe("scenario transitions", () => {
  it("blocks the proposal when information is missing", () => {
    const state = reduceDemo(initialState("inspection"), { type: "missing", value: true }, scenarios);
    const titles = visibleSteps(inspection, state).map((step) => step.id);
    expect(titles).toContain("gap");
    expect(titles).not.toContain("proposal");
    expect(state.index).toBe(titles.indexOf("gap"));
  });

  it("returns to the ready path when the gap is cleared", () => {
    const held = reduceDemo(initialState("inspection"), { type: "missing", value: true }, scenarios);
    const cleared = reduceDemo(held, { type: "missing", value: false }, scenarios);
    const titles = visibleSteps(inspection, cleared).map((step) => step.id);
    expect(titles).toContain("proposal");
    expect(titles).not.toContain("gap");
  });

  it("keeps later work hidden until the sample proposal is approved", () => {
    const pending = visibleSteps(inspection, initialState("inspection")).map((step) => step.id);
    expect(pending).toContain("review");
    expect(pending).not.toContain("job");
    const approved = reduceDemo(initialState("inspection"), { type: "approve" }, scenarios);
    expect(visibleSteps(inspection, approved).map((step) => step.id)).toContain("job");
  });

  it("stops the flow when approval is not granted", () => {
    const rejected = reduceDemo(initialState("inspection"), { type: "reject" }, scenarios);
    const ids = visibleSteps(inspection, rejected).map((step) => step.id);
    expect(ids).toContain("revision");
    expect(ids).not.toContain("job");
    expect(ids).not.toContain("report");
  });

  it("swaps the invoicing handoff for a sync problem", () => {
    const approved = reduceDemo(initialState("inspection"), { type: "approve" }, scenarios);
    const broken = reduceDemo(approved, { type: "sync", value: true }, scenarios);
    const ids = visibleSteps(inspection, broken).map((step) => step.id);
    expect(ids).toContain("sync");
    expect(ids).not.toContain("handoff");
  });

  it("steps, pauses, and resets without leaving the scenario", () => {
    const started = reduceDemo(initialState("field-service"), { type: "run", autoplay: true }, scenarios);
    expect(started.playing).toBe(true);
    expect(started.index).toBe(0);
    const paused = reduceDemo(started, { type: "pause" }, scenarios);
    const stepped = reduceDemo(paused, { type: "next" }, scenarios);
    expect(stepped.playing).toBe(false);
    expect(stepped.index).toBe(1);
    const reset = reduceDemo(stepped, { type: "reset" }, scenarios);
    expect(reset.index).toBe(0);
    expect(reset.scenarioId).toBe("field-service");
    expect(visibleSteps(field, reset).length).toBeGreaterThan(3);
  });

  it("ticks forward and stops at the end", () => {
    let state = reduceDemo(initialState("field-service"), { type: "run", autoplay: true }, scenarios);
    const total = visibleSteps(field, state).length;
    for (let i = 0; i < total + 2; i += 1) state = reduceDemo(state, { type: "tick" }, scenarios);
    expect(state.index).toBe(total - 1);
    expect(state.playing).toBe(false);
  });
});
