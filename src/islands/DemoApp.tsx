import { Fragment, useEffect, useId, useState, type KeyboardEvent } from "react";
import { initialState, reduceDemo, stateFromSearch, visibleSteps } from "../../shared/demo/engine";
import { scenarios } from "../../shared/demo/scenarios";
import type { DemoState, ViewId } from "../../shared/demo/types";

const views: Array<{ id: ViewId; label: string }> = [
  { id: "internal", label: "Internal operating view" },
  { id: "review", label: "Review queue" },
  { id: "customer", label: "Customer status" },
];

function evidenceLabel(value: string): string {
  if (value === "development-source") return "Development source";
  if (value === "planned") return "Planned";
  return "Illustrative";
}

export default function DemoApp() {
  const baseId = useId();
  const [state, setState] = useState<DemoState>(() => initialState(scenarios[0]?.id ?? "inspection"));
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    setState(stateFromSearch(new URLSearchParams(window.location.search), scenarios));
    setReady(true);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const url = new URL(window.location.href);
    url.searchParams.set("scenario", state.scenarioId);
    url.searchParams.set("step", String(state.index));
    url.searchParams.set("view", state.view);
    url.searchParams.set("gap", state.missingInfo ? "1" : "0");
    url.searchParams.set("decision", state.decision);
    url.searchParams.set("sync", state.syncProblem ? "1" : "0");
    window.history.replaceState(null, "", url);
  }, [state, ready]);

  useEffect(() => {
    if (!state.playing || reduced) return;
    const timer = window.setInterval(() => {
      setState((current) => reduceDemo(current, { type: "tick" }, scenarios));
    }, 3200);
    return () => window.clearInterval(timer);
  }, [state.playing, reduced]);

  const scenario = scenarios.find((item) => item.id === state.scenarioId) ?? scenarios[0]!;
  const steps = visibleSteps(scenario, state);
  const step = steps[state.index] ?? steps[0];
  if (!step) return null;
  const view = step.views[state.view];

  function dispatch(action: Parameters<typeof reduceDemo>[1]) {
    setState((current) => reduceDemo(current, action, scenarios));
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("input, select, textarea")) return;
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

  return (
    <section className="demo-shell" aria-labelledby={`${baseId}-title`} tabIndex={0} onKeyDown={onKeyDown}>
      <div className="banner">
        <strong>Interactive walkthrough · Sample data.</strong> Deterministic sample rules. Not the Command Center application, not live AI, and not written into the contact form.
      </div>
      <h2 id={`${baseId}-title`}>{scenario.company}</h2>
      <p>{scenario.evidenceNote}</p>
      <div className="demo-top" role="radiogroup" aria-label="Sample scenario">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === scenario.id}
            className={item.id === scenario.id ? "" : "secondary"}
            onClick={() => dispatch({ type: "select", scenarioId: item.id })}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="demo-controls">
        <button type="button" onClick={() => dispatch({ type: "run", autoplay: !reduced })}>Run from start</button>
        <button type="button" onClick={() => dispatch({ type: "prev" })}>Previous step</button>
        <button type="button" onClick={() => dispatch({ type: "next" })}>Next step</button>
        {state.playing ? (
          <button type="button" onClick={() => dispatch({ type: "pause" })}>Pause</button>
        ) : (
          <button type="button" onClick={() => dispatch({ type: "resume" })}>Resume</button>
        )}
        <button type="button" className="secondary" onClick={() => dispatch({ type: "reset" })}>Replay / reset</button>
      </div>
      <p aria-live="polite">Step {state.index + 1} of {steps.length}. {step.title}. {step.narration}</p>
      <div className="condition-row">
        <label className="check"><input type="checkbox" checked={state.missingInfo} onChange={(event) => dispatch({ type: "missing", value: event.target.checked })} /> Missing information</label>
        {scenario.id === "inspection" && (
          <label className="check"><input type="checkbox" checked={state.syncProblem} onChange={(event) => dispatch({ type: "sync", value: event.target.checked })} /> Handoff sync problem</label>
        )}
      </div>
      <div className="demo-layout">
        <div className="mobile-stepper">
          <label htmlFor={`${baseId}-step`}>Step</label>
          <select id={`${baseId}-step`} value={state.index} onChange={(event) => dispatch({ type: "goto", index: Number(event.target.value) })}>
            {steps.map((item, index) => <option key={item.id} value={index}>{index + 1}. {item.title}</option>)}
          </select>
        </div>
        <div className="step-list" aria-label="Steps">
          {steps.map((item, index) => (
            <button key={item.id} type="button" aria-current={index === state.index ? "step" : undefined} onClick={() => dispatch({ type: "goto", index })}>
              {index + 1}. {item.title}
            </button>
          ))}
        </div>
        <article className="demo-detail">
          <p className="kicker">{step.phase} · {evidenceLabel(step.evidence)}</p>
          <h3>{step.title}</h3>
          <p>{step.narration}</p>
          <p className="evidence">{step.evidenceNote}</p>
          <dl className="facts">
            <dt>Input</dt><dd>{step.input}</dd>
            <dt>Organized</dt><dd>{step.organized}</dd>
            <dt>A person</dt><dd>{step.human}</dd>
            <dt>Outcome</dt><dd>{step.outcome}</dd>
          </dl>
          <div className="view-switch" role="tablist" aria-label="Views">
            {views.map((item) => (
              <button key={item.id} type="button" role="tab" aria-selected={state.view === item.id} onClick={() => dispatch({ type: "view", view: item.id })}>
                {item.label}
              </button>
            ))}
          </div>
          <div role="tabpanel">
            <h3>{view.title}</h3>
            {view.lines.map((line) => <p key={line}>{line}</p>)}
          </div>
          {step.sketch && (
            <svg className="sketch" viewBox="0 0 280 160" role="img" aria-label="Synthetic site sketch, not a photograph">
              <rect x="20" y="70" width="160" height="70" fill="#f4f7f6" stroke="#071c27" strokeWidth="2" />
              <polygon points="20,70 100,28 180,70" fill="#ffffff" stroke="#071c27" strokeWidth="2" />
              <rect x="190" y="40" width="70" height="100" fill="#e7f3f1" stroke="#0e4c49" strokeWidth="2" />
              <text x="28" y="112" fill="#122830" fontSize="14">Sample roof</text>
              <text x="198" y="96" fill="#122830" fontSize="12">Sample note</text>
            </svg>
          )}
          <p>Synthetic sketch when shown. Not a photograph and not model output.</p>
          <div className="demo-controls">
            <button type="button" aria-expanded={state.recordOpen} onClick={() => dispatch({ type: "record", open: !state.recordOpen })}>Open sample record</button>
            {step.output && <button type="button" aria-expanded={state.outputOpen} onClick={() => dispatch({ type: "output", open: !state.outputOpen })}>Inspect sample output</button>}
            {step.decisionPoint && <button type="button" onClick={() => dispatch({ type: "approve" })}>Approve sample proposal</button>}
            {step.decisionPoint && <button type="button" className="secondary" onClick={() => dispatch({ type: "reject" })}>Reject sample proposal</button>}
            <a className="button secondary" href={`/contact/?interest=demonstration&scenario=${scenario.id}`}>Discuss this workflow</a>
          </div>
          {state.recordOpen && (
            <div className="record">
              <h3>{step.record.title}</h3>
              <dl className="facts">
                {step.record.fields.map((field) => (
                  <Fragment key={field.label}>
                    <dt>{field.label}</dt><dd>{field.value}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          )}
          {state.outputOpen && step.output && (
            <div className="output">
              <h3>{step.output.title}</h3>
              {step.output.lines.map((line) => <p key={line}>{line}</p>)}
            </div>
          )}
        </article>
      </div>
      {reduced && <p>Reduced motion is on. Run from start resets the sample and does not autoplay. Use Next step.</p>}
    </section>
  );
}
