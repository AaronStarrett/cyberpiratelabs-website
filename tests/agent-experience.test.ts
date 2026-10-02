import { describe, expect, it } from "vitest";
import { agentScenarios, type AgentMode } from "../shared/agents/fixtures";
import {
  experienceDuration, experienceReducer, experienceSnapshot, initialExperience,
  type ExperienceAction, type ExperienceState,
} from "../shared/agents/experience";

const run = (...actions: ExperienceAction[]): ExperienceState =>
  actions.reduce(experienceReducer, initialExperience());

describe("local agent demonstration stories", () => {
  it("starts paused and never advances without a visitor choosing playback", () => {
    const initial = initialExperience();
    expect(initial.playing).toBe(false);
    expect(experienceReducer(initial, { type: "tick", ms: 60_000 })).toBe(initial);
    expect(experienceSnapshot(initial).captures).toEqual([]);
  });

  it("pauses at the same point and resumes without losing revealed details", () => {
    const paused = run({ type: "play" }, { type: "tick", ms: 9500 }, { type: "pause" });
    const captures = experienceSnapshot(paused).captures;
    expect(captures.find((item) => item.key === "area")?.value).toBe("Carmel");
    expect(experienceReducer(paused, { type: "tick", ms: 10_000 })).toBe(paused);
    const resumed = experienceReducer(experienceReducer(paused, { type: "play" }), { type: "tick", ms: 1000 });
    expect(resumed.elapsed).toBe(10_500);
    expect(experienceSnapshot(resumed).captures).toEqual(captures);
  });

  it("reveals result details only when the corresponding sample utterance is reached", () => {
    const initial = initialExperience();
    const beforeRequest = experienceReducer(
      experienceReducer(initial, { type: "play" }),
      { type: "tick", ms: 3099 },
    );
    expect(experienceSnapshot(beforeRequest).captures).toEqual([]);
    const request = experienceReducer(beforeRequest, { type: "tick", ms: 1 });
    expect(experienceSnapshot(request).captures.map((item) => item.value)).toEqual(["bathroom remodel", "Carmel"]);
    expect(experienceSnapshot(request).captures.some((item) => item.key === "email")).toBe(false);
  });

  it("finishes a skipped example and restarts a completed example from a clean inquiry", () => {
    const finished = run({ type: "finish" });
    expect(experienceSnapshot(finished).complete).toBe(true);
    expect(finished.playing).toBe(false);
    const replayed = experienceReducer(finished, { type: "play" });
    expect(replayed).toMatchObject({ elapsed: 0, playing: true });
    expect(experienceSnapshot(replayed).captures).toEqual([]);
  });

  it("resets progress on mode and scenario changes so samples never share contact details", () => {
    const next = run({ type: "finish" }, { type: "scenario", scenario: "cleaning" }, { type: "mode", mode: "chat" });
    expect(next).toMatchObject({ scenario: "cleaning", mode: "chat", elapsed: 0, playing: false });
    expect(experienceSnapshot(next).captures).toEqual([]);
    const result = experienceSnapshot(experienceReducer(next, { type: "finish" }));
    expect(result.captures.find((item) => item.key === "email")?.value).toBe("alex@example.com");
    expect(result.captures.some((item) => item.value.includes("jamie"))).toBe(false);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("ignores invalid elapsed time %s", (ms) => {
    const playing = run({ type: "play" });
    expect(experienceReducer(playing, { type: "tick", ms })).toBe(playing);
  });

  it("catches up across messages without repeating, overflowing, or remaining in playback", () => {
    const finished = run({ type: "play" }, { type: "tick", ms: 100_000 });
    expect(finished.elapsed).toBe(experienceDuration(finished));
    expect(finished.playing).toBe(false);
    expect(experienceSnapshot(finished).index).toBe(8);
    expect(experienceSnapshot(finished).progress).toBe(1);
  });

  for (const scenario of agentScenarios) {
    for (const mode of ["voice", "chat"] as AgentMode[]) {
      it(scenario.id + " / " + mode + " has evidence for every captured value and completes coherently", () => {
        const messages = scenario.stories[mode];
        const keys = new Set<string>();
        let state: ExperienceState = { ...initialExperience(mode), scenario: scenario.id, playing: true };
        for (const message of messages) {
          for (const capture of message.capture ?? []) {
            expect(message.text.toLowerCase()).toContain(capture.value.toLowerCase());
            keys.add(capture.key);
          }
          state = experienceReducer(state, { type: "tick", ms: message.duration });
        }
        const snapshot = experienceSnapshot(state);
        expect(snapshot.complete).toBe(true);
        expect(snapshot.shown).toEqual(messages);
        expect(snapshot.captures.map((item) => item.key).sort()).toEqual([...keys].sort());
        expect(snapshot.captures.find((item) => item.key === "email")?.value).toMatch(/^[a-z]+@example\.com$/);
        expect(snapshot.captures.find((item) => item.key === "next")).toBeDefined();
        expect(messages.map((item) => item.text).join(" ")).not.toContain("appointment confirmed");
      });
    }
  }

  it.each(["voice", "chat"] as AgentMode[])("routes billing to simulated human follow-up in %s", (mode) => {
    const state = { ...initialExperience(mode), scenario: "billing" as const };
    const snapshot = experienceSnapshot(experienceReducer(state, { type: "finish" }));
    expect(snapshot.scenario.kind).toBe("handoff");
    expect(snapshot.captures.find((item) => item.key === "next")?.value).toContain("simulated");
    expect(snapshot.messages.map((item) => item.text).join(" ")).toContain("can’t access or change your account");
    expect(snapshot.messages.map((item) => item.text).join(" ")).not.toContain("human has joined");
  });
});