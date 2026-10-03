import {
  getAgentBeats, getAgentScenario, RESULT_HOLD_MS,
  type AgentMode, type Capture, type ScenarioId,
} from "./fixtures";

export type PlaybackIntent = "auto" | "play" | "pause" | "inspect";
export type ExperienceState = {
  mode: AgentMode;
  scenario: ScenarioId;
  elapsed: number;
  playing: boolean;
  started: boolean;
  intent: PlaybackIntent;
  inView: boolean;
  tabVisible: boolean;
  reading: boolean;
  reducedMotion: boolean;
  cycles: number;
};
export type ExperienceAction =
  | { type: "mode"; mode: AgentMode }
  | { type: "scenario"; scenario: ScenarioId }
  | { type: "play" | "pause" | "replay" | "finish" }
  | { type: "visibility"; inView: boolean; tabVisible: boolean }
  | { type: "transcript"; open: boolean }
  | { type: "motion"; reduced: boolean }
  | { type: "tick"; ms: number };

export function initialExperience(mode: AgentMode = "voice"): ExperienceState {
  return {
    mode, scenario: "remodeling", elapsed: 0, playing: false, started: false,
    intent: "auto", inView: false, tabVisible: true, reading: false,
    reducedMotion: false, cycles: 0,
  };
}

export function experienceStoryDuration(state: ExperienceState): number {
  return getAgentBeats(state.scenario, state.mode).reduce((total, beat) => total + beat.duration, 0);
}

export function experienceDuration(state: ExperienceState): number {
  return experienceStoryDuration(state) + RESULT_HOLD_MS;
}

function applyPlayback(state: ExperienceState): ExperienceState {
  const playing = state.inView && state.tabVisible && !state.reading && !state.reducedMotion
    && state.intent !== "pause" && state.intent !== "inspect";
  return {
    ...state,
    playing,
    started: state.started || playing || state.reducedMotion,
    elapsed: state.reducedMotion ? experienceDuration(state)
      : playing && state.elapsed >= experienceDuration(state) ? 0 : state.elapsed,
  };
}

export function experienceReducer(state: ExperienceState, action: ExperienceAction): ExperienceState {
  switch (action.type) {
    case "mode":
      return applyPlayback({
        ...state, mode: action.mode, elapsed: 0, cycles: 0, started: false,
      });
    case "scenario":
      return applyPlayback({
        ...state, scenario: action.scenario, elapsed: 0, cycles: 0, started: false,
      });
    case "visibility":
      return applyPlayback({ ...state, inView: action.inView, tabVisible: action.tabVisible });
    case "transcript":
      return applyPlayback({ ...state, reading: action.open });
    case "motion":
      return applyPlayback({ ...state, reducedMotion: action.reduced, started: state.started || action.reduced });
    case "play":
      return applyPlayback({ ...state, intent: "play", started: true });
    case "pause":
      return applyPlayback({ ...state, intent: "pause" });
    case "replay":
      return applyPlayback({ ...state, intent: "play", elapsed: 0, cycles: 0, started: true });
    case "finish":
      return {
        ...state, elapsed: experienceDuration(state), playing: false, intent: "inspect", started: true,
      };
    case "tick": {
      if (!state.playing || !Number.isFinite(action.ms) || action.ms <= 0) return state;
      const duration = experienceDuration(state);
      const total = state.elapsed + action.ms;
      const completedCycles = Math.floor(total / duration);
      return {
        ...state,
        elapsed: total % duration,
        cycles: state.cycles + completedCycles,
      };
    }
  }
}

export function experienceSnapshot(state: ExperienceState) {
  const scenario = getAgentScenario(state.scenario);
  const messages = scenario.stories[state.mode];
  const beats = getAgentBeats(state.scenario, state.mode);
  const duration = experienceDuration(state);
  const storyDuration = experienceStoryDuration(state);
  let beat = 0;
  let boundary = beats[0]!.duration;
  while (beat < beats.length - 1 && state.elapsed >= boundary) {
    beat += 1;
    boundary += beats[beat]!.duration;
  }
  const index = state.started ? beats[beat]!.through : 0;
  const shown = messages.slice(0, index + 1);
  const fields = new Map<string, Capture>();
  for (const item of shown) {
    for (const capture of item.capture ?? []) fields.set(capture.key, capture);
  }
  const complete = state.elapsed >= storyDuration;
  const phase = complete ? "Clear result · Final hold"
    : state.started ? beats[beat]!.label : "A short animated example";
  return {
    scenario, messages, shown, index, beat, duration, storyDuration, complete, phase,
    captures: [...fields.values()],
    progress: Math.min(1, state.elapsed / duration),
    storyProgress: Math.min(1, state.elapsed / storyDuration),
  };
}