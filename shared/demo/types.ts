export type Evidence = "development-source" | "illustrative" | "planned";
export type Gate = "always" | "gap" | "ready" | "rejected" | "approved" | "sync-ok" | "sync-fail";
export type ViewId = "internal" | "review" | "customer";
export type Decision = "pending" | "approved" | "rejected";

export type DemoStep = {
  id: string;
  phase: string;
  title: string;
  narration: string;
  evidence: Evidence;
  evidenceNote: string;
  gate: Gate;
  decisionPoint?: boolean;
  input: string;
  organized: string;
  human: string;
  outcome: string;
  views: Record<ViewId, { title: string; lines: string[] }>;
  record: { title: string; fields: Array<{ label: string; value: string }> };
  output?: { title: string; lines: string[] };
  sketch?: boolean;
};

export type Scenario = {
  id: string;
  title: string;
  company: string;
  summary: string;
  evidenceNote: string;
  problem: string;
  workflow: string;
  outcome: string;
  steps: DemoStep[];
};

export type DemoState = {
  scenarioId: string;
  index: number;
  playing: boolean;
  missingInfo: boolean;
  decision: Decision;
  syncProblem: boolean;
  view: ViewId;
  recordOpen: boolean;
  outputOpen: boolean;
};

export type DemoAction =
  | { type: "select"; scenarioId: string }
  | { type: "run"; autoplay: boolean }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "next" }
  | { type: "tick" }
  | { type: "prev" }
  | { type: "reset" }
  | { type: "missing"; value: boolean }
  | { type: "approve" }
  | { type: "reject" }
  | { type: "sync"; value: boolean }
  | { type: "view"; view: ViewId }
  | { type: "record"; open: boolean }
  | { type: "output"; open: boolean }
  | { type: "goto"; index: number };
