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
    blocked: true,
    cue: null,
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Request on the desk",
    office: ["Harborline Assessment", "18 Cedar Wharf roof assessment", "Access notes: missing"],
    field: ["No visit is open", "The office has not passed access notes"],
    customer: ["We have the request", "This status is unsent", "Access notes are still missing"],
  }),
  beat({
    id: "intake",
    stepId: "intake",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: true,
    cue: null,
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Intake record HA-1044",
    office: ["One record", "Access notes stay missing", "Next action: collect the note"],
    field: ["Assignment is closed", "Nothing to sketch until access notes arrive"],
    customer: ["Your request is in intake", "This status is unsent"],
  }),
  beat({
    id: "reply",
    stepId: "intake",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated customer reply fills the missing note: alley door, code 4412.",
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Missing detail filled",
    office: ["HA-1044 access notes: alley door, code 4412", "Filled by a simulated customer reply", "Next action: internal review"],
    field: ["Access notes are on the job", "The visit is still not assigned"],
    customer: ["Your sample reply is on the record", "This status is unsent"],
  }),
  beat({
    id: "review",
    stepId: "review",
    chapter: 1,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Proposal in review",
    office: ["HA-1044-P1 is waiting for a person", "Not a price", "Not sent"],
    field: ["No assignment yet", "Review is still open"],
    customer: ["Scope is in internal review", "You have not been asked to accept it", "This status is unsent"],
  }),
  beat({
    id: "approval",
    stepId: "review",
    chapter: 1,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated internal approval. This is not a customer acceptance.",
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Internal approval",
    office: ["HA-1044-P1 approved internally", "Customer acceptance is still a separate step"],
    field: ["Internal approval is on the record", "You are not dispatched yet"],
    customer: ["Internal review finished", "You have not accepted anything", "This status is unsent"],
  }),
  beat({
    id: "assignment",
    stepId: "job",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Assignment HA-1044",
    office: ["The approved sample is now an assignment", "Site: 18 Cedar Wharf", "Access: alley door, code 4412"],
    field: ["Assignment HA-1044", "Access: alley door, code 4412", "No field note yet"],
    customer: ["A visit is being prepared", "No date was booked", "This status is unsent"],
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
    cue: "Field update is now on the office record.",
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Field update on the office record",
    office: ["Office view of HA-1044 changed", "Field note: flashing is lifted at the north edge"],
    field: ["Sketch attached", "Note: flashing is lifted at the north edge"],
    customer: ["A visit update exists", "The customer note is still unsent"],
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
    cue: null,
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Report assembled",
    office: ["Notes from HA-1044 are in one report", "The report was not sent"],
    field: ["Your notes are in the report draft"],
    customer: ["The report is a draft", "It was not sent to you"],
  }),
  beat({
    id: "acceptance",
    stepId: "handoff",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated customer acceptance. Separate from the internal approval. Nothing was sent.",
    durationMs: 3600,
    jobId: "HA-1044",
    title: "Customer acceptance",
    office: ["Sample customer acceptance is on HA-1044", "It is separate from the internal approval", "No message went out"],
    field: ["The office recorded a sample acceptance", "No new site work was added"],
    customer: ["Sample acceptance", "This status was not emailed"],
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
    blocked: true,
    cue: null,
    durationMs: 4000,
    jobId: "NP-220",
    title: "No-heat request",
    office: ["North Pier Mechanical", "No-heat call", "Boiler badge: missing"],
    field: ["No visit is open", "The badge number is not on the job"],
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
    blocked: true,
    cue: null,
    durationMs: 4000,
    jobId: "NP-220",
    title: "Intake record NP-220",
    office: ["One record", "Boiler badge stays missing", "Next action: collect the badge"],
    field: ["Dispatch is closed", "There is no badge to take to the site"],
    customer: ["Your call is in intake", "This status is unsent"],
  }),
  beat({
    id: "reply",
    stepId: "structure",
    chapter: 0,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated customer reply fills the missing badge: NP-8841.",
    durationMs: 4000,
    jobId: "NP-220",
    title: "Badge number filled",
    office: ["NP-220 badge: NP-8841", "Filled by a simulated customer reply", "Next action: plan the visit"],
    field: ["Badge NP-8841 is on the job", "You are not assigned yet"],
    customer: ["Your sample reply is on the record", "This status is unsent"],
  }),
  beat({
    id: "plan",
    stepId: "assign",
    chapter: 1,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 4000,
    jobId: "NP-220",
    title: "Visit in review",
    office: ["Sample visit for NP-220 is planned", "A person has not approved it"],
    field: ["The plan is visible", "You are not dispatched"],
    customer: ["A visit is being planned", "You have not been asked to accept a time", "This status is unsent"],
  }),
  beat({
    id: "approval",
    stepId: "assign",
    chapter: 1,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated internal approval. This is not a customer acceptance.",
    durationMs: 4000,
    jobId: "NP-220",
    title: "Internal approval",
    office: ["NP-220 visit approved internally", "Customer acceptance is still separate"],
    field: ["The visit may be prepared", "This is not a customer yes"],
    customer: ["Internal review finished", "You have not accepted a visit", "This status is unsent"],
  }),
  beat({
    id: "work",
    stepId: "update",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Field update is now on the office record.",
    durationMs: 4000,
    jobId: "NP-220",
    title: "Field update on the office record",
    office: ["Office view of NP-220 changed", "Field note: igniter replaced, heat restored"],
    field: ["Sketch of the boiler", "Note: igniter replaced, heat restored"],
    customer: ["A technician update exists", "The customer note is still unsent"],
  }),
  beat({
    id: "draft",
    stepId: "status",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 4000,
    jobId: "NP-220",
    title: "Status assembled",
    office: ["Notes from NP-220 are in one draft", "The draft was not sent"],
    field: ["Your note is in the draft status"],
    customer: ["A status draft exists", "It was not sent to you"],
  }),
  beat({
    id: "acceptance",
    stepId: "follow-up",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated customer acceptance. Separate from the internal approval. Nothing was sent.",
    durationMs: 4000,
    jobId: "NP-220",
    title: "Customer acceptance",
    office: ["Sample customer acceptance is on NP-220", "Separate from the internal approval", "No message went out"],
    field: ["The office recorded a sample acceptance"],
    customer: ["Sample acceptance of the repair status", "This status was not emailed"],
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
    durationMs: 4000,
    jobId: "LP-77",
    title: "Recurring request",
    office: ["Lumen Property Care", "Roof-drain check is due", "No exception yet"],
    field: ["The visit is not open", "Checklist is not in hand"],
    customer: ["The next check is on the board", "This status is unsent"],
  }),
  beat({
    id: "plan",
    stepId: "visit",
    chapter: 1,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 4000,
    jobId: "LP-77",
    title: "Visit planned",
    office: ["LP-77 checklist is planned", "The live calendar was not changed"],
    field: ["Checklist is ready", "You are not on site yet"],
    customer: ["A routine visit is planned", "Nothing was scheduled in your calendar", "This status is unsent"],
  }),
  beat({
    id: "issue",
    stepId: "issue",
    chapter: 2,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: true,
    cue: "The visit found a blocked drain. That exception stays visible.",
    durationMs: 4000,
    jobId: "LP-77",
    title: "Exception on LP-77",
    office: ["LP-77 exception: blocked roof drain", "It stays visible until a person decides"],
    field: ["Site note: blocked roof drain", "Waiting on the office"],
    customer: ["An exception was found", "You have not been asked to approve extra work", "This status is unsent"],
  }),
  beat({
    id: "review",
    stepId: "approval",
    chapter: 2,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    connected: true,
    blocked: true,
    cue: null,
    durationMs: 4000,
    jobId: "LP-77",
    title: "Exception in review",
    office: ["LP-77 exception is in review", "Not a price", "Not sent"],
    field: ["The office is reviewing the drain note"],
    customer: ["The exception is in internal review", "This status is unsent"],
  }),
  beat({
    id: "approval",
    stepId: "approval",
    chapter: 2,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated internal approval. This is not a customer acceptance.",
    durationMs: 4000,
    jobId: "LP-77",
    title: "Internal approval",
    office: ["LP-77 exception approved internally", "Customer acceptance is still separate"],
    field: ["Internal approval is on the record", "No customer yes yet"],
    customer: ["Internal review finished", "You have not accepted the exception", "This status is unsent"],
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
    cue: "Notes assemble into one update. It was not sent.",
    durationMs: 4000,
    jobId: "LP-77",
    title: "Update assembled",
    office: ["Office view of LP-77 includes the field note", "The customer update is a draft"],
    field: ["Your drain note is in the draft update"],
    customer: ["An update was drafted", "It was not sent to you"],
  }),
  beat({
    id: "next",
    stepId: "next",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: null,
    durationMs: 4000,
    jobId: "LP-77",
    title: "Next visit noted",
    office: ["Next roof-drain check is written down", "Nothing was scheduled in a live system"],
    field: ["The next visit is noted", "You are not booked"],
    customer: ["A next visit is noted", "This status is unsent"],
  }),
  beat({
    id: "acceptance",
    stepId: "next",
    chapter: 3,
    missingInfo: false,
    decision: "approved",
    syncProblem: false,
    connected: true,
    blocked: false,
    cue: "Simulated customer acceptance. Separate from the internal approval. Nothing was sent.",
    durationMs: 4000,
    jobId: "LP-77",
    title: "Customer acceptance",
    office: ["Sample customer acceptance is on LP-77", "Separate from the internal approval", "No message went out"],
    field: ["The office recorded a sample acceptance"],
    customer: ["Sample acceptance of the update", "This status was not emailed"],
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
