import type { Decision } from "./types";

export type ChapterIndex = 0 | 1 | 2 | 3;

export const CHAPTERS = [
  { id: "request", label: "Request", kicker: "REQUEST" },
  { id: "plan", label: "Plan", kicker: "PLAN" },
  { id: "work", label: "Work", kicker: "WORK" },
  { id: "wrap", label: "Wrap up", kicker: "WRAP UP" },
] as const;

const STEP_CHAPTER: Record<string, ChapterIndex> = {
  "inspection:request": 0,
  "inspection:intake": 0,
  "inspection:gap": 0,
  "inspection:proposal": 1,
  "inspection:review": 1,
  "inspection:revision": 1,
  "inspection:job": 2,
  "inspection:field": 2,
  "inspection:report": 3,
  "inspection:handoff": 3,
  "inspection:sync": 3,
  "field-service:request": 0,
  "field-service:structure": 0,
  "field-service:gap": 0,
  "field-service:assign": 1,
  "field-service:update": 2,
  "field-service:status": 3,
  "field-service:follow-up": 3,
  "recurring:task": 0,
  "recurring:visit": 1,
  "recurring:issue": 2,
  "recurring:approval": 2,
  "recurring:declined": 2,
  "recurring:update": 3,
  "recurring:next": 3,
};

const CAPTION: Record<string, string> = {
  "inspection:request": "A roof assessment request is on the desk. Access notes were not included.",
  "inspection:intake": "The request is one record now. The access notes are still missing.",
  "inspection:gap": "Blocked. Later work stays closed while the access notes are missing.",
  "inspection:proposal": "A sample plan is ready for review. It is not a price, and it was not sent.",
  "inspection:review": "Internal review is open. Approving the sample is not a customer acceptance.",
  "inspection:revision": "Needs changes. Field work stays closed. The customer has not been asked.",
  "inspection:job": "The sample visit is prepared. Access notes are still missing on the record.",
  "inspection:field": "A synthetic field sketch is attached. It is not a photograph of a real site.",
  "inspection:report": "Report preview. This is a simulated next step, and it was not sent.",
  "inspection:handoff": "The handoff is a preview only. No invoice was created.",
  "inspection:sync": "The sample handoff cannot sync. A person still owns invoicing.",
  "field-service:request": "A no-heat call is in. The boiler badge number is missing.",
  "field-service:structure": "The call is one record. The badge number stays missing.",
  "field-service:gap": "Blocked. The visit is not assigned while the badge number is missing.",
  "field-service:assign": "A sample visit is planned. Nobody has been dispatched for real.",
  "field-service:update": "The technician update is on the job, with a synthetic sketch.",
  "field-service:status": "Customer status is a draft. It was not sent.",
  "field-service:follow-up": "The next action is written down. No message went out.",
  "recurring:task": "The next roof-drain check is on the board.",
  "recurring:visit": "The visit and checklist are planned. The schedule was not changed.",
  "recurring:issue": "The visit found an exception. It waits for a person.",
  "recurring:approval": "Internal review of the exception. This is not a customer acceptance.",
  "recurring:declined": "Needs changes. The customer update stays unsent.",
  "recurring:update": "The customer update is a draft. It was not sent.",
  "recurring:next": "The next visit is noted. Nothing was scheduled in a live system.",
};

export function chapterOf(scenarioId: string, stepId: string): ChapterIndex {
  return STEP_CHAPTER[`${scenarioId}:${stepId}`] ?? 0;
}

export function storyCaption(scenarioId: string, stepId: string, decision: Decision, missing: boolean): string {
  if (missing && chapterOf(scenarioId, stepId) === 0) {
    return CAPTION[`${scenarioId}:gap`] ?? "Blocked. The missing detail stays missing, and later work stays closed.";
  }
  if (decision === "rejected" && stepId !== "revision" && stepId !== "declined" && stepId !== "gap") {
    const held = CAPTION[`${scenarioId}:revision`] ?? CAPTION[`${scenarioId}:declined`];
    if (held && chapterOf(scenarioId, stepId) <= 1) return held;
  }
  return CAPTION[`${scenarioId}:${stepId}`] ?? "Sample step. Nothing is sent from this preview.";
}

export function openingStep(scenarioId: string, stepId: string): boolean {
  if (scenarioId === "recurring") return stepId === "task";
  return stepId === "request";
}
