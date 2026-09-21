import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CHAPTERS, chapterOf, openingStep, storyCaption, type ChapterIndex } from "../../shared/demo/chapters";
import { initialState, reduceDemo, stateFromSearch, visibleSteps } from "../../shared/demo/engine";
import { scenarios } from "../../shared/demo/scenarios";
import type { DemoAction, DemoState } from "../../shared/demo/types";
import { interactiveSurface, seatLines, watchScript, type StorySeat } from "../../shared/demo/watch";
import type { StageController, StagePose } from "./stage/createStage";

const seats: Array<{ id: StorySeat; label: string }> = [
  { id: "office", label: "Office" },
  { id: "field", label: "Field" },
  { id: "customer", label: "Customer" },
];

const blurbs: Record<string, string> = {
  inspection: "Harborline asks for a roof assessment. The outcome is a report that was not sent.",
  "field-service": "North Pier calls about no heat. The outcome is an unsent repair status.",
  recurring: "Lumen has a drain check due. The outcome is an exception that waits for a person.",
};

type BlockReason = "motion" | "save-data" | "memory" | "cores" | "webgl" | "lost" | null;
type StoryMode = "watch" | "interactive";

function blockReason(): Exclude<BlockReason, "motion" | "lost"> {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return "save-data";
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory > 0 && nav.deviceMemory <= 2) return "memory";
  if (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) return "cores";
  try {
    const test = document.createElement("canvas");
    if (!(test.getContext("webgl2") || test.getContext("webgl"))) return "webgl";
  } catch {
    return "webgl";
  }
  return null;
}

export default function ProductStage({ variant = "home" }: { variant?: "home" | "focus" }) {
  const baseId = useId();
  const stageColumnRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<StageController | null>(null);
  const poseRef = useRef<StagePose | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const [state, setState] = useState<DemoState>(() => initialState("inspection"));
  const [mode, setMode] = useState<StoryMode>("watch");
  const [beat, setBeat] = useState(0);
  const [watchPlaying, setWatchPlaying] = useState(false);
  const [seat, setSeat] = useState<StorySeat>("office");
  const [arrangement, setArrangement] = useState<"auto" | "scattered" | "connected">("auto");
  const [ready, setReady] = useState(false);
  const [engine, setEngine] = useState<"pending" | "webgl" | "illustrated">("pending");
  const [reason, setReason] = useState<BlockReason>(null);
  const [forceWebgl, setForceWebgl] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [closedNote, setClosedNote] = useState(false);
  const [urlReady, setUrlReady] = useState(false);

  const scenario = scenarios.find((item) => item.id === state.scenarioId) ?? scenarios[0]!;
  const script = watchScript(scenario.id);
  const currentBeat = script[Math.min(beat, script.length - 1)] ?? script[0]!;
  const steps = visibleSteps(scenario, state);
  const step = steps[Math.min(state.index, steps.length - 1)] ?? steps[0];
  const watchMode = mode === "watch";
  const chapter = watchMode ? currentBeat.chapter : step ? chapterOf(scenario.id, step.id) : 0;
  const connected = watchMode
    ? currentBeat.connected
    : arrangement === "auto"
      ? !openingStep(scenario.id, step?.id ?? "request")
      : arrangement === "connected";
  const decision = watchMode ? currentBeat.decision : state.decision;
  const blocked = watchMode ? currentBeat.blocked : state.missingInfo || state.decision === "rejected";
  const pose: StagePose = {
    chapter,
    connected,
    decision,
    blocked,
    seat,
    scenario: scenario.id as StagePose["scenario"],
  };
  poseRef.current = pose;
  const playing = watchMode ? watchPlaying : state.playing && !reduced;

  function dispatch(action: DemoAction) {
    setClosedNote(false);
    setState((current) => reduceDemo(current, action, scenarios));
  }

  function showWatch() {
    setMode("watch");
    setBeat(0);
    setWatchPlaying(false);
    setClosedNote(false);
    dispatch({ type: "reset" });
  }

  function showInteractive() {
    setWatchPlaying(false);
    setMode("interactive");
    setClosedNote(false);
    const target = currentBeat.stepId;
    setState((current) => {
      let next = reduceDemo(initialState(current.scenarioId), { type: "reset" }, scenarios);
      if (currentBeat.decision === "approved") next = reduceDemo(next, { type: "approve" }, scenarios);
      if (currentBeat.decision === "rejected") next = reduceDemo(next, { type: "reject" }, scenarios);
      if (currentBeat.missingInfo) next = reduceDemo(next, { type: "missing", value: true }, scenarios);
      const visible = visibleSteps(scenarios.find((item) => item.id === next.scenarioId) ?? scenario, next);
      const index = visible.findIndex((item) => item.id === target);
      if (index >= 0) next = reduceDemo(next, { type: "goto", index }, scenarios);
      return next;
    });
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    if (variant === "focus") {
      const params = new URLSearchParams(window.location.search);
      const hasDecision = ["step", "gap", "decision", "sync"].some((key) => params.has(key));
      if (params.get("scenario") || hasDecision) {
        setState(stateFromSearch(params, scenarios));
      }
      if (hasDecision) setMode("interactive");
    }
    setUrlReady(true);
    const onHide = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onHide);
    const node = frameRef.current;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { threshold: 0 });
    if (node) observer.observe(node);
    return () => {
      media.removeEventListener("change", apply);
      document.removeEventListener("visibilitychange", onHide);
      observer.disconnect();
    };
  }, [variant]);

  useEffect(() => {
    if (variant !== "focus" || !urlReady) return;
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", state.scenarioId);
    if (mode === "watch") {
      for (const key of ["step", "gap", "decision", "sync", "view"]) url.searchParams.delete(key);
    } else {
      url.searchParams.set("step", String(state.index));
      url.searchParams.set("view", seat === "customer" ? "customer" : "internal");
      url.searchParams.set("gap", state.missingInfo ? "1" : "0");
      url.searchParams.set("decision", state.decision);
      url.searchParams.set("sync", state.syncProblem ? "1" : "0");
    }
    window.history.replaceState(null, "", url);
  }, [state, seat, urlReady, variant, mode]);

  useEffect(() => {
    if (mode !== "watch" || !watchPlaying || reduced || !onScreen || hidden) return;
    const current = script[beat];
    if (!current) return;
    const timer = window.setTimeout(() => {
      if (beat >= script.length - 1) setWatchPlaying(false);
      else setBeat(beat + 1);
    }, current.durationMs);
    return () => window.clearTimeout(timer);
  }, [mode, watchPlaying, reduced, onScreen, hidden, beat, script]);

  useEffect(() => {
    if (mode !== "interactive" || !state.playing || reduced || !onScreen || hidden) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 2600);
    return () => window.clearInterval(timer);
  }, [mode, state.playing, reduced, onScreen, hidden]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let controller: StageController | null = null;
    const limited = blockReason();
    if (limited && !forceWebgl) {
      setEngine("illustrated");
      setReady(false);
      setReason(limited);
      return;
    }
    const intro = !reduced && sessionStorage.getItem("cpl-cc-intro") !== "1";
    if (intro) sessionStorage.setItem("cpl-cc-intro", "1");
    setEngine("webgl");
    setReason(reduced ? "motion" : null);
    void import("./stage/createStage")
      .then((mod) => mod.mountStage(canvas, {
        intro,
        reduced,
        onReady: () => { if (!cancelled) setReady(true); },
        onLost: () => {
          if (cancelled) return;
          setEngine("illustrated");
          setReady(false);
          setReason("lost");
        },
      }))
      .then((next) => {
        if (cancelled) {
          next.dispose();
          return;
        }
        controller = next;
        stageRef.current = next;
        if (poseRef.current) next.setPose(poseRef.current);
        next.setPaused(document.hidden || !onScreen);
      })
      .catch(() => {
        if (!cancelled) {
          setEngine("illustrated");
          setReason("webgl");
        }
      });
    return () => {
      cancelled = true;
      controller?.dispose();
      if (stageRef.current === controller) stageRef.current = null;
    };
  }, [forceWebgl, reduced]);

  useEffect(() => {
    stageRef.current?.setPose(pose);
  }, [pose.chapter, pose.connected, pose.decision, pose.blocked, pose.seat, pose.scenario, ready]);

  useEffect(() => {
    stageRef.current?.setPaused(hidden || !onScreen || engine !== "webgl");
  }, [hidden, onScreen, engine, ready]);

  if (!step || !currentBeat) return null;
  const caption = watchMode
    ? currentBeat.cue ?? currentBeat.title
    : storyCaption(scenario.id, step.id, state.decision, state.missingInfo);
  const surface = watchMode
    ? {
      jobId: currentBeat.jobId,
      title: currentBeat.title,
      lines: seatLines(currentBeat, seat),
      cue: currentBeat.cue,
    }
    : interactiveSurface(scenario, step, seat, state);
  const illustrated = engine !== "webgl" || !ready;

  function keepSceneVisible() {
    frameRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function play() {
    keepSceneVisible();
    if (watchMode) {
      if (reduced) {
        setWatchPlaying(false);
        setBeat((index) => Math.min(index + 1, script.length - 1));
        return;
      }
      setBeat((index) => (index >= script.length - 1 ? 0 : index));
      setWatchPlaying(true);
      return;
    }
    if (reduced) {
      dispatch({ type: "next" });
      return;
    }
    if (state.index >= steps.length - 1) dispatch({ type: "run", autoplay: true });
    else dispatch({ type: "resume" });
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea, a")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (watchMode) {
        setWatchPlaying(false);
        setBeat((index) => Math.max(index - 1, 0));
      } else dispatch({ type: "prev" });
    } else if (event.key === " " && target === event.currentTarget) {
      event.preventDefault();
      if (playing) pause();
      else play();
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    swipeRef.current = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!swipeRef.current) return;
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    swipeRef.current = null;
    if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) next();
    else if (watchMode) {
      setWatchPlaying(false);
      setBeat((index) => Math.max(index - 1, 0));
    } else dispatch({ type: "prev" });
  }

  function next() {
    setClosedNote(false);
    if (watchMode) {
      setWatchPlaying(false);
      setBeat((index) => Math.min(index + 1, script.length - 1));
      return;
    }
    dispatch({ type: "next" });
  }

  function pause() {
    setWatchPlaying(false);
    dispatch({ type: "pause" });
  }

  function replay() {
    setArrangement("auto");
    setClosedNote(false);
    keepSceneVisible();
    if (watchMode) {
      setBeat(0);
      setWatchPlaying(!reduced);
      return;
    }
    dispatch(reduced ? { type: "reset" } : { type: "run", autoplay: true });
  }

  function goChapter(index: ChapterIndex) {
    if (watchMode) {
      const found = script.findIndex((item) => item.chapter === index);
      if (found < 0) {
        setClosedNote(true);
        return;
      }
      setClosedNote(false);
      setWatchPlaying(false);
      setBeat(found);
      return;
    }
    const found = steps.findIndex((item) => chapterOf(scenario.id, item.id) === index);
    if (found < 0) {
      setClosedNote(true);
      return;
    }
    dispatch({ type: "goto", index: found });
  }

  return (
    <section className={variant === "home" ? "experience" : "experience experience-focus"} id={variant === "home" ? "see-it-work" : undefined} aria-labelledby={`${baseId}-title`}>
      {variant === "home" && (
        <div className="hero-copy">
          <p className="eyebrow">CPL COMMAND CENTER</p>
          <h1 id={`${baseId}-title`}>Less chasing. <span>More work moving.</span></h1>
          <p className="lede">A request becomes one record. A missing detail stays visible. A person approves it, then the visit and the report move with the same job.</p>
          <p className="fine">Early access. Command Center is in development.</p>
          <div className="hero-actions">
            <button type="button" className="button light" onClick={play}>Watch the story</button>
            <a className="button light secondary" href="#contact">Talk to Aaron</a>
          </div>
        </div>
      )}
      <div className="stage-column" ref={stageColumnRef}>
        <div
          className={`stage-frame${engine === "webgl" && ready ? " is-ready" : ""}`}
          data-engine={engine === "illustrated" ? "illustrated" : "webgl"}
          ref={frameRef}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
        >
          <p className="stage-flag">Interactive product preview · Sample data</p>
          <div
            className="desk"
            data-chapter={chapter}
            data-connected={connected ? "yes" : "no"}
            data-decision={decision}
            data-scenario={scenario.id}
            data-seat={seat}
            data-blocked={blocked ? "yes" : "no"}
            aria-hidden="true"
          >
            <div className="desk-mat" />
            <div className="prop tray" />
            <div className="prop rail" />
            <div className="prop card c0" />
            <div className="prop card c1"><i className="chip" /></div>
            <div className="prop card c2" />
            <div className="prop card c3" />
            <div className="prop folder"><i className="stamp" /></div>
            <div className="prop latch" />
            <div className="prop work-piece" />
            <div className="prop sketch" />
            <div className="prop booklet" />
          </div>
          <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
          <article className="record-card" aria-live="polite" data-seat={seat} data-job={surface.jobId}>
            <p className="record-kicker">{surface.jobId} · {seats.find((item) => item.id === seat)?.label}</p>
            <h3>{surface.title}</h3>
            <ul>
              {surface.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
            {surface.cue && <p className="cue">{surface.cue}</p>}
          </article>
        </div>
        <div className="stage-transport" id="story-controls" tabIndex={0} onKeyDown={onKeyDown} aria-label="Story controls">
          <div className="chapter-row" role="group" aria-label="Chapters">
            {CHAPTERS.map((item, index) => (
              <button key={item.id} type="button" aria-pressed={chapter === index} onClick={() => goChapter(index as ChapterIndex)}>
                <span>{item.kicker}</span>
              </button>
            ))}
          </div>
          <div className="transport">
            {playing ? (
              <button type="button" onClick={pause}>Pause</button>
            ) : (
              <button type="button" onClick={play}>Play</button>
            )}
            <button type="button" onClick={next}>Next</button>
            <button type="button" className="secondary" onClick={replay}>Replay</button>
          </div>
        </div>
        <p className="live">
          {CHAPTERS[chapter].kicker}. {watchMode ? `Beat ${Math.min(beat, script.length - 1) + 1} of ${script.length}.` : `Step ${Math.min(state.index, steps.length - 1) + 1} of ${steps.length}.`} {caption}
        </p>
        {reduced && <p className="stage-note">Reduced motion is on, so Play and Replay step one beat at a time and the camera does not glide.</p>}
        {illustrated && reason && reason !== "motion" && (
          <p className="stage-note">
            {reason === "lost" && "The 3D view stopped. This illustrated story is the same job."}
            {reason === "webgl" && "This browser has no 3D view. The illustrated story is the same job."}
            {(reason === "save-data" || reason === "memory" || reason === "cores") && "This device is using the illustrated story."}
            {" "}
            <button type="button" className="text-button" onClick={() => setForceWebgl(true)}>Try the 3D view</button>
          </p>
        )}
        <div className="mode-row" role="radiogroup" aria-label="Story mode">
          <button type="button" role="radio" aria-checked={watchMode} onClick={showWatch}>Watch the story</button>
          <button type="button" role="radio" aria-checked={!watchMode} onClick={showInteractive}>Make a decision</button>
        </div>
        <div className="seat-row" role="radiogroup" aria-label="Who is looking">
          {seats.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={seat === item.id} onClick={() => setSeat(item.id)}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="story-controls">
        {variant === "focus" ? <h2 id={`${baseId}-title`}>Sample job {surface.jobId}</h2> : <h2>The job</h2>}
        <p>Watch the story plays REQUEST, PLAN, WORK, and WRAP UP. A simulated customer reply fills the gap, then a simulated internal approval, then a separate customer acceptance.</p>
        {closedNote && <p className="stage-note" role="status">That chapter stays closed while this sample is blocked.</p>}
        {!watchMode && (
          <div className="decision-row">
            <button type="button" aria-pressed={state.decision === "approved"} onClick={() => dispatch({ type: "approve" })}>Approve</button>
            <button type="button" aria-pressed={state.decision === "rejected"} onClick={() => dispatch({ type: "reject" })}>Needs changes</button>
            <button type="button" aria-pressed={state.missingInfo} onClick={() => dispatch({ type: "missing", value: !state.missingInfo })}>Missing info</button>
          </div>
        )}
        <details>
          <summary>Sample options</summary>
          <div className="toggle-row" role="group" aria-label="Arrangement">
            <button type="button" aria-pressed={!connected} onClick={() => setArrangement("scattered")}>Scattered</button>
            <button type="button" aria-pressed={connected} onClick={() => setArrangement("connected")}>Connected</button>
          </div>
          {scenario.id === "inspection" && !watchMode && (
            <label className="check">
              <input
                type="checkbox"
                checked={state.syncProblem}
                disabled={state.decision !== "approved"}
                onChange={(event) => dispatch({ type: "sync", value: event.target.checked })}
              />
              Handoff cannot sync
            </label>
          )}
          <p>{step.narration}</p>
          <p className="fine">{step.evidenceNote}</p>
          <p><a href={`/contact/?scenario=${scenario.id}`}>Talk about this workflow</a></p>
        </details>
      </div>
      <div className="use-cases" id="use-cases">
        <h2>Show me my business</h2>
        <p>Each business changes the request and the outcome. Harborline, North Pier, and Lumen are invented companies. The sample job id stays with that business.</p>
        <div role="radiogroup" aria-label="Sample business">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === scenario.id}
              onClick={() => {
                setArrangement("auto");
                setBeat(0);
                setWatchPlaying(false);
                dispatch({ type: "select", scenarioId: item.id });
              }}
            >
              {item.title}
            </button>
          ))}
        </div>
        <p className="fine">{blurbs[scenario.id]}</p>
      </div>
      <p className="sr-only">Arrow keys move the story when the controls are focused. Swipe sideways on the scene.</p>
    </section>
  );
}
