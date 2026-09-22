import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../shared/demo/chapters";
import { seatLines, watchDuration, watchScript } from "../shared/demo/watch";

const STAGES = ["Incoming request", "Organized record", "Proposal", "Field notes", "Reviewable report"];

describe("watch the story", () => {
  it("plays each business through the same success path in 25 to 40 seconds", () => {
    for (const id of ["inspection", "field-service", "recurring"]) {
      const script = watchScript(id);
      const duration = watchDuration(id);
      expect(duration).toBeGreaterThanOrEqual(25_000);
      expect(duration).toBeLessThanOrEqual(40_000);
      expect(script.map((beat) => beat.title)).toEqual(STAGES);
      expect(new Set(script.map((beat) => beat.chapter))).toEqual(new Set([0, 1, 2, 3]));
      const chapters = script.map((beat) => beat.chapter);
      for (let i = 1; i < chapters.length; i += 1) {
        expect(chapters[i]).toBeGreaterThanOrEqual(chapters[i - 1]!);
        expect(script[i]!.office.join("|")).not.toBe(script[i - 1]!.office.join("|"));
      }
      expect(script.every((beat) => beat.jobId === script[0]?.jobId)).toBe(true);
      expect(script.every((beat) => beat.blocked === false && beat.missingInfo === false)).toBe(true);
      expect(script[0]?.connected).toBe(false);
      expect(script.slice(1).every((beat) => beat.connected)).toBe(true);
      expect(CHAPTERS).toHaveLength(4);
    }
  });

  it("keeps missing information out of the default path", () => {
    const cues = watchScript("inspection").map((beat) => beat.cue ?? "").join(" ");
    expect(cues).not.toMatch(/missing/i);
    expect(cues).toMatch(/record/i);
    expect(cues).toMatch(/proposal/i);
    expect(cues).toMatch(/field notes/i);
    expect(cues).toMatch(/review/i);
  });

  it("changes the record when the seat changes", () => {
    for (const id of ["inspection", "field-service", "recurring"]) {
      const beat = watchScript(id)[0]!;
      expect(seatLines(beat, "office").join("|")).not.toBe(seatLines(beat, "field").join("|"));
      expect(seatLines(beat, "office").join("|")).not.toBe(seatLines(beat, "customer").join("|"));
      expect(seatLines(beat, "customer").join(" ")).toMatch(/unsent/i);
    }
  });
});
