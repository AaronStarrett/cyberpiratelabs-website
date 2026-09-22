import { chapterOf, type ChapterIndex } from "./chapters";
import type { Decision, DemoStep, Scenario } from "./types";

export type StorySeat = "office" | "field" | "customer";

export type WatchBeat = {
  id: string;
  stepId: string;
  chapter: ChapterIndex;
  missingInfo: boolean;
  decision: Decision;
  syncProblem: boolean;
  connected: boolean;
  blocked: boolean;
  cue: string | null;
  durationMs: number;
  jobId: string;
  title: string;
  office: string[];
  field: string[];
  customer: string[];
};

const JOB_IDS: Record<string, string> = {
  inspection: "HA-1044",
  "field-service": "NP-220",
  recurring: "LP-77",
};

function beat(partial: WatchBeat): WatchBeat {
  return partial;
}

const inspection: WatchBeat[] = [
  beat({
    id: "request",
    stepId: "request",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: false,
    blocked: false,
    cue: null,
    durationMs: 6000,
    jobId: "HA-1044",
    title: "Incoming request",
    office: ["Harborline Assessment", "18 Cedar Wharf roof assessment", "Just arrived, not organized yet"],
    field: ["No visit is open", "The request has not been filed"],
    customer: ["We have the request", "This status is unsent"],
  }),
  beat({
    id: "record",
    stepId: "intake",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The loose request is now one record.",
    durationMs: 6000,
    jobId: "HA-1044",
    title: "Organized record",
    office: ["HA-1044 holds the site and the scope together", "18 Cedar Wharf", "Next action: write the proposal"],
    field: ["HA-1044 exists", "You are not assigned yet"],
    customer: ["Your request is on one record", "This status is unsent"],
  }),
  beat({
    id: "proposal",
    stepId: "review",
    chapter: 1,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Sample proposal HA-1044-P1. Not a price. Not sent.",
    durationMs: 6000,
    jobId: "HA-1044",
    title: "Proposal",
    office: ["HA-1044-P1 scope: roof and envelope assessment", "Ready for the visit", "Not sent"],
    field: ["The proposal names the visit", "You are not on site yet"],
    customer: ["A proposal exists", "You have not been asked to accept it", "This status is unsent"],
  }),
  beat({
    id: "field",
    stepId: "field",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Field notes are now on the office record.",
    durationMs: 6000,
    jobId: "HA-1044",
    title: "Field notes",
    office: ["HA-1044 field note: flashing is lifted at the north edge", "The sketch is attached"],
    field: ["Sketch of the north edge", "Note: flashing is lifted"],
    customer: ["A visit note exists", "The customer note is still unsent"],
  }),
  beat({
    id: "report",
    stepId: "report",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The report is ready to review. It was not sent.",
    durationMs: 6000,
    jobId: "HA-1044",
    title: "Reviewable report",
    office: ["HA-1044 report gathers the proposal and the field note", "Held for review", "Not sent"],
    field: ["Your north-edge note is in the report"],
    customer: ["A report is ready to review", "It was not sent to you"],
  }),
];

const fieldService: WatchBeat[] = [
  beat({
    id: "request",
    stepId: "request",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: false,
    blocked: false,
    cue: null,
    durationMs: 6000,
    jobId: "NP-220",
    title: "Incoming request",
    office: ["North Pier Mechanical", "No-heat call", "Just arrived, not organized yet"],
    field: ["No visit is open", "The call has not been filed"],
    customer: ["We have the no-heat call", "This status is unsent"],
  }),
  beat({
    id: "record",
    stepId: "structure",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The call is now one record.",
    durationMs: 6000,
    jobId: "NP-220",
    title: "Organized record",
    office: ["NP-220 holds the site and boiler badge NP-8841", "Next action: write the visit proposal"],
    field: ["NP-220 exists", "Badge NP-8841 is on the job", "You are not assigned yet"],
    customer: ["Your call is on one record", "This status is unsent"],
  }),
  beat({
    id: "proposal",
    stepId: "assign",
    chapter: 1,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Sample visit proposal for NP-220. Not a price. Not sent.",
    durationMs: 6000,
    jobId: "NP-220",
    title: "Proposal",
    office: ["NP-220 visit proposal: inspect the boiler and restore heat", "Ready for the visit", "Not sent"],
    field: ["The proposal names the boiler visit", "You are not on site yet"],
    customer: ["A visit proposal exists", "You have not been asked to accept a time", "This status is unsent"],
  }),
  beat({
    id: "field",
    stepId: "update",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Field notes are now on the office record.",
    durationMs: 6000,
    jobId: "NP-220",
    title: "Field notes",
    office: ["NP-220 field note: igniter replaced, heat restored", "The boiler sketch is attached"],
    field: ["Sketch of the boiler", "Note: igniter replaced, heat restored"],
    customer: ["A technician note exists", "The customer note is still unsent"],
  }),
  beat({
    id: "report",
    stepId: "status",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The status is ready to review. It was not sent.",
    durationMs: 6000,
    jobId: "NP-220",
    title: "Reviewable report",
    office: ["NP-220 status gathers the visit proposal and the field note", "Held for review", "Not sent"],
    field: ["Your igniter note is in the status"],
    customer: ["A status is ready to review", "It was not sent to you"],
  }),
];

