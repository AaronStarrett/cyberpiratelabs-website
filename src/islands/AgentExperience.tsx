import { useEffect, useId, useReducer, useRef, useState } from "react";
import { agentScenarios, type AgentMode, type ScenarioId } from "../../shared/agents/fixtures";
import { experienceReducer, experienceSnapshot, initialExperience } from "../../shared/agents/experience";
import type { AgentStageController } from "./stage/createAgentStage";
import "../styles/agent-experience.css";

type Props = { initialMode?: AgentMode; compact?: boolean };
const fieldOrder = ["service", "area", "details", "frequency", "timing", "name", "email"];

function Symbol({ kind }: { kind: "phone" | "chat" | "arrow" | "play" | "pause" | "replay" | "check" }) {
  const paths = {
    phone: "M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z",
    chat: "M21 11a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 0 1 0-8 8 8 0 0 1 8-4h2a8 8 0 0 1 8 8Z",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    play: "m8 5 11 7-11 7V5Z",
    pause: "M8 5v14M16 5v14",
    replay: "M4 8a8 8 0 1 1-1 7m1-7V3m0 5h5",
    check: "m5 12 4 4L19 6",
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]} /></svg>;
}

/** Local fixed stories, never connected to the live inquiry form or an agent API. */
export default function AgentExperience({ initialMode = "voice", compact = false }: Props) {
  const [state, dispatch] = useReducer(experienceReducer, initialMode, initialExperience);
  const [reduced, setReduced] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [available, setAvailable] = useState(false);
  const [wide, setWide] = useState(false);
  const [active, setActive] = useState(true);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AgentStageController | null>(null);
  const id = useId();
  const snapshot = experienceSnapshot(state);
  const { scenario, shown, captures, complete, phase } = snapshot;
  const poseRef = useRef({ mode: state.mode, progress: snapshot.progress, complete });
  const motionRef = useRef(motionPaused);
  const nextStep = captures.find((capture) => capture.key === "next");
  const fields = captures.filter((capture) => capture.key !== "next")
    .sort((a, b) => fieldOrder.indexOf(a.key) - fieldOrder.indexOf(b.key));

  useEffect(() => {
    setHydrated(true);
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const widthQuery = window.matchMedia("(min-width: 571px)");
    const updateWidth = () => setWide(widthQuery.matches);
    updateWidth();
    widthQuery.addEventListener("change", updateWidth);
    const update = () => {
      setReduced(query.matches);
      if (query.matches) dispatch({ type: "finish" });
    };
    update();
    query.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      widthQuery.removeEventListener("change", updateWidth);
    };
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      update();
    }, { threshold: 0.08 });
    observer.observe(stage);
    document.addEventListener("visibilitychange", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || reduced || !wide) return;
    let cancelled = false;
    let started = false;
    let controller: AgentStageController | null = null;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry?.isIntersecting || started) return;
      started = true;
      observer.disconnect();
      try {
        const { mountAgentStage } = await import("./stage/createAgentStage");
        if (cancelled) return;
        controller = await mountAgentStage(canvas, {
          onReady: () => { if (!cancelled) setAvailable(true); },
          onLost: () => { if (!cancelled) setAvailable(false); },
        });
        if (cancelled) { controller.dispose(); return; }
        controllerRef.current = controller;
        controller.setPose(poseRef.current);
        controller.setPaused(motionRef.current);
      } catch {
        // The complete HTML composition is the intentional WebGL fallback.
        if (!cancelled) setAvailable(false);
      }
    }, { rootMargin: "120px" });
    observer.observe(stage);
    return () => {
      cancelled = true;
      observer.disconnect();
      controller?.dispose();
      controllerRef.current = null;
      setAvailable(false);
    };
    // The controller owns subsequent pose changes; this effect only mounts the scene.
  }, [reduced, wide]);

  useEffect(() => {
    poseRef.current = { mode: state.mode, progress: snapshot.progress, complete };
    controllerRef.current?.setPose(poseRef.current);
  }, [state.mode, snapshot.progress, complete]);

  useEffect(() => {
    motionRef.current = motionPaused || reduced;
    controllerRef.current?.setPaused(motionRef.current);
  }, [motionPaused, reduced]);

  useEffect(() => {
    if (!state.playing || !active || reduced) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", ms: Math.min(800, now - last) });
      last = now;
    }, 180);
    return () => window.clearInterval(timer);
  }, [state.playing, active, reduced]);

  function chooseMode(mode: AgentMode) {
    dispatch({ type: "mode", mode });
    if (reduced) dispatch({ type: "finish" });
  }

  function chooseScenario(value: string) {
    dispatch({ type: "scenario", scenario: value as ScenarioId });
    if (reduced) dispatch({ type: "finish" });
  }

  function skip() {
    dispatch({ type: "finish" });
    if (window.matchMedia("(max-width: 780px)").matches) {
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ block: "nearest", behavior: "instant" }));
    }
  }

  function play() {
    dispatch({ type: reduced ? "finish" : state.playing ? "pause" : "play" });
  }

  return (
    <div className={"agent-experience" + (compact ? " agent-experience--compact" : "")}
      data-mode={state.mode} data-webgl={available} data-complete={complete} data-motion-paused={motionPaused || reduced}
      aria-label="Illustrative CPL voice and chat agent experience" aria-busy={!hydrated}>
      <div className="agent-experience__toolbar">
        <div className="agent-mode" role="group" aria-label="Choose voice or chat walkthrough">
          <button type="button" disabled={!hydrated} onClick={() => chooseMode("voice")} aria-pressed={state.mode === "voice"}>
            <Symbol kind="phone" /> Voice
          </button>
          <button type="button" disabled={!hydrated} onClick={() => chooseMode("chat")} aria-pressed={state.mode === "chat"}>
            <Symbol kind="chat" /> Chat
          </button>
        </div>
        <div className="agent-scenario">
          <label htmlFor={id + "-scenario"}>Try a sample</label>
          <select disabled={!hydrated} id={id + "-scenario"} value={state.scenario} onChange={(event) => chooseScenario(event.currentTarget.value)}>
            {agentScenarios.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
          </select>
        </div>
        <span className="agent-experience__sample"><i aria-hidden="true" /> Illustrative demo · Fictional business · Sample data</span>
      </div>

      <div className="agent-stage" ref={stageRef}>
        <div className="agent-stage__haze" aria-hidden="true" />
        <canvas ref={canvasRef} className={"agent-stage__canvas" + (available ? " is-ready" : "")} aria-hidden="true" />
        <div className="agent-stage__floor" aria-hidden="true" />
        <div className="agent-stage__chapter" aria-hidden="true">
          <span>01 / CONVERSATION</span><span>02 / CLARITY</span><span>03 / NEXT STEP</span>
        </div>

        <div className="agent-phone" aria-hidden="true">
          <div className="agent-phone__speaker" />
          <div className="agent-phone__screen">
            <span className="agent-phone__time">{state.mode === "voice" ? scenario.setting.match(/[0-9]+:[0-9]+/)?.[0] ?? "CPL" : "CPL"}</span>
            <div className="agent-phone__avatar">{scenario.initials}</div>
            <span className="agent-phone__business">{scenario.business}</span>
            <span className="agent-phone__call">{complete ? "Sample complete" : state.mode === "voice" ? "Incoming inquiry" : "Website visitor"}</span>
            <div className="agent-phone__signal"><Symbol kind={state.mode === "voice" ? "phone" : "chat"} /></div>
            <span className="agent-phone__note">{state.mode === "voice" ? "Transcript walkthrough" : "Scripted conversation"}</span>
            <span className="agent-phone__audio">No audio · No live connection</span>
          </div>
        </div>

        <div className="agent-conversation">
          <div className="agent-conversation__heading">
            <span className="agent-conversation__mark"><Symbol kind={state.mode === "voice" ? "phone" : "chat"} /></span>
            <div><strong>{scenario.business}</strong><span>Fictional {state.mode === "voice" ? "call" : "website chat"}</span></div>
            <span className="agent-conversation__count">{String(snapshot.index + 1).padStart(2, "0")} / {String(snapshot.messages.length).padStart(2, "0")}</span>
          </div>
          <p className="agent-conversation__setting">{scenario.setting}</p>
          <div className="agent-conversation__messages" aria-label="Current sample conversation" aria-live="off">
            {shown.slice(-3).map((item, index) => (
              <div key={state.mode + state.scenario + (snapshot.index - Math.min(2, snapshot.index) + index)}
                className={"agent-message agent-message--" + item.speaker}>
                <span>{item.speaker === "agent" ? "AI assistant" : state.mode === "voice" ? "Sample caller" : "Sample visitor"}</span>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="agent-conversation__footer">
            <i aria-hidden="true" />
            <span>{complete ? "Sample follow-up prepared" : state.playing ? "Walking through the example" : "Ready when you are"}</span>
          </div>
        </div>

        <div className="agent-result" ref={resultRef} aria-label="Organized sample inquiry">
          <div className="agent-result__top"><span>CONVERSATION → ACTION</span><Symbol kind={complete ? "check" : "arrow"} /></div>
          <h3>{scenario.kind === "handoff" ? "A person takes it from here." : "Useful details. One clear next step."}</h3>
          <span className="agent-result__badge">{complete ? "Sample result" : fields.length ? "Sample inquiry forming" : "Waiting for sample details"}</span>
          {fields.length ? (
            <dl>{fields.map((capture) => <div key={capture.key} data-field={capture.key}><dt>{capture.label}</dt><dd>{capture.value}</dd></div>)}</dl>
          ) : (
            <div className="agent-result__empty">
              <div /><div /><div />
              <p>Watch details move from the conversation into an organized request.</p>
            </div>
          )}
          {nextStep && <div className="agent-result__next"><Symbol kind="arrow" /><p>{nextStep.value}</p></div>}
          <p className="agent-result__disclosure">Local sample only. Nothing is sent to a business.</p>
        </div>
      </div>

      <div className="agent-playback">
        <div className="agent-playback__buttons">
          <button className="agent-playback__primary" type="button" disabled={!hydrated} onClick={play}>
            <Symbol kind={state.playing ? "pause" : "play"} />
            {!hydrated ? "Loading walkthrough" : reduced ? "Show example" : state.playing ? "Pause" : complete ? "Play again" : "Play walkthrough"}
          </button>
          <button type="button" disabled={!hydrated} onClick={() => dispatch({ type: reduced ? "finish" : "replay" })} aria-label="Replay sample from the beginning"><Symbol kind="replay" /><span>Replay</span></button>
          <button type="button" disabled={!hydrated} onClick={skip}>Skip to result <Symbol kind="arrow" /></button>
        </div>
        <div className="agent-playback__progress">
          <progress className="agent-playback__track" aria-label="Sample walkthrough progress" max={100} value={Math.round(snapshot.progress * 100)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(snapshot.progress * 100)} />
          <span role="status" aria-live="polite">{phase}</span>
        </div>
        <button className="agent-playback__motion" type="button" disabled={reduced || !hydrated} aria-pressed={motionPaused || reduced}
          onClick={() => setMotionPaused((value) => !value)}>
          {reduced ? "Reduced motion on" : motionPaused ? "Enable motion" : "Pause motion"}
        </button>
      </div>

      <details className="agent-transcript">
        <summary>Read the complete sample transcript <span aria-hidden="true">+</span></summary>
        <div className="agent-transcript__intro">
          <p>This fixed example illustrates a configured workflow. It uses no audio, microphone, live AI, or real customer data.</p>
          <p><strong>Sample business information:</strong> {scenario.approvedInformation}</p>
        </div>
        <ol>{snapshot.messages.map((item, index) => <li key={state.mode + state.scenario + index}>
          <strong>{item.speaker === "agent" ? "AI assistant" : state.mode === "voice" ? "Sample caller" : "Sample visitor"}</strong>
          <p>{item.text}</p>
        </li>)}</ol>
      </details>
      <noscript><p className="agent-noscript">This illustrative transcript is available above. Enable JavaScript to switch scenarios and use playback controls.</p></noscript>
    </div>
  );
}