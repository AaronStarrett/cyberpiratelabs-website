import { describe, expect, it } from "vitest";
import { CHAPTERS } from "../shared/demo/chapters";
import { seatLines, watchDuration, watchScript } from "../shared/demo/watch";

describe("watch the story", () => {
  it("plays each business in four chapters within 25 to 40 seconds", () => {
    for (const id of ["inspection", "field-service", "recurring"]) {
      const script = watchScript(id);
      const duration = watchDuration(id);
      expect(duration).toBeGreaterThanOrEqual(25_000);
      expect(duration).toBeLessThanOrEqual(40_000);
      expect(new Set(script.map((beat) => beat.chapter))).toEqual(new Set([0, 1, 2, 3]));
      const chapters = script.map((beat) => beat.chapter);
      for (let i = 1; i < chapters.length; i += 1) {
        expect(chapters[i]).toBeGreaterThanOrEqual(chapters[i - 1]!);
      }
      expect(script.every((beat) => beat.jobId === script[0]?.jobId)).toBe(true);
      expect(CHAPTERS).toHaveLength(4);
    }
  });

  it("shows a customer reply, an internal approval, and a later acceptance", () => {
    const cues = watchScript("inspection").map((beat) => beat.cue).filter(Boolean).join(" ");
    expect(cues).toContain("Simulated customer reply");
    expect(cues).toContain("Simulated internal approval");
    expect(cues).toContain("Simulated customer acceptance");
    const approval = watchScript("inspection").findIndex((beat) => beat.cue?.startsWith("Simulated internal approval"));
    const acceptance = watchScript("inspection").findIndex((beat) => beat.cue?.startsWith("Simulated customer acceptance"));
    expect(approval).toBeGreaterThan(-1);
    expect(acceptance).toBeGreaterThan(approval);
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
