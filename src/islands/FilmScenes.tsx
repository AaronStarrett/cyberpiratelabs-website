import { useEffect, useId, useRef, type Dispatch, type KeyboardEvent, type ReactNode } from "react";
import { filmChapters, filmPerspective, filmSnapshot, sample, type FilmAction, type FilmState } from "../../shared/demo/film";
import "../styles/film-scenes.css";

type SceneProps = { state: FilmState; dispatch: Dispatch<FilmAction> };
type IconName = "mail" | "call" | "photo" | "record" | "arrow" | "check" | "field" | "report" | "close" | "source";

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    call: <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a15 15 0 0 1-7-7l2-2-2-5Z" />,
    photo: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8" cy="8" r="1.5" /><path d="m3 17 6-6 4 4 3-3 5 5" /></>,
    record: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    field: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4M11 19h2" /></>,
    report: <><path d="M14 3H5v18h14V8l-5-5Z" /><path d="M14 3v5h5M8 12h8M8 16h5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    source: <><path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l4-4a3 3 0 0 1 4 0m4 0 2-2a3 3 0 0 1 4 4l-4 4a3 3 0 0 1-4 0" /></>,
  };
  return <svg className={`film-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function Photo({ context = false, className = "" }: { context?: boolean; className?: string }) {
  return <figure className={`film-photo ${className}`}>
    <img data-flow={context ? "site-image" : "photo"} src={context ? sample.sourcePhoto : sample.photo} alt={context ? "Illustration of the Cedar Wharf site with the east gate marked." : "Illustration of the north roof edge with a lifted section of flashing."} width="640" height="380" />
    <figcaption>{context ? "Site context · illustrative image" : sample.photoLabel}</figcaption>
  </figure>;
}

function Status({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return <span className={`film-status${muted ? " film-status-muted" : ""}`}><span />{children}</span>;
}

function PaperHeading({ label, id }: { label: string; id: string }) {
  return <header className="film-paper-heading"><div className="film-paper-brand"><span className="film-paper-mark" aria-hidden="true">H</span><span>{sample.business}<small>Fictional service provider</small></span></div><div><span className="film-eyebrow">{label}</span><span className="film-paper-id">{id}</span></div></header>;
}

function Email({ expanded = false }: { expanded?: boolean }) {
  return <div className={`source-email${expanded ? " source-email-expanded" : ""}`}>
    <div className="source-email-meta"><span className="source-avatar">AM</span><div><strong>{sample.contact}</strong><span data-flow="customer">{sample.customer}</span></div><span className="source-time">08:42</span></div>
    <div className="source-email-subject"><span>To: {sample.business}</span><h3>Assessment request · Cedar Wharf</h3></div>
    <div className="source-message"><p>Hi Harborline,</p><p>Could you arrange the following work: <strong data-flow="scope">{sample.scope}</strong> at <strong data-flow="site">{sample.site}</strong>?</p><p>I've attached a site image for context. I'll call through the access details.</p><p>Thanks,<br />{sample.contact}</p></div>
    <div className="source-attachment"><Icon name="photo" /><span>site-context.svg <small>Illustrative attachment</small></span></div>
  </div>;
}

function CallNote() {
  return <div className="source-call-body"><div className="source-call-top"><span className="source-avatar source-avatar-call"><Icon name="call" /></span><div><strong>Call with {sample.contact}</strong><span>Access note · 09:05</span></div></div><blockquote data-flow="access">“{sample.access}”</blockquote><span className="source-note-by">Added to the request by the office.</span></div>;
}

function SourceList({ dispatch }: Pick<SceneProps, "dispatch">) {
  const sources = [
    { modal: "email" as const, icon: "mail" as const, title: "Original email", detail: "Customer, site, scope" },
    { modal: "call" as const, icon: "call" as const, title: "Call note", detail: "Access instructions" },
    { modal: "photo" as const, icon: "photo" as const, title: "Site image", detail: "Site context attached" },
  ];
  return <div className="source-list">{sources.map((source) => <button key={source.modal} className="source-list-item" onClick={() => dispatch({ type: "modal", modal: source.modal })}><span className="source-list-icon"><Icon name={source.icon} /></span><span><strong>{source.title}</strong><small>{source.detail}</small></span><Icon name="arrow" /></button>)}</div>;
}

function InputScene({ dispatch }: SceneProps) {
  return <div className="film-scene film-scene-request"><div className="source-grid">
    <article className="workspace-panel source-primary"><div className="workspace-bar"><span><Icon name="mail" />Inbox</span><span className="film-tiny">01 / SOURCE</span></div><Email /><button className="source-view" onClick={() => dispatch({ type: "modal", modal: "email" })}>Inspect original email <Icon name="arrow" /></button></article>
    <div className="source-secondary"><article className="workspace-panel"><div className="workspace-bar"><span><Icon name="call" />Call note</span><span className="film-tiny">02</span></div><CallNote /><button className="source-view" onClick={() => dispatch({ type: "modal", modal: "call" })}>Inspect access note <Icon name="arrow" /></button></article><article className="workspace-panel source-image-panel"><div className="workspace-bar"><span><Icon name="photo" />Site context</span><span className="film-tiny">03</span></div><Photo context /><button className="source-view" onClick={() => dispatch({ type: "modal", modal: "photo" })}>Inspect attached image <Icon name="arrow" /></button></article></div>
  </div></div>;
}

function RecordScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  return <div className="film-scene film-scene-record"><div className="workspace-grid record-workspace">
    <aside className="workspace-sidebar"><span className="film-eyebrow">The original context</span><h3>Sources stay attached.</h3><p>Open a source to see which details it brings into the record.</p><SourceList dispatch={dispatch} /><div className="source-line"><Icon name="source" /><span>3 sources · 1 request</span></div></aside>
    <article className="workspace-panel record-panel"><div className="workspace-bar"><span><Icon name="record" />Request workspace</span><span className="film-tiny">{sample.id}</span></div><div className="record-content"><div className="record-heading"><h3 data-flow="site">{record.site}</h3><Status muted={state.missing}>{state.missing ? "Needs a detail" : "Context connected"}</Status></div><dl className="record-fields"><div><dt>Customer <span>Email</span></dt><dd data-flow="customer">{record.customer}</dd></div><div><dt>Scope <span>Email</span></dt><dd data-flow="scope">{record.scope}</dd></div><div className={state.missing ? "record-field-missing" : ""}><dt>Access <span>Call note</span></dt><dd data-flow="access">{record.access}</dd></div><div><dt>Site context <span>Attachment</span></dt><dd className="record-attachment"><img src={sample.sourcePhoto} width="64" height="40" alt="Illustrative site context thumbnail" /><span>Site image retained with the request</span></dd></div></dl>{state.missing ? <div className="record-missing" role="status"><strong>The handoff waits for access instructions.</strong><p>The office can check the original call note and restore the missing detail.</p><button className="film-action" onClick={() => dispatch({ type: "resolve" })}>Restore detail from call note <Icon name="check" /></button></div> : <div className="record-footer"><span><Icon name="check" />Ready for proposal review</span><button className="film-link" onClick={() => dispatch({ type: "exception" })}>Try a missing detail</button></div>}</div></article>
  </div></div>;
}

function ProposalScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  return <div className="film-scene film-scene-proposal"><div className="workspace-grid proposal-workspace">
    <article className="film-paper proposal-paper"><PaperHeading label="Sample proposal" id={sample.proposalId} /><span className="film-eyebrow">Prepared for</span><h3 data-flow="customer">{record.customer}</h3><p className="proposal-site" data-flow="site">{record.site}</p><div className="film-paper-rule" /><span className="film-eyebrow">Scope of work</span><h4 data-flow="scope">{record.scope || "Scope to be confirmed"}</h4><p>A site visit to document the roof and building envelope, with observations and images prepared for technical review.</p><div className="proposal-access"><span className="film-eyebrow">Access carried forward</span><p data-flow="access">{record.access}</p></div><footer className="film-paper-footer"><span>Original sources remain attached.</span><span>01 / 01</span></footer></article>
    <aside className="proposal-review"><span className="film-eyebrow">Planned workflow · simulated</span><h3>{record.awarded ? "The request becomes a job." : "A person reviews. Then the work moves."}</h3><label className="proposal-scope-label" htmlFor="film-proposal-scope">Review the scope</label><textarea id="film-proposal-scope" className="proposal-scope" value={state.scope} maxLength={180} rows={3} onFocus={() => dispatch({ type: "pause" })} onChange={(event) => dispatch({ type: "scope", value: event.target.value })} /><p className="film-helper">Edit this sample. The scope follows the job into the field and report.</p><div className={`award-flow${record.awarded ? " award-flow-complete" : ""}`}><div><Icon name="report" /><span>Proposal<strong>{sample.proposalId}</strong></span></div><Icon name="arrow" /><div><Icon name="record" /><span>{record.awarded ? "Job prepared" : "On award"}<strong>{record.awarded ? sample.projectId : "Work package"}</strong></span></div></div><button className="film-action" disabled={record.awarded || state.missing || !state.scope.trim()} onClick={() => dispatch({ type: "award" })}>{record.awarded ? "Award simulated" : "Simulate proposal award"}<Icon name={record.awarded ? "check" : "arrow"} /></button>{record.awarded && <p className="award-confirmation" role="status"><Icon name="check" />Customer, scope, site, and access are in the work package.</p>}<span className="film-disclosure">Sample interaction. No proposal is sent and no live job is created.</span></aside>
  </div></div>;
}

function FieldScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  return <div className="film-scene film-scene-field"><div className="workspace-grid field-workspace">
    <article className="phone-shell"><div className="phone-hardware"><span>9:41</span><span className="phone-camera" /><span>•••</span></div><div className="phone-app-bar"><span>HARBORLINE / FIELD</span><Icon name="field" /></div><div className="phone-content"><span className="film-eyebrow">{sample.projectId} · work package</span><h3 data-flow="site">{record.site}</h3><p className="phone-scope" data-flow="scope">{record.scope}</p><div className="phone-access"><strong>Access</strong><p data-flow="access">{record.access}</p></div><div className="phone-note"><div className="phone-note-heading"><strong>Field observation</strong><span>{record.fieldAttached ? "Attached" : "Draft"}</span></div><p data-flow="observation">{sample.observation}</p><Photo /></div><button className="film-action" disabled={record.fieldAttached} onClick={() => dispatch({ type: "attach" })}>{record.fieldAttached ? "Note + image attached" : "Attach note + image"}<Icon name={record.fieldAttached ? "check" : "arrow"} /></button></div><div className="phone-home" /></article>
    <div className="field-office"><span className="film-eyebrow">Back in the office</span><h3>The update lands with the job.</h3><p>The field team sees the same context. Their evidence returns to the same record.</p><article className="workspace-panel"><div className="workspace-bar"><span><Icon name="record" />{sample.projectId}</span><Status muted={!record.fieldAttached}>{record.fieldAttached ? "Updated" : "Awaiting field update"}</Status></div><div className="field-office-body"><span className="film-eyebrow">{record.customer}</span><h4 data-flow="site">{record.site}</h4>{record.fieldAttached ? <div className="field-arrival" role="status"><span className="field-arrival-icon"><Icon name="check" /></span><strong>Observation and image attached</strong><p data-flow="observation">{record.observation}</p><div className="field-image-row"><img data-flow="photo" src={sample.photo} alt="Illustration of the north roof edge" width="110" height="66" /><span>North roof edge<small>Ready for technical review</small></span></div></div> : <div className="field-waiting"><Icon name="source" /><strong>The work package is ready.</strong><p>Attach the sample observation from the field view to see it arrive here.</p></div>}</div></article><span className="film-disclosure">Sample field workflow · product in development.</span></div>
  </div></div>;
}

function ReportPaper({ state, full = false }: Pick<SceneProps, "state"> & { full?: boolean }) {
  const record = filmSnapshot(state);
  return <article className={`film-paper report-paper${full ? " report-paper-full" : ""}`}><PaperHeading label="Sample assessment report" id={sample.reportId} /><h3 data-flow="scope">{record.scope}</h3><p data-flow="site">{record.site}</p><span className="report-prepared">Prepared for <strong data-flow="customer">{record.customer}</strong></span><div className="film-paper-rule" /><section><span className="film-eyebrow">01 / Field observation</span><p className="report-observation" data-flow="observation">{record.observation ?? "Field observation has not been attached."}</p></section>{record.fieldAttached && <Photo />}{full && <><section className="report-full-section"><span className="film-eyebrow">02 / Site access</span><p data-flow="access">{record.access}</p></section><section className="report-full-section"><span className="film-eyebrow">03 / Review note</span><p>This sample presents the field team's recorded observation and illustrative image for a person's technical review. It does not diagnose a defect, determine its cause, or certify the condition of the site.</p></section></>}<footer className="report-review-stamp"><Icon name={record.reportReady ? "check" : "report"} /><span>{record.reportReady ? "Ready for delivery · sample" : "Prepared for human review"}<small>Fictional report · illustrative evidence</small></span></footer></article>;
}

function ReportScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  return <div className="film-scene film-scene-report"><div className="workspace-grid report-workspace"><aside className="report-evidence"><span className="film-eyebrow">From the field record</span><h3>The evidence travels with the work.</h3><div className="report-evidence-note"><span><Icon name="field" />Field note · {sample.projectId}</span><p data-flow="observation">{record.observation}</p></div><Photo /><div className="source-line"><Icon name="source" /><span>Same observation. Same image.</span></div><p className="film-helper">The report gives the team a readable starting point for technical review.</p></aside><div className="report-document"><ReportPaper state={state} /><div className="report-actions"><button className="film-action film-action-secondary" onClick={() => dispatch({ type: "modal", modal: "report" })}>Open full report <Icon name="report" /></button><button className="film-action" disabled={record.reportReady} onClick={() => dispatch({ type: "review" })}>{record.reportReady ? "Sample reviewed" : "Mark sample reviewed"}<Icon name="check" /></button></div></div></div></div>;
}

function OverviewScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  const artifacts: Array<{ title: string; detail: string; icon: IconName; action: FilmAction }> = [
    { title: "The request", detail: "3 original sources", icon: "mail", action: { type: "modal", modal: "email" } },
    { title: "Proposal", detail: sample.proposalId, icon: "report", action: { type: "chapter", chapter: 2 } },
    { title: "Awarded job", detail: sample.projectId, icon: "source", action: { type: "chapter", chapter: 2 } },
    { title: "Field evidence", detail: "Observation + image", icon: "field", action: { type: "chapter", chapter: 3 } },
    { title: "The report", detail: sample.reportId, icon: "report", action: { type: "modal", modal: "report" } },
  ];
  return <div className="film-scene film-scene-overview"><div className="overview-heading"><span className="film-eyebrow">{sample.id} / connected from the start</span><h3 data-flow="site">{record.site}</h3><p><span data-flow="customer">{record.customer}</span> · <span data-flow="scope">{record.scope}</span></p></div><div className="overview-route">{artifacts.map((artifact, index) => <button className="overview-artifact" key={artifact.title} onClick={() => dispatch(artifact.action)}><span className="overview-artifact-icon"><Icon name={artifact.icon} /></span><small>0{index + 1}</small><strong>{artifact.title}</strong><span>{artifact.detail}</span></button>)}</div><div className="overview-perspectives">{(["office", "field", "customer"] as const).map((seat) => { const perspective = filmPerspective({ ...state, seat }); return <button className="overview-seat" key={seat} onClick={() => dispatch({ type: "seat", seat })}><span className="film-eyebrow">{seat} perspective</span><strong>{perspective.status}</strong><span>{perspective.next}</span><Icon name="arrow" /></button>; })}</div><div className="overview-finish"><div><Status>Sample report ready</Status><p>Bring one of your real workflows to the conversation.</p></div><a className="film-action" href="/contact/">Talk through your workflow <Icon name="arrow" /></a></div></div>;
}

function PerspectiveScene({ state, dispatch }: SceneProps) {
  const record = filmSnapshot(state);
  const perspective = filmPerspective(state);
  const isField = state.seat === "field";
  return <div className={`film-scene film-scene-perspective perspective-${state.seat}`}><div className="perspective-intro"><span className="film-eyebrow">Same job · {state.seat} perspective</span><h3>{perspective.title}</h3><p>At “{filmChapters[state.chapter]!.label},” this is the context your {isField ? "field team" : "customer"} can follow.</p></div><article className="workspace-panel perspective-panel"><div className="workspace-bar"><span><Icon name={isField ? "field" : "record"} />{isField ? sample.business : "Customer workspace"}</span><span className="film-tiny">{record.projectId ?? sample.id}</span></div><div className="perspective-body"><Status muted={isField && !record.awarded}>{perspective.status}</Status><h3 data-flow="site">{record.site}</h3><p className="perspective-customer" data-flow="customer">{record.customer}</p><dl className="record-fields"><div><dt>Scope</dt><dd data-flow="scope">{record.scope}</dd></div>{isField && record.awarded && <div><dt>Site access</dt><dd data-flow="access">{record.access}</dd></div>}<div><dt>{isField ? "Team context" : "Current update"}</dt><dd>{perspective.detail}</dd></div></dl>{isField && record.fieldAttached && <div className="perspective-evidence"><p data-flow="observation">{record.observation}</p><Photo /></div>}<div className="perspective-next"><span className="film-eyebrow">Next step</span><strong>{perspective.next}</strong></div>{isField && state.chapter === 3 && !record.fieldAttached && <button className="film-action" onClick={() => dispatch({ type: "attach" })}>Attach sample field evidence <Icon name="arrow" /></button>}{record.reportReady && <button className="film-action" onClick={() => dispatch({ type: "modal", modal: "report" })}>View sample report <Icon name="report" /></button>}</div></article><button className="film-link perspective-back" onClick={() => dispatch({ type: "seat", seat: "office" })}>Return to the office perspective <Icon name="arrow" /></button></div>;
}

export function FilmScene(props: SceneProps) {
  if (props.state.seat !== "office") return <PerspectiveScene {...props} />;
  const scenes = [InputScene, RecordScene, ProposalScene, FieldScene, ReportScene, OverviewScene];
  const Scene = scenes[props.state.chapter] ?? InputScene;
  return <Scene {...props} />;
}

export function FilmModal({ state, dispatch }: SceneProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !state.modal) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLButtonElement>(".film-modal-close")?.focus();
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = oldOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [state.modal]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), [tabindex="0"]');
    if (!nodes?.length) return;
    const first = nodes[0]!;
    const last = nodes[nodes.length - 1]!;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const names = { email: "Original email", call: "Original call note", photo: "Original site image", report: "Sample assessment report" };
  const mappings = state.modal === "email"
    ? [["Customer", sample.customer], ["Site", sample.site], ["Scope", sample.scope]]
    : state.modal === "call" ? [["Access", sample.access]]
    : [["Site context", "Illustrative site image attached to " + sample.id], ["Related site", sample.site]];
  return <dialog ref={dialogRef} className={`film-modal${state.modal === "report" ? " film-modal-report" : ""}`} aria-labelledby={titleId} onKeyDown={trapFocus} onCancel={(event) => { event.preventDefault(); dispatch({ type: "modal", modal: null }); }} onClick={(event) => { if (event.target === event.currentTarget) dispatch({ type: "modal", modal: null }); }}><div className="film-modal-shell"><header className="film-modal-header"><div><span className="film-eyebrow">Fictional example · {sample.id}</span><h2 id={titleId}>{state.modal ? names[state.modal] : "Source detail"}</h2></div><button className="film-modal-close" aria-label="Close detail" onClick={() => dispatch({ type: "modal", modal: null })}><Icon name="close" /></button></header>{state.modal === "report" ? <div className="film-modal-report-body"><ReportPaper state={state} full /></div> : <div className="film-modal-content"><div className="film-modal-source">{state.modal === "email" ? <Email expanded /> : state.modal === "call" ? <CallNote /> : <Photo context />}</div><aside className="source-mapping"><span className="film-eyebrow">Example field mapping</span><h3>What this source contributes</h3><dl>{mappings.map(([field, value]) => <div key={field}><dt><Icon name="arrow" />{field}</dt><dd>{value}</dd></div>)}</dl><p>The original source stays attached so a person can check the context.</p></aside></div>}</div></dialog>;
}
