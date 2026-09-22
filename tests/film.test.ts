import { describe, expect, it } from "vitest";
import {
  filmChapters,
  filmPerspective,
  filmReducer,
  filmSnapshot,
  initialFilm,
  sample,
  type FilmAction,
  type FilmState,
} from "../shared/demo/film";

function run(...actions: FilmAction[]): FilmState {
  return actions.reduce(filmReducer, initialFilm());
}

describe("the continuous HA-1044 product film", () => {
  it("covers six connected chapters and completes the default story in 54 seconds", () => {
    expect(filmChapters.map(({ id }) => id)).toEqual([
      "request", "record", "proposal", "field", "report", "overview",
    ]);
    expect(filmChapters.reduce((duration, chapter) => duration + chapter.duration, 0)).toBe(54_000);

    let state = filmReducer(initialFilm(), { type: "play" });
    for (let chapter = 0; chapter < filmChapters.length; chapter += 1) {
      expect(state.chapter).toBe(chapter);
      expect(state.missing).toBe(false);
      state = filmReducer(state, { type: "tick", ms: filmChapters[chapter]!.duration });
    }
    expect(state).toMatchObject({ chapter: 5, elapsed: 7000, playing: false });
    expect(filmSnapshot(state)).toMatchObject({
      id: "HA-1044", projectId: "HA-1044-J", awarded: true, fieldAttached: true, reportReady: true,
    });
  });

  it("catches up across several chapters without finishing on the original request", () => {
    const end = run({ type: "play" }, { type: "tick", ms: 54_000 });
    expect(end).toMatchObject({ chapter: 5, elapsed: 7000, playing: false });
    expect(filmSnapshot(end).report?.id).toBe("HA-1044-R1");
    expect(filmReducer(end, { type: "tick", ms: 1000 })).toEqual(end);
  });

  it("holds the opening still until the visitor chooses to play", () => {
    const opening = initialFilm();
    expect(opening.playing).toBe(false);
    expect(filmReducer(opening, { type: "tick", ms: 54_000 })).toBe(opening);
  });

  it("pauses at the same point and resumes without losing elapsed time", () => {
    const paused = run({ type: "play" }, { type: "tick", ms: 8200 }, { type: "pause" });
    expect(paused).toMatchObject({ chapter: 1, elapsed: 1200, playing: false });
    expect(filmReducer(paused, { type: "tick", ms: 10_000 })).toBe(paused);
    const resumed = filmReducer(filmReducer(paused, { type: "play" }), { type: "tick", ms: 300 });
    expect(resumed).toMatchObject({ chapter: 1, elapsed: 1500, playing: true });
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("ignores invalid elapsed time %s", (ms) => {
    const state = run({ type: "play" }, { type: "tick", ms: 500 });
    expect(filmReducer(state, { type: "tick", ms })).toBe(state);
  });

  it("starts from the request when playing a completed film again", () => {
    const restarted = run({ type: "play" }, { type: "tick", ms: 54_000 }, { type: "play" });
    expect(restarted).toMatchObject({ chapter: 0, elapsed: 0, playing: true });
    expect(filmSnapshot(restarted).awarded).toBe(false);
  });

  it("replays a clean sample while preserving the selected perspective", () => {
    const replayed = run(
      { type: "seat", seat: "field" },
      { type: "scope", value: "Additional sample scope" },
      { type: "exception" },
      { type: "modal", modal: "call" },
      { type: "replay" },
    );
    expect(replayed).toEqual({ ...initialFilm(), seat: "field" });
    expect(filmSnapshot(replayed)).toMatchObject({ awarded: false, fieldAttached: false, report: null });
  });

  it.each([
    [-10, 0], [2.8, 2], [90, 5], [Number.NaN, 0], [Number.POSITIVE_INFINITY, 0],
  ])("clamps chapter %s to %s and gives manual navigation control", (requested, expected) => {
    const state = run({ type: "play" }, { type: "tick", ms: 1000 }, { type: "chapter", chapter: requested });
    expect(state).toMatchObject({ chapter: expected, elapsed: 0, playing: false, modal: null });
    expect(filmReducer(state, { type: "tick", ms: 15_000 })).toBe(state);
  });

  it("switches all three perspectives at one story point and stops playback", () => {
    const point = run({ type: "chapter", chapter: 3 }, { type: "play" }, { type: "tick", ms: 5000 });
    const perspectives = new Set<string>();
    for (const seat of ["office", "field", "customer"] as const) {
      const switched = filmReducer(point, { type: "seat", seat });
      expect(switched).toMatchObject({ chapter: 3, elapsed: 5000, playing: false, seat });
      expect(filmSnapshot(switched)).toEqual(filmSnapshot(point));
      expect(filmReducer(switched, { type: "tick", ms: 20_000 })).toBe(switched);
      perspectives.add(filmPerspective(switched).title);
    }
    expect(perspectives.size).toBe(3);
  });

  it("retains source identity, location and access throughout every chapter", () => {
    for (let chapter = 0; chapter < filmChapters.length; chapter += 1) {
      const record = filmSnapshot(run({ type: "chapter", chapter }));
      expect(record).toMatchObject({
        id: "HA-1044", customer: sample.customer, site: sample.site,
        scope: sample.scope, access: sample.access,
      });
    }
  });

  it("carries an edited proposal scope into the job, customer view and assembled report", () => {
    const scope = "Roof and envelope assessment, including the north parapet";
    const edited = run(
      { type: "chapter", chapter: 2 }, { type: "play" }, { type: "scope", value: scope },
    );
    expect(edited.playing).toBe(false);
    for (const chapter of [2, 3, 4, 5]) {
      const state = filmReducer(edited, { type: "chapter", chapter });
      expect(filmSnapshot(state).scope).toBe(scope);
      expect(filmPerspective(filmReducer(state, { type: "seat", seat: "customer" })).detail).toBe(scope);
      if (chapter >= 4) expect(filmSnapshot(state).report?.scope).toBe(scope);
    }
  });

  it("keeps pre-award intake and proposal as a request, then creates the linked sample project", () => {
    for (const chapter of [0, 1, 2]) {
      const state = run({ type: "chapter", chapter });
      expect(filmSnapshot(state)).toMatchObject({ id: "HA-1044", kind: "Request", awarded: false, projectId: null });
      if (chapter < 2) expect(filmReducer(state, { type: "award" })).toEqual(state);
    }
    const before = run({ type: "chapter", chapter: 2 }, { type: "play" }, { type: "tick", ms: 5499 });
    expect(filmSnapshot(before).awarded).toBe(false);
    const after = filmReducer(before, { type: "tick", ms: 1 });
    expect(filmSnapshot(after)).toMatchObject({ id: "HA-1044", kind: "Project", awarded: true, projectId: "HA-1044-J" });
    expect(filmSnapshot(run({ type: "chapter", chapter: 2 }, { type: "award" })).awarded).toBe(true);
  });

  it.each(["", "  \n  "])("holds a blank proposal scope %j until it can be reviewed", (scope) => {
    const held = run({ type: "chapter", chapter: 2 }, { type: "award" }, { type: "scope", value: scope });
    expect(held).toMatchObject({ chapter: 2, elapsed: 0, playing: false });
    expect(filmSnapshot(held)).toMatchObject({
      status: "Add a scope", next: "Review proposal scope", kind: "Request", projectId: null,
      awarded: false, fieldAttached: false, reportReady: false, observation: null, report: null,
    });
    for (const action of [{ type: "play" }, { type: "award" }, { type: "tick", ms: 54_000 }] satisfies FilmAction[]) {
      expect(filmReducer(held, action)).toEqual(held);
    }
    for (const chapter of [3, 4, 5]) {
      expect(filmReducer(held, { type: "chapter", chapter }).chapter).toBe(2);
    }
    const restored = filmReducer(held, { type: "scope", value: "Inspect the north parapet and roof drainage" });
    expect(filmSnapshot(restored).awarded).toBe(false);
    expect(filmSnapshot(filmReducer(restored, { type: "award" })).awarded).toBe(true);
  });

  it("stops an in-flight timer when scope is empty instead of advancing a blank job", () => {
    const state = { ...initialFilm(), chapter: 2, elapsed: 5400, playing: true, scope: "" };
    const held = filmReducer(state, { type: "tick", ms: 54_000 });
    expect(held).toMatchObject({ chapter: 2, elapsed: 5400, playing: false });
    expect(filmSnapshot(held).awarded).toBe(false);
    expect(filmReducer(state, { type: "play" }).playing).toBe(false);
    expect(filmReducer(state, { type: "award" }).playing).toBe(false);
  });

  it("never exposes completed artifacts for a blank scope, even at a later timeline point", () => {
    for (const chapter of [2, 3, 4, 5]) {
      expect(filmSnapshot({ ...initialFilm(), scope: " ", chapter, elapsed: 10_000 })).toMatchObject({
        awarded: false, projectId: null, fieldAttached: false, reportReady: false, observation: null, report: null,
        status: "Add a scope", next: "Review proposal scope",
      });
    }
  });

  it("holds a missing access detail until the visitor supplies it, then resumes the same request", () => {
    const missing = run({ type: "chapter", chapter: 4 }, { type: "exception" });
    expect(missing).toMatchObject({ chapter: 1, missing: true, playing: false });
    expect(filmSnapshot(missing)).toMatchObject({
      id: "HA-1044", access: "Access detail needed", awarded: false, report: null,
    });
    expect(filmReducer(missing, { type: "play" })).toBe(missing);
    expect(filmReducer(missing, { type: "tick", ms: 54_000 })).toBe(missing);
    for (const chapter of [2, 3, 4, 5]) {
      expect(filmReducer(missing, { type: "chapter", chapter }).chapter).toBe(1);
    }
    expect(filmReducer(missing, { type: "award" })).toBe(missing);
    const resolved = filmReducer(missing, { type: "resolve" });
    expect(filmSnapshot(resolved)).toMatchObject({ id: "HA-1044", access: sample.access, scope: sample.scope });
    const continued = filmReducer(filmReducer(resolved, { type: "play" }), { type: "tick", ms: 9000 });
    expect(continued).toMatchObject({ chapter: 2, missing: false, playing: true });
  });

  it.each(["email", "call", "photo"] as const)("opens the %s source without advancing the story", (modal) => {
    const opened = run({ type: "play" }, { type: "tick", ms: 8100 }, { type: "modal", modal });
    expect(opened).toMatchObject({ chapter: 1, elapsed: 1100, playing: false, modal });
    expect(filmReducer(opened, { type: "tick", ms: 54_000 })).toBe(opened);
    expect(filmReducer(opened, { type: "modal", modal: null })).toMatchObject({
      chapter: 1, elapsed: 1100, playing: false, modal: null,
    });
  });

  it("attaches field evidence before using that exact observation and image in a report", () => {
    const before = run({ type: "chapter", chapter: 3 }, { type: "play" }, { type: "tick", ms: 4499 });
    expect(filmSnapshot(before)).toMatchObject({ fieldAttached: false, observation: null, report: null });
    const attached = filmReducer(before, { type: "attach" });
    expect(attached.playing).toBe(false);
    expect(filmSnapshot(attached)).toMatchObject({ fieldAttached: true, observation: sample.observation, report: null });
    const reportState = filmReducer(attached, { type: "chapter", chapter: 4 });
    const report = filmSnapshot(reportState).report;
    expect(report).toEqual({
      id: sample.reportId, site: sample.site, scope: sample.scope,
      observation: filmSnapshot(attached).observation, photo: sample.photo, access: sample.access,
    });
    expect(filmSnapshot(reportState).reportReady).toBe(false);
    expect(filmSnapshot(filmReducer(reportState, { type: "review" })).reportReady).toBe(true);
    const opened = filmReducer(reportState, { type: "modal", modal: "report" });
    expect(opened.playing).toBe(false);
    expect(filmSnapshot(opened).report).toEqual(report);
  });

  it("never exposes a report or field observation before field evidence exists", () => {
    for (const chapter of [0, 1, 2, 3]) {
      const state = run({ type: "chapter", chapter });
      expect(filmSnapshot(state)).toMatchObject({ observation: null, report: null, reportReady: false });
      if (chapter !== 3) expect(filmReducer(state, { type: "attach" })).toEqual(state);
      expect(filmReducer(state, { type: "review" })).toEqual(state);
    }
  });
});