const recurring: WatchBeat[] = [
  beat({
    id: "request",
    stepId: "task",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: false,
    blocked: false,
    cue: null,
    durationMs: 6000,
    jobId: "LP-77",
    title: "Incoming request",
    office: ["Lumen Property Care", "Roof-drain check is due", "Just arrived, not organized yet"],
    field: ["The visit is not open", "The checklist is not in hand"],
    customer: ["The next check is on the board", "This status is unsent"],
  }),
  beat({
    id: "record",
    stepId: "task",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The due check is now one record.",
    durationMs: 6000,
    jobId: "LP-77",
    title: "Organized record",
    office: ["LP-77 holds the property and the drain checklist", "Next action: write the visit proposal"],
    field: ["LP-77 exists", "You are not assigned yet"],
    customer: ["Your check is on one record", "This status is unsent"],
  }),
  beat({
    id: "proposal",
    stepId: "visit",
    chapter: 1,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Sample visit proposal for LP-77. The live calendar was not changed.",
    durationMs: 6000,
    jobId: "LP-77",
    title: "Proposal",
    office: ["LP-77 proposal: roof-drain check on the standing checklist", "Ready for the visit", "Not sent"],
    field: ["The checklist is ready", "You are not on site yet"],
    customer: ["A routine visit is proposed", "Nothing was scheduled in your calendar", "This status is unsent"],
  }),
  beat({
    id: "field",
    stepId: "issue",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Field notes are now on the office record.",
    durationMs: 6000,
    jobId: "LP-77",
    title: "Field notes",
    office: ["LP-77 field note: roof drain is clear", "The site sketch is attached"],
    field: ["Sketch of the drain", "Note: roof drain is clear"],
    customer: ["A visit note exists", "The customer note is still unsent"],
  }),
  beat({
    id: "report",
    stepId: "update",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "The update is ready to review. It was not sent.",
    durationMs: 6000,
    jobId: "LP-77",
    title: "Reviewable report",
    office: ["LP-77 update gathers the checklist and the clear-drain note", "Held for review", "Not sent"],
    field: ["Your clear-drain note is in the update"],
    customer: ["An update is ready to review", "It was not sent to you"],
  }),
];

const SCRIPTS: Record<string, WatchBeat[]> = {
  inspection,
  "field-service": fieldService,
  recurring,
};

export function jobIdFor(scenarioId: string): string {
  return JOB_IDS[scenarioId] ?? "SAMPLE";
}

export function watchScript(scenarioId: string): WatchBeat[] {
  return SCRIPTS[scenarioId] ?? inspection;
}

export function watchDuration(scenarioId: string): number {
  return watchScript(scenarioId).reduce((sum, item) => sum + item.durationMs, 0);
}

export function seatLines(item: WatchBeat, seat: StorySeat): string[] {
  if (seat === "field") return item.field;
  if (seat === "customer") return item.customer;
  return item.office;
}

export function interactiveSurface(
  scenario: Scenario,
  step: DemoStep,
  seat: StorySeat,
  flags: { missingInfo: boolean; decision: Decision },
): { jobId: string; title: string; lines: string[]; cue: string | null } {
  const jobId = jobIdFor(scenario.id);
  const cue = flags.missingInfo
    ? "Missing information stays on the record. Later work is closed."
    : flags.decision === "approved"
      ? "Simulated internal approval. This is not a customer acceptance."
      : flags.decision === "rejected"
        ? "Needs changes. Later work stays closed."
        : null;
  if (seat === "office") {
    return {
      jobId,
      title: step.record.title,
      lines: step.record.fields.map((field) => `${field.label}: ${field.value}`),
      cue,
    };
  }
  if (seat === "field") {
    const chapter = chapterOf(scenario.id, step.id);
    return {
      jobId,
      title: `Field · ${jobId}`,
      lines: chapter >= 2
        ? ["A field note is on this job.", ...step.views.internal.lines]
        : ["No field update yet.", ...step.views.internal.lines.slice(0, 2)],
      cue,
    };
  }
  return {
    jobId,
    title: step.views.customer.title,
    lines: [...step.views.customer.lines, "This status is unsent."],
    cue,
  };
}
