import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { solutions } from "../shared/solutions";
import { getAgentBeats, getAgentScenario } from "../shared/agents/fixtures";
import { getSolutionAgentScenario, solutionAgentScenarios } from "../shared/agents/solution-scenarios";
import { experienceReducer, experienceSnapshot, initialExperience, type ExperienceAction } from "../shared/agents/experience";
import AgentExperience from "../src/islands/AgentExperience";

const inView: ExperienceAction = { type: "visibility", inView: true, tabVisible: true };
const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");

describe("focused solution demonstrations", () => {
  it("resolves ten separate stories while preserving the legacy default", () => {
    expect(solutionAgentScenarios).toHaveLength(10);
    expect(new Set(solutionAgentScenarios.map((scenario) => scenario.id)).size).toBe(10);
    expect(getSolutionAgentScenario("missing-solution")).toBeUndefined();
    expect(getAgentScenario("solution:missing-solution").id).toBe("remodeling");
    expect(initialExperience().scenario).toBe("remodeling");
  });

  it.each(solutions)("$id $name: keeps its delivery and complete result", (solution) => {
    const scenario = getSolutionAgentScenario(solution.slug)!;
    let state = initialExperience(solution.delivery === "voice" ? "chat" : "voice", scenario.id);
    expect(state.mode).toBe(solution.delivery);
    state = experienceReducer(state, { type: "mode", mode: solution.delivery === "voice" ? "chat" : "voice" });
    expect(state.mode).toBe(solution.delivery);
    state = experienceReducer(state, { type: "finish" });
    const snapshot = experienceSnapshot(state);
    expect(snapshot.complete).toBe(true);
    expect(snapshot.shown.map(({ speaker, text }) => ({ speaker, text }))).toEqual(solution.demo.turns);
    expect(snapshot.captures.filter((field) => field.key !== "next")).toEqual(expect.arrayContaining(scenario.solution!.result));
    expect(snapshot.captures).toHaveLength(solution.demo.result.length + 1);
    expect(snapshot.captures.find((field) => field.key === "next")?.value).toBe(solution.demo.next);
  });

  it.each(solutions)("$id reveals source details before the final summary, with no early next step", (solution) => {
    const scenario = getSolutionAgentScenario(solution.slug)!;
    let state = experienceReducer(initialExperience("voice", scenario.id), inView);
    const beats = getAgentBeats(scenario.id, state.mode);
    expect(beats.length).toBeGreaterThanOrEqual(3);
    let previousKeys: string[] = [];
    for (const [index, beat] of beats.entries()) {
      const snapshot = experienceSnapshot(state);
      expect(snapshot.index).toBe(beat.through);
      if (index < beats.length - 1) {
        expect(snapshot.captures.some((field) => field.key === "next")).toBe(false);
      }
      expect(snapshot.captures.map((field) => field.key)).toEqual(expect.arrayContaining(previousKeys));
      previousKeys = snapshot.captures.map((field) => field.key);
      expect(new Set(previousKeys).size).toBe(previousKeys.length);
      state = experienceReducer(state, { type: "tick", ms: beat.duration });
    }
    expect(experienceSnapshot(state).complete).toBe(true);
    expect(experienceSnapshot(state).captures.find((field) => field.key === "next")).toBeDefined();
  });

  it.each(solutions)("$id preserves paused inspection through visibility and transcript changes", (solution) => {
    const scenario = getSolutionAgentScenario(solution.slug)!;
    let state = experienceReducer(initialExperience("voice", scenario.id), { type: "finish" });
    const expected = experienceSnapshot(state);
    for (const action of [
      { type: "tick", ms: 60_000 },
      { type: "visibility", inView: false, tabVisible: false }, inView,
      { type: "transcript", open: true }, { type: "transcript", open: false },
    ] as ExperienceAction[]) {
      state = experienceReducer(state, action);
      expect(state.playing).toBe(false);
      expect(experienceSnapshot(state).captures).toEqual(expected.captures);
    }
    state = experienceReducer(state, { type: "motion", reduced: true });
    state = experienceReducer(state, { type: "replay" });
    expect(state.playing).toBe(false);
    expect(experienceSnapshot(state).complete).toBe(true);
    expect(experienceSnapshot(state).captures).toEqual(expected.captures);
  });

  it("clears prior contact data when switching solutions and preserves manual pause", () => {
    const first = getSolutionAgentScenario("after-hours-inquiry-capture")!;
    const next = getSolutionAgentScenario("employee-procedure-help-desk")!;
    let state = experienceReducer(initialExperience("voice", first.id), inView);
    state = experienceReducer(state, { type: "finish" });
    state = experienceReducer(state, { type: "pause" });
    state = experienceReducer(state, { type: "scenario", scenario: next.id });
    expect(state).toMatchObject({ mode: "chat", scenario: next.id, intent: "pause", playing: false, elapsed: 0 });
    expect(experienceSnapshot(state).captures.some((field) => field.value.includes("Casey"))).toBe(false);
  });

  it.each(solutions)("$id provides its correct SSR transcript, result, and delivery without a mode switch", (solution) => {
    const html = renderToStaticMarkup(createElement(AgentExperience, { solution: solution.slug, compact: true }));
    expect(html).toContain(`data-solution="${solution.slug}"`);
    expect(html).toContain(`data-mode="${solution.delivery}"`);
    expect(html).not.toContain("Choose voice or chat walkthrough");
    expect(html).not.toContain("Try a sample");
    const fallback = html.slice(html.indexOf('<details class="agent-transcript"'));
    expect(fallback).toContain("Complete sample result");
    for (const turn of solution.demo.turns) expect(fallback).toContain(escapeHtml(turn.text));
    for (const field of solution.demo.result) {
      expect(fallback).toContain(escapeHtml(field.label));
      expect(fallback).toContain(escapeHtml(field.value));
    }
    expect(fallback).toContain(escapeHtml(solution.demo.next));
    expect(fallback).toContain("without JavaScript");
    expect(html).toContain("No audio · No live connection");
  });

  it("shows a simulated unanswered transfer and callback fallback, never a live connection", () => {
    const scenario = getSolutionAgentScenario("sales-call-screening-and-transfer")!;
    const text = scenario.stories.voice.map((turn) => turn.text).join(" ");
    expect(text).toMatch(/simulat/i);
    expect(text).toMatch(/one configured human number/i);
    expect(text).toMatch(/no answer/i);
    expect(scenario.solution!.result.find((field) => field.label === "Callback")?.value).toContain("555-0147");
    expect(scenario.solution!.next).toMatch(/no call is placed or connected/i);
    let state = experienceReducer(initialExperience("voice", scenario.id), inView);
    const first = experienceSnapshot(state);
    expect(first.captures.find((field) => field.label === "Transfer step")?.value).toMatch(/unanswered/);
    expect(first.captures.some((field) => field.label === "Callback")).toBe(false);
    state = experienceReducer(state, { type: "tick", ms: getAgentBeats(scenario.id, "voice")[0]!.duration });
    const callback = experienceSnapshot(state);
    expect(callback.shown.at(-1)?.text).toContain("555-0147");
    expect(callback.captures.find((field) => field.label === "Callback")?.value).toContain("555-0147");
    expect(callback.captures.some((field) => field.key === "next")).toBe(false);
  });

  it("keeps all six quote fields, customer-completed booking, and controlled procedure access visible", () => {
    const quote = getSolutionAgentScenario("ready-to-review-quote-requests")!;
    expect(quote.solution!.result.map((field) => field.label)).toEqual([
      "Project type", "Approximate size", "Location", "Timing", "Budget", "Contact information",
    ]);
    let quoted = experienceReducer(initialExperience("voice", quote.id), inView);
    expect(experienceSnapshot(quoted).captures).toHaveLength(0);
    quoted = experienceReducer(quoted, { type: "tick", ms: getAgentBeats(quote.id, "voice")[0]!.duration });
    expect(experienceSnapshot(quoted).captures).toHaveLength(6);
    expect(experienceSnapshot(quoted).shown.at(-1)?.speaker).toBe("visitor");
    const booking = getSolutionAgentScenario("booking-assistance")!;
    expect(booking.solution!.result.find((field) => field.label === "Who completes it")?.value).toBe("The customer, in the linked booking system");
    const staff = getSolutionAgentScenario("employee-procedure-help-desk")!;
    const html = renderToStaticMarkup(createElement(AgentExperience, { solution: staff.solution!.slug }));
    const beforeTranscript = html.slice(0, html.indexOf('<details class="agent-transcript"'));
    expect(beforeTranscript).toContain("verified controlled access");
    expect(beforeTranscript).toContain("fictional material only");
    expect(staff.solution!.result.find((field) => field.label === "Source")?.value).toBe("Fictional opening checklist");
  });
});
