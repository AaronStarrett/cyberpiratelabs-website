import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentScenarios, getAgentBeats, type AgentMode } from "../shared/agents/fixtures";
import {
  experienceDuration, experienceReducer, experienceSnapshot, initialExperience,
  type ExperienceAction, type ExperienceState,
} from "../shared/agents/experience";
import { createExperienceClock } from "../shared/agents/playback";

const inView: ExperienceAction = { type: "visibility", inView: true, tabVisible: true };
const run = (...actions: ExperienceAction[]): ExperienceState =>
  actions.reduce(experienceReducer, initialExperience());

/** The real clock drives the real story; controls apply the same lifetime rules as the island. */
function walkthrough() {
  let state = initialExperience();
  const clock = createExperienceClock((ms) => {
    state = experienceReducer(state, { type: "tick", ms });
  });
  return {
    get state() { return state; },
    get snapshot() { return experienceSnapshot(state); },
    act(action: ExperienceAction) {
      state = experienceReducer(state, action);
      clock.setRunning(state.playing);
    },
    dispose: () => clock.dispose(),
  };
}

describe("visitor control and sample truth", () => {
  it("waits offscreen, then begins with the inquiry immediately when meaningfully in view", () => {
    const initial = initialExperience();
    expect(initial.playing).toBe(false);
    expect(experienceReducer(initial, { type: "tick", ms: 60_000 })).toBe(initial);
    expect(experienceSnapshot(initial).captures).toEqual([]);
    const started = experienceReducer(initial, inView);
    expect(started).toMatchObject({ playing: true, elapsed: 0, intent: "auto", started: true });
    expect(experienceSnapshot(started).shown.map((item) => item.text)).toContain("A bathroom remodel at my home in Carmel.");
    expect(experienceSnapshot(started).captures.map((item) => item.value)).toEqual(["bathroom remodel", "Carmel"]);
  });

  it("manual Play and Restart reveal meaningful content before the first timer tick", () => {
    const paused = run(inView, { type: "pause" });
    for (const type of ["play", "replay"] as const) {
      const started = experienceReducer(paused, { type });
      expect(started.elapsed).toBe(0);
      expect(started.playing).toBe(true);
      expect(experienceSnapshot(started).shown.at(-1)?.speaker).toBe("visitor");
      expect(experienceSnapshot(started).captures.some((item) => item.key === "service")).toBe(true);
    }
  });

  it("reveals each customer detail at its story beat, without early contact data", () => {
    const first = run(inView, { type: "tick", ms: 2499 });
    expect(experienceSnapshot(first).captures.map((item) => item.key)).toEqual(["service", "area"]);
    const project = experienceReducer(first, { type: "tick", ms: 1 });
    expect(experienceSnapshot(project).captures.find((item) => item.key === "details")?.value).toBe("full remodel, including the shower and vanity");
    const timing = experienceReducer(project, { type: "tick", ms: 4000 });
    expect(experienceSnapshot(timing).captures.find((item) => item.key === "timing")?.value).toBe("this fall");
    expect(experienceSnapshot(timing).captures.some((item) => item.key === "email")).toBe(false);
    const contact = experienceReducer(timing, { type: "tick", ms: 3500 });
    expect(experienceSnapshot(contact).captures.find((item) => item.key === "email")?.value).toBe("jamie@example.com");
    expect(experienceSnapshot(contact).captures.some((item) => item.key === "next")).toBe(false);
    const nextStep = experienceReducer(contact, { type: "tick", ms: 3500 });
    expect(experienceSnapshot(nextStep).captures.find((item) => item.key === "next")?.value).toBe("Team review and follow-up requested.");
  });

  it("manual pause survives repeated visibility notifications, hidden tabs, transcript toggles, and scenario changes", () => {
    let paused = run(inView, { type: "tick", ms: 9500 }, { type: "pause" });
    const captures = experienceSnapshot(paused).captures;
    for (const action of [
      { type: "visibility", inView: false, tabVisible: true },
      { type: "visibility", inView: true, tabVisible: false },
      inView, inView,
      { type: "transcript", open: true }, { type: "transcript", open: false },
      { type: "motion", reduced: false },
    ] as ExperienceAction[]) {
      paused = experienceReducer(paused, action);
      expect(paused).toMatchObject({ intent: "pause", playing: false, elapsed: 9500 });
      expect(experienceSnapshot(paused).captures).toEqual(captures);
    }
    paused = experienceReducer(paused, { type: "scenario", scenario: "cleaning" });
    paused = experienceReducer(paused, { type: "mode", mode: "chat" });
    expect(paused).toMatchObject({ scenario: "cleaning", mode: "chat", elapsed: 0, playing: false, intent: "pause" });
    const resumed = experienceReducer(paused, { type: "play" });
    expect(resumed.playing).toBe(true);
    expect(experienceSnapshot(resumed).shown.at(-1)?.text).toContain("recurring home cleaning in Fishers");
  });

  it("changes mode and scenario promptly during playback without carrying contact data", () => {
    const playing = run(inView, { type: "tick", ms: 11_000 });
    const changed = experienceReducer(experienceReducer(playing, { type: "scenario", scenario: "cleaning" }), { type: "mode", mode: "chat" });
    expect(changed).toMatchObject({ playing: true, elapsed: 0, cycles: 0, mode: "chat", scenario: "cleaning" });
    expect(experienceSnapshot(changed).shown).toHaveLength(2);
    expect(experienceSnapshot(changed).captures).toEqual([]);
    expect(experienceSnapshot(changed).shown.map((item) => item.text).join(" ")).not.toContain("Jamie");
  });

  it("holds a skipped result indefinitely until a deliberate Play or Restart", () => {
    let inspected = run(inView, { type: "finish" });
    const complete = experienceSnapshot(inspected);
    expect(complete).toMatchObject({ complete: true, progress: 1 });
    for (const action of [
      { type: "tick", ms: 120_000 }, inView,
      { type: "visibility", inView: false, tabVisible: false }, inView,
      { type: "transcript", open: true }, { type: "transcript", open: false },
      { type: "motion", reduced: false },
    ] as ExperienceAction[]) {
      inspected = experienceReducer(inspected, action);
      expect(inspected).toMatchObject({ intent: "inspect", playing: false, elapsed: 20_000 });
      expect(experienceSnapshot(inspected).captures).toEqual(complete.captures);
    }
    const restarted = experienceReducer(inspected, { type: "play" });
    expect(restarted).toMatchObject({ elapsed: 0, playing: true, intent: "play" });
    expect(experienceSnapshot(restarted).captures.some((item) => item.key === "email")).toBe(false);
  });

  it("transcript reading pauses the story and closing it preserves the visitor's playback preference", () => {
    const auto = run(inView, { type: "tick", ms: 4300 });
    const reading = experienceReducer(auto, { type: "transcript", open: true });
    expect(reading).toMatchObject({ elapsed: 4300, reading: true, playing: false, intent: "auto" });
    expect(experienceReducer(reading, { type: "tick", ms: 60_000 })).toBe(reading);
    expect(experienceReducer(reading, { type: "transcript", open: false })).toMatchObject({ elapsed: 4300, playing: true });
    const pausedReading = experienceReducer(experienceReducer(reading, { type: "pause" }), { type: "transcript", open: false });
    expect(pausedReading).toMatchObject({ playing: false, intent: "pause" });
  });

  it("reduced motion provides the complete static result across all controls and visibility changes", () => {
    let staticState = run({ type: "motion", reduced: true }, inView);
    for (const action of [
      { type: "play" }, { type: "replay" }, { type: "tick", ms: 120_000 },
      { type: "visibility", inView: false, tabVisible: false }, inView,
      { type: "mode", mode: "chat" }, { type: "scenario", scenario: "home-service" },
    ] as ExperienceAction[]) {
      staticState = experienceReducer(staticState, action);
      const snapshot = experienceSnapshot(staticState);
      expect(staticState).toMatchObject({ playing: false, reducedMotion: true, elapsed: 20_000, cycles: 0 });
      expect(snapshot.complete).toBe(true);
      expect(snapshot.shown).toEqual(snapshot.messages);
      expect(snapshot.captures.find((item) => item.key === "next")).toBeDefined();
    }
    const paused = experienceReducer(staticState, { type: "pause" });
    expect(experienceReducer(paused, { type: "motion", reduced: false }).playing).toBe(false);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("ignores invalid elapsed time %s", (ms) => {
    const playing = run(inView);
    expect(experienceReducer(playing, { type: "tick", ms })).toBe(playing);
  });

  for (const scenario of agentScenarios) {
    for (const mode of ["voice", "chat"] as AgentMode[]) {
      it(scenario.id + " / " + mode + " has a 20-second cycle and evidence for every captured value", () => {
        const state = { ...initialExperience(mode), scenario: scenario.id };
        const beats = getAgentBeats(scenario.id, mode);
        const messages = scenario.stories[mode];
        expect(experienceDuration(state)).toBe(20_000);
        expect(beats.length).toBeGreaterThanOrEqual(4);
        expect(beats.length).toBeLessThanOrEqual(6);
        expect(beats.at(-1)?.through).toBe(messages.length - 1);
        expect(beats.every((beat, index) => beat.through > (beats[index - 1]?.through ?? -1))).toBe(true);
        const keys = new Set<string>();
        for (const message of messages) {
          for (const capture of message.capture ?? []) {
            expect(message.text.toLowerCase()).toContain(capture.value.toLowerCase());
            keys.add(capture.key);
          }
        }
        const result = experienceSnapshot(experienceReducer(state, { type: "finish" }));
        expect(result.shown).toEqual(messages);
        expect(result.captures.map((item) => item.key).sort()).toEqual([...keys].sort());
        expect(result.captures.find((item) => item.key === "email")?.value).toMatch(/^[a-z]+@example\.com$/);
        expect(result.captures.find((item) => item.key === "next")).toBeDefined();
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

describe("actual playback clock and lifecycle", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] }));
  afterEach(() => { vi.clearAllTimers(); vi.restoreAllMocks(); vi.useRealTimers(); });

  it("runs three complete cycles with a 2.5-second result hold and the same selected story", () => {
    const demo = walkthrough();
    demo.act(inView);
    demo.act({ type: "scenario", scenario: "cleaning" });
    demo.act({ type: "mode", mode: "chat" });
    for (let cycle = 0; cycle < 3; cycle += 1) {
      expect(demo.state).toMatchObject({ cycles: cycle, elapsed: 0, playing: true, scenario: "cleaning", mode: "chat" });
      vi.advanceTimersByTime(17_400);
      expect(demo.snapshot.complete).toBe(false);
      vi.advanceTimersByTime(100);
      expect(demo.snapshot.complete).toBe(true);
      expect(demo.snapshot.captures.find((item) => item.key === "email")?.value).toBe("alex@example.com");
      vi.advanceTimersByTime(2400);
      expect(demo.state.cycles).toBe(cycle);
      expect(demo.snapshot.complete).toBe(true);
      vi.advanceTimersByTime(100);
      expect(demo.state.cycles).toBe(cycle + 1);
      expect(demo.snapshot.complete).toBe(false);
      expect(demo.snapshot.captures).toEqual([]);
    }
    expect(demo.state.elapsed).toBe(0);
    expect(vi.getTimerCount()).toBe(1);
    demo.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    { type: "visibility", inView: false, tabVisible: true },
    { type: "visibility", inView: true, tabVisible: false },
  ] as ExperienceAction[])("freezes during a long environment pause and resumes without catch-up (%j)", (hidden) => {
    const demo = walkthrough();
    demo.act(inView);
    vi.advanceTimersByTime(4300);
    demo.act(hidden);
    const frozen = demo.snapshot;
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(300_000);
    expect(demo.state.elapsed).toBe(4300);
    expect(demo.snapshot).toEqual(frozen);
    demo.act(inView);
    vi.advanceTimersByTime(100);
    expect(demo.state.elapsed).toBe(4400);
    expect(demo.state.cycles).toBe(0);
    demo.dispose();
  });

  it("manual pause and result inspection stop timers for as long as the visitor needs", () => {
    const demo = walkthrough();
    demo.act(inView);
    vi.advanceTimersByTime(6200);
    demo.act({ type: "pause" });
    vi.advanceTimersByTime(120_000);
    demo.act(inView);
    vi.advanceTimersByTime(1000);
    expect(demo.state.elapsed).toBe(6200);
    expect(vi.getTimerCount()).toBe(0);
    demo.act({ type: "play" });
    vi.advanceTimersByTime(100);
    expect(demo.state.elapsed).toBe(6300);
    demo.act({ type: "finish" });
    vi.advanceTimersByTime(120_000);
    expect(demo.snapshot.complete).toBe(true);
    expect(demo.state.elapsed).toBe(20_000);
    expect(vi.getTimerCount()).toBe(0);
    demo.dispose();
  });

  it("transcript reading stops timers and resumes from the saved point", () => {
    const demo = walkthrough();
    demo.act(inView);
    vi.advanceTimersByTime(3100);
    demo.act({ type: "transcript", open: true });
    vi.advanceTimersByTime(60_000);
    expect(demo.state.elapsed).toBe(3100);
    expect(vi.getTimerCount()).toBe(0);
    demo.act({ type: "transcript", open: false });
    vi.advanceTimersByTime(100);
    expect(demo.state.elapsed).toBe(3200);
    demo.dispose();
  });

  it("maintains only one clock after repeated observer events and rejects restart after disposal", () => {
    const demo = walkthrough();
    for (let repeat = 0; repeat < 20; repeat += 1) demo.act(inView);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(demo.state.elapsed).toBe(1000);
    demo.dispose();
    demo.act({ type: "replay" });
    vi.advanceTimersByTime(1000);
    expect(demo.state.elapsed).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds a stalled clock tick so a busy foreground cannot skip the entire story", () => {
    const tick = vi.fn();
    const now = vi.spyOn(performance, "now").mockReturnValue(0);
    const clock = createExperienceClock(tick);
    clock.setRunning(true);
    now.mockReturnValue(30_000);
    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledOnce();
    expect(tick.mock.calls[0]![0]).toBeLessThanOrEqual(300);
    clock.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never creates a clock in reduced-motion mode, even when the scene is visible", () => {
    const demo = walkthrough();
    demo.act({ type: "motion", reduced: true });
    demo.act(inView);
    vi.advanceTimersByTime(180_000);
    expect(demo.snapshot.complete).toBe(true);
    expect(demo.state.cycles).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    demo.dispose();
  });
});