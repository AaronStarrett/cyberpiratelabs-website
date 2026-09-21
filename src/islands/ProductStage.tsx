import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { CHAPTERS, chapterOf, openingStep, storyCaption, type ChapterIndex } from "../../shared/demo/chapters";
import { initialState, reduceDemo, stateFromSearch, visibleSteps } from "../../shared/demo/engine";
import { scenarios } from "../../shared/demo/scenarios";
import type { DemoAction, DemoState } from "../../shared/demo/types";
import type { Seat, StageController, StagePose } from "./stage/createStage";

const seats: Array<{ id: Seat; label: string; line: string }> = [
  { id: "office", label: "Office", line: "Office view of the same job. The gap and the next action stay visible." },
  { id: "field", label: "Field", line: "Field view of the same job, with a synthetic sketch." },
  { id: "customer", label: "Customer", line: "Customer view of the same job. The note is unsent." },
];

const blurbs: Record<string, string> = {
  inspection: "A roof assessment. Access notes stay missing.",
  "field-service": "A no-heat call, a visit, and an unsent status.",
  recurring: "A routine visit, an exception, and a held update.",
};

type BlockReason = "motion" | "save-data" | "memory" | "cores" | "webgl" | "lost" | null;

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
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<StageController | null>(null);
  const poseRef = useRef<StagePose | null>(null);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);
  const [state, setState] = useState<DemoState>(() => initialState("inspection"));
  const [seat, setSeat] = useState<Seat>("office");
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
  const steps = visibleSteps(scenario, state);
  const step = steps[Math.min(state.index, steps.length - 1)] ?? steps[0];
  const chapter = step ? chapterOf(scenario.id, step.id) : 0;
  const connected = arrangement === "auto" ? !openingStep(scenario.id, step?.id ?? "request") : arrangement === "connected";
  const blocked = state.missingInfo || state.decision === "rejected";
  const pose: StagePose = {
    chapter,
    connected,
    decision: state.decision,
    blocked,
    seat,
    scenario: scenario.id as StagePose["scenario"],
  };
  poseRef.current = pose;

  function dispatch(action: DemoAction) {
    setClosedNote(false);
    setState((current) => {
      let next = reduceDemo(current, action, scenarios);
      if (next.decision === "rejected" && next.scenarioId === "field-service") {
        const currentScenario = scenarios.find((item) => item.id === next.scenarioId) ?? scenario;
        const visible = visibleSteps(currentScenario, next);
        let limit = 0;
        visible.forEach((item, index) => {
          if (chapterOf(currentScenario.id, item.id) <= 1) limit = index;
        });
        if (next.index > limit) next = { ...next, index: limit, playing: false };
      }
      return next;
    });
  }

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    if (variant === "focus") {
      setState(stateFromSearch(new URLSearchParams(window.location.search), scenarios));
    }
    setUrlReady(true);
    const onHide = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onHide);
    const node = frameRef.current;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
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
    url.searchParams.set("step", String(state.index));
    url.searchParams.set("view", seat === "customer" ? "customer" : "internal");
    url.searchParams.set("gap", state.missingInfo ? "1" : "0");
    url.searchParams.set("decision", state.decision);
    url.searchParams.set("sync", state.syncProblem ? "1" : "0");
    window.history.replaceState(null, "", url);
  }, [state, seat, urlReady, variant]);

  useEffect(() => {
    if (!state.playing || reduced || !onScreen || hidden) return;
    const timer = window.setInterval(() => dispatch({ type: "tick" }), 2600);
    return () => window.clearInterval(timer);
  }, [state.playing, reduced, onScreen, hidden]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let controller: StageController | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const limited = blockReason();
    if (reducedMotion || (limited && !forceWebgl)) {
      setEngine("illustrated");
      setReady(false);
      setReason(reducedMotion ? "motion" : limited);
      return;
    }
    const intro = sessionStorage.getItem("cpl-cc-intro") !== "1";
    if (intro) sessionStorage.setItem("cpl-cc-intro", "1");
    setEngine("webgl");
    void import("./stage/createStage")
      .then((mod) => mod.mountStage(canvas, {
        intro,
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
  }, [forceWebgl]);

  useEffect(() => {
    stageRef.current?.setPose(pose);
  }, [pose.chapter, pose.connected, pose.decision, pose.blocked, pose.seat, pose.scenario, ready]);

  useEffect(() => {
    stageRef.current?.setPaused(hidden || !onScreen || engine !== "webgl");
  }, [hidden, onScreen, engine, ready]);

  if (!step) return null;
  const caption = storyCaption(scenario.id, step.id, state.decision, state.missingInfo);
  const seatCopy = seats.find((item) => item.id === seat) ?? seats[0]!;
  const illustrated = engine !== "webgl" || !ready;

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea, a")) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      dispatch({ type: "next" });
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      dispatch({ type: "prev" });
    } else if (event.key === " " && target === event.currentTarget) {
      event.preventDefault();
      dispatch(state.playing ? { type: "pause" } : { type: "resume" });
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
    dispatch(dx < 0 ? { type: "next" } : { type: "prev" });
  }

  function goChapter(index: ChapterIndex) {
    const found = steps.findIndex((item) => chapterOf(scenario.id, item.id) === index);
    if (found < 0) {
      setClosedNote(true);
      return;
    }
    dispatch({ type: "goto", index: found });
  }

  function seeIt() {
    document.getElementById("story-controls")?.focus();
    if (reduced) {
      dispatch({ type: "next" });
      return;
    }
    if (state.index >= steps.length - 1) {
      setArrangement("auto");
      dispatch({ type: "run", autoplay: true });
      return;
    }
    dispatch({ type: "resume" });
  }

  return (
    <section className={variant === "home" ? "experience" : "experience experience-focus"} id={variant === "home" ? "see-it-work" : undefined} aria-labelledby={`${baseId}-title`}>
      {variant === "home" && (
        <div className="hero-copy">
          <p className="eyebrow">CPL COMMAND CENTER</p>
          <h1 id={`${baseId}-title`}>Your service business. <span>Finally connected.</span></h1>
          <p className="lede">Requests, plans, visits, and the outcome share one job. Scattered notes gather on the desk, then a review, a visit, and a report.</p>
          <p className="fine">You can play it, step it, or switch the kind of work. Approving a sample does not mean a customer said yes. Field sketches are drawn for this preview. They are not photographs, and nothing is emailed.</p>
          <p className="badge">Early access · In development</p>
          <div className="hero-actions">
            <button type="button" className="button light" onClick={seeIt}>See it in motion</button>
            <a className="button light secondary" href="#contact">Talk to Aaron</a>
          </div>
        </div>
      )}
      <div className="stage-column">
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
            data-decision={state.decision}
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
        </div>
        <p className="live" aria-live="polite">
          {CHAPTERS[chapter].kicker}. Step {Math.min(state.index, steps.length - 1) + 1} of {steps.length}. {caption}
        </p>
        {illustrated && reason && (
          <p className="stage-note">
            {reason === "motion" && "Reduced motion is on, so this is the illustrated story."}
            {reason === "lost" && "The 3D view stopped. This illustrated story is the same job."}
            {reason === "webgl" && "This browser has no 3D view. The illustrated story is the same job."}
            {(reason === "save-data" || reason === "memory" || reason === "cores") && "This device is using the illustrated story."}
            {reason !== "motion" && reason !== "webgl" && reason !== "lost" && (
              <> <button type="button" className="text-button" onClick={() => setForceWebgl(true)}>Try the 3D view</button></>
            )}
          </p>
        )}
      </div>
      <div className="story-controls" id="story-controls" tabIndex={0} onKeyDown={onKeyDown} aria-label="Story controls">
        {variant === "focus" && <h2 id={`${baseId}-title`}>Sample job</h2>}
        {variant === "home" && <h2>The job</h2>}
        <p>Four chapters. Missing facts stay missing. Nothing here is sent. A blocked review keeps the visit closed.</p>
        <div className="chapter-row" role="group" aria-label="Chapters">
          {CHAPTERS.map((item, index) => (
            <button key={item.id} type="button" aria-pressed={chapter === index} onClick={() => goChapter(index as ChapterIndex)}>
              <span>{item.kicker}</span>
            </button>
          ))}
        </div>
        {closedNote && <p className="stage-note" role="status">That chapter stays closed while this sample is blocked.</p>}
        <div className="transport">
          {state.playing && !reduced ? (
            <button type="button" onClick={() => dispatch({ type: "pause" })}>Pause</button>
          ) : (
            <button type="button" onClick={seeIt}>Play</button>
          )}
          <button type="button" onClick={() => dispatch({ type: "prev" })}>Back</button>
          <button type="button" onClick={() => dispatch({ type: "next" })}>Next</button>
          <button type="button" className="secondary" onClick={() => { setArrangement("auto"); dispatch({ type: "reset" }); }}>Replay</button>
        </div>
        <label className="progress-label" htmlFor={`${baseId}-progress`}>
          Progress
          <input
            id={`${baseId}-progress`}
            type="range"
            min={0}
            max={Math.max(steps.length - 1, 0)}
            value={Math.min(state.index, steps.length - 1)}
            onChange={(event) => dispatch({ type: "goto", index: Number(event.target.value) })}
          />
        </label>
        <div className="decision-row">
          <button type="button" aria-pressed={state.decision === "approved"} onClick={() => dispatch({ type: "approve" })}>Approve sample</button>
          <button type="button" aria-pressed={state.decision === "rejected"} onClick={() => dispatch({ type: "reject" })}>Needs changes</button>
        </div>
        <p className="fine">Internal review does not mean a customer accepted.</p>
        <div className="toggle-row" role="group" aria-label="Arrangement">
          <button type="button" aria-pressed={!connected} onClick={() => setArrangement("scattered")}>Scattered</button>
          <button type="button" aria-pressed={connected} onClick={() => setArrangement("connected")}>Connected</button>
        </div>
        <label className="check">
          <input type="checkbox" checked={state.missingInfo} onChange={(event) => dispatch({ type: "missing", value: event.target.checked })} />
          Hold for missing information
        </label>
        {scenario.id === "inspection" && (
          <label className="check">
            <input type="checkbox" checked={state.syncProblem} onChange={(event) => dispatch({ type: "sync", value: event.target.checked })} />
            Handoff cannot sync
          </label>
        )}
        <div className="seat-row" role="radiogroup" aria-label="Illustrative view">
          {seats.map((item) => (
            <button key={item.id} type="button" role="radio" aria-checked={seat === item.id} onClick={() => setSeat(item.id)}>{item.label}</button>
          ))}
        </div>
        <p className="fine">Illustrative view. Not a screenshot of the shipping app. {seatCopy.line}</p>
        <details>
          <summary>About this step</summary>
          <p>{step.narration}</p>
          <p className="fine">{step.evidenceNote}</p>
          <dl className="record-list">
            {step.record.fields.map((field) => (
              <div key={field.label}><dt>{field.label}</dt><dd>{field.value}</dd></div>
            ))}
          </dl>
          {step.output && (
            <div>
              <p><strong>{step.output.title}</strong></p>
              {step.output.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          )}
          <p><a href={`/contact/?scenario=${scenario.id}&interest=demonstration`}>Talk about this workflow</a></p>
        </details>
      </div>
      <div className="use-cases" id="use-cases">
        <h2>Show me my business</h2>
        <p>The same preview changes the request, the objects, and the outcome. Harborline, North Pier, and Lumen are invented companies.</p>
        <div role="radiogroup" aria-label="Sample business">
          {scenarios.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={item.id === scenario.id}
              onClick={() => { setArrangement("auto"); dispatch({ type: "select", scenarioId: item.id }); }}
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
