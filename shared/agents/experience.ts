import { getAgentScenario, type AgentMode, type Capture, type ScenarioId } from "./fixtures";

export type ExperienceState = {
  mode: AgentMode;
  scenario: ScenarioId;
  elapsed: number;
  playing: boolean;
};
export type ExperienceAction =
  | { type: "mode"; mode: AgentMode }
  | { type: "scenario"; scenario: ScenarioId }
  | { type: "play" | "pause" | "replay" | "finish" }
  | { type: "tick"; ms: number };

export function initialExperience(mode: AgentMode = "voice"): ExperienceState {
  return { mode, scenario: "remodeling", elapsed: 0, playing: false };
}

export function experienceDuration(state: ExperienceState): number {
  return getAgentScenario(state.scenario).stories[state.mode].reduce(
    (total, item) => total + item.duration, 0,
  );
}

export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case "mode":
      return { ...state, mode: action.mode, elapsed: 0, playing: false };
    case "scenario":
      return { ...state, scenario: action.scenario, elapsed: 0, playing: false };
    case "play":
      return {
        ...state,
        elapsed: state.elapsed >= experienceDuration(state) ? 0 : state.elapsed,
        playing: true,
      };
    case "pause":
      return { ...state, playing: false };
    case "replay":
      return { ...state, elapsed: 0, playing: true };
    case "finish":
      return { ...state, elapsed: experienceDuration(state), playing: false };
    case "tick": {
      if (!state.playing || !Number.isFinite(action.ms) || action.ms <= 0) return state;
      const duration = experienceDuration(state);
      const elapsed = Math.min(duration, state.elapsed + action.ms);
      return { ...state, elapsed, playing: elapsed < duration };
    }
  }
}

export function experienceSnapshot(state: ExperienceState) {
  const scenario = getAgentScenario(state.scenario);
  const messages = scenario.stories[state.mode];
  const duration = experienceDuration(state);
  let index = 0;
  let boundary = messages[0]!.duration;
  while (index < messages.length - 1 && state.elapsed >= boundary) {
    index += 1;
    boundary += messages[index]!.duration;
  }
  const shown = messages.slice(0, index + 1);
  const fields = new Map<string, Capture>();
  for (const item of shown) {
    for (const capture of item.capture ?? []) fields.set(capture.key, capture);
  }
  const complete = state.elapsed >= duration;
  const phase = complete ? "Follow-up requested" : fields.size > 0 ? "Details taking shape" : "Conversation begins";
  return {
    scenario, messages, shown, index, duration, complete, phase,
    captures: [...fields.values()],
    progress: Math.min(1, state.elapsed / duration),
  };
}