import { chapterOf } from "./chapters";
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
  let index = Math.min(state.index, Math.max(steps.length - 1, 0));
  if (state.decision === "rejected") {
    let limit = 0;
    steps.forEach((item, stepIndex) => {
      if (chapterOf(scenario.id, item.id) <= 1) limit = stepIndex;
    });
    index = Math.min(index, limit);
  }
  return { ...state, index };
}

export function reconcileState(state: DemoState, scenarios: readonly Scenario[]): DemoState {
  const scenario = scenarios.find((item) => item.id === state.scenarioId) ?? scenarios[0];
  if (!scenario) return state;
  let decision = state.decision;
  let missingInfo = state.missingInfo;
  let syncProblem = state.syncProblem;
  if (decision === "approved" || decision === "rejected") missingInfo = false;
  if (missingInfo) {
    decision = "pending";
    syncProblem = false;
  }
  if (decision !== "approved") syncProblem = false;
  return clamp({
    ...state,
    scenarioId: scenario.id,
    playing: false,
    decision,
    missingInfo,
    syncProblem,
  }, scenario);
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
      if (state.index >= count - 1) return clamp({ ...state, playing: false }, current);
      return clamp({ ...state, index: state.index + 1 }, current);
    }
    case "next": {
      const count = visibleSteps(current, state).length;
      return clamp({ ...state, index: Math.min(state.index + 1, Math.max(count - 1, 0)), playing: false }, current);
    }
    case "prev":
      return { ...state, index: Math.max(state.index - 1, 0), playing: false };
    case "reset":
      return { ...initialState(state.scenarioId), view: state.view };
    case "missing": {
      if (action.value) {
        const next = clamp({
          ...state,
          missingInfo: true,
          decision: "pending",
          syncProblem: false,
          playing: false,
          index: 0,
        }, current);
        const steps = visibleSteps(current, next);
        const gap = steps.findIndex((step) => step.gate === "gap");
        return { ...next, index: gap >= 0 ? gap : next.index };
      }
      return clamp({ ...state, missingInfo: false, playing: false }, current);
    }
    case "approve":
      return clamp({ ...state, decision: "approved", missingInfo: false, playing: false }, current);
    case "reject":
      return clamp({ ...state, decision: "rejected", missingInfo: false, syncProblem: false, playing: false }, current);
    case "sync":
      if (state.decision !== "approved" || state.missingInfo) {
        return { ...state, syncProblem: false, playing: false };
      }
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
  const requestedIndex = Number(params.get("step") ?? "0") || 0;
  const reconciled = reconcileState(
    {
      ...base,
      missingInfo: params.get("gap") === "1",
      decision: decision === "approved" || decision === "rejected" ? decision : "pending",
      syncProblem: params.get("sync") === "1",
      view: view === "review" || view === "customer" || view === "internal" ? view : "internal",
      index: requestedIndex,
    },
    scenarios,
  );
  return reduceDemo(reconciled, { type: "goto", index: requestedIndex }, scenarios);
}
