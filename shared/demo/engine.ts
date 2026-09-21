import type { DemoAction, DemoState, DemoStep, Gate, Scenario } from "./types";

export function stepVisible(gate: Gate, state: Pick<DemoState, "missingInfo" | "decision" | "syncProblem">): boolean {
  if (state.missingInfo) return gate === "always" || gate === "gap";
  if (gate === "gap") return false;
  if (gate === "always" || gate === "ready") return true;
  if (gate === "rejected") return state.decision === "rejected";
  if (gate === "approved") return state.decision === "approved";
  if (gate === "sync-ok") return state.decision === "approved" && !state.syncProblem;
  if (gate === "sync-fail") return state.decision === "approved" && state.syncProblem;
  return false;
}

export function visibleSteps(scenario: Scenario, state: Pick<DemoState, "missingInfo" | "decision" | "syncProblem">): DemoStep[] {
  return scenario.steps.filter((step) => stepVisible(step.gate, state));
}

export function initialState(scenarioId: string): DemoState {
  return {
    scenarioId,
    index: 0,
    playing: false,
    missingInfo: false,
    decision: "pending",
    syncProblem: false,
    view: "internal",
    recordOpen: false,
    outputOpen: false,
  };
}

function clamp(state: DemoState, scenario: Scenario): DemoState {
  const steps = visibleSteps(scenario, state);
  const index = Math.min(state.index, Math.max(steps.length - 1, 0));
  return { ...state, index };
}

export function reduceDemo(state: DemoState, action: DemoAction, scenarios: readonly Scenario[]): DemoState {
  const current = scenarios.find((item) => item.id === state.scenarioId) ?? scenarios[0];
  if (!current) return state;
  switch (action.type) {
    case "select": {
      if (!scenarios.some((item) => item.id === action.scenarioId)) return state;
      return initialState(action.scenarioId);
    }
    case "run":
      return { ...initialState(state.scenarioId), playing: action.autoplay, view: state.view };
    case "pause":
      return { ...state, playing: false };
    case "resume":
      return { ...state, playing: true };
    case "tick": {
      const count = visibleSteps(current, state).length;
      if (state.index >= count - 1) return { ...state, playing: false };
      return { ...state, index: state.index + 1 };
    }
    case "next": {
      const count = visibleSteps(current, state).length;
      return { ...state, index: Math.min(state.index + 1, Math.max(count - 1, 0)), playing: false };
    }
    case "prev":
      return { ...state, index: Math.max(state.index - 1, 0), playing: false };
    case "reset":
      return { ...initialState(state.scenarioId), view: state.view };
    case "missing": {
      const next = clamp({ ...state, missingInfo: action.value, playing: false, index: action.value ? 0 : state.index }, current);
      if (action.value) {
        const steps = visibleSteps(current, next);
        const gap = steps.findIndex((step) => step.gate === "gap");
        return { ...next, index: gap >= 0 ? gap : next.index };
      }
      return next;
    }
    case "approve":
      return clamp({ ...state, decision: "approved", playing: false }, current);
    case "reject":
      return clamp({ ...state, decision: "rejected", playing: false }, current);
    case "sync":
      return clamp({ ...state, syncProblem: action.value, playing: false }, current);
    case "view":
      return { ...state, view: action.view };
    case "record":
      return { ...state, recordOpen: action.open };
    case "output":
      return { ...state, outputOpen: action.open };
    case "goto":
      return clamp({ ...state, index: action.index, playing: false }, current);
    default:
      return state;
  }
}

export function stateFromSearch(params: URLSearchParams, scenarios: readonly Scenario[]): DemoState {
  const requested = params.get("scenario") ?? scenarios[0]?.id ?? "inspection";
  const base = initialState(scenarios.some((item) => item.id === requested) ? requested : scenarios[0]?.id ?? "inspection");
  const decision = params.get("decision");
  const view = params.get("view");
  const next = reduceDemo(
    {
      ...base,
      missingInfo: params.get("gap") === "1",
      decision: decision === "approved" || decision === "rejected" ? decision : "pending",
      syncProblem: params.get("sync") === "1",
      view: view === "review" || view === "customer" || view === "internal" ? view : "internal",
      index: Number(params.get("step") ?? "0") || 0,
    },
    { type: "goto", index: Number(params.get("step") ?? "0") || 0 },
    scenarios,
  );
  return next;
}
