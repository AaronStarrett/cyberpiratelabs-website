/** One deterministic timeline for the website film. All names and records are fictional. */
export type FilmSeat = "office" | "field" | "customer";
export const filmChapters = [
  { id: "request", label: "The request", title: "Three places. One request.", caption: "An email, a call note, a site photo. Everything the team needs starts somewhere different.", duration: 7000 },
  { id: "record", label: "One record", title: "The details find their place.", caption: "Customer, location, scope, and access stay together—with the original sources attached.", duration: 9000 },
  { id: "proposal", label: "Proposal → job", title: "Carry the context forward.", caption: "Review the scope. Simulate an award. The same details become the team's work package.", duration: 11000 },
  { id: "field", label: "In the field", title: "Out to the team. Back to the office.", caption: "The team gets the job context. Their observation and photo return to the same record.", duration: 10000 },
  { id: "report", label: "The report", title: "The work becomes the record.", caption: "The field observation and photo move into a readable report, ready for a person's review.", duration: 10000 },
  { id: "overview", label: "Under command", title: "One job. Every moving part.", caption: "The office, field team, and customer can follow the same work from their own perspective.", duration: 7000 },
] as const;

export const sample = {
  id: "HA-1044", proposalId: "HA-1044-P1", projectId: "HA-1044-J", reportId: "HA-1044-R1",
  business: "Harborline Assessment", customer: "Cedar Wharf Property Co.", contact: "Alex Morgan",
  site: "18 Cedar Wharf, Port Merrow", scope: "Roof and envelope assessment",
  access: "Use the east gate. Site contact meets the team at 9 am.", date: "18 April · 9–11 am",
  observation: "Flashing is lifted at the north roof edge. Photograph the area and include it for technical review.",
  photo: "/sample/north-roof.svg", photoLabel: "North roof edge · illustrative site image",
  sourcePhoto: "/sample/site-context.svg",
} as const;

export type FilmState = {
  chapter: number; elapsed: number; playing: boolean; seat: FilmSeat;
  missing: boolean; scope: string; modal: "email" | "call" | "photo" | "report" | null;
};
export type FilmAction =
  | { type: "tick"; ms: number }
  | { type: "chapter"; chapter: number }
  | { type: "seat"; seat: FilmSeat }
  | { type: "modal"; modal: FilmState["modal"] }
  | { type: "scope"; value: string }
  | { type: "play" | "pause" | "replay" | "exception" | "resolve" | "award" | "attach" | "review" };

export const initialFilm = (): FilmState => ({ chapter: 0, elapsed: 0, playing: false, seat: "office", missing: false, scope: sample.scope, modal: null });
const limit = (n: number) => Number.isFinite(n) ? Math.max(0, Math.min(5, Math.floor(n))) : 0;

export function filmReducer(state: FilmState, action: FilmAction): FilmState {
  switch (action.type) {
    case "tick": {
      if (!state.scope.trim()) return state.playing ? { ...state, playing: false } : state;
      if (!state.playing || state.missing || state.modal || !Number.isFinite(action.ms) || action.ms <= 0) return state;
      let chapter = state.chapter;
      let elapsed = state.elapsed + action.ms;
      while (elapsed >= filmChapters[chapter]!.duration) {
        elapsed -= filmChapters[chapter]!.duration;
        if (chapter === 5) return { ...state, chapter, elapsed: filmChapters[5].duration, playing: false };
        chapter += 1;
      }
      return { ...state, chapter, elapsed };
    }
    case "chapter": return { ...state, chapter: Math.min(state.missing ? 1 : !state.scope.trim() ? 2 : 5, limit(action.chapter)), elapsed: 0, playing: false, modal: null };
    case "play": return state.missing || !state.scope.trim() ? state.playing ? { ...state, playing: false } : state : { ...state, playing: true, modal: null, ...(state.chapter === 5 && state.elapsed >= filmChapters[5].duration ? { chapter: 0, elapsed: 0 } : {}) };
    case "pause": return { ...state, playing: false };
    case "replay": return { ...initialFilm(), seat: state.seat };
    case "seat": return { ...state, seat: action.seat, playing: false };
    case "modal": return { ...state, modal: action.modal, playing: false };
    case "scope": {
      const scope = action.value.slice(0, 180);
      return { ...state, scope, playing: false, ...(!scope.trim() && state.chapter >= 2 ? { chapter: 2, elapsed: 0 } : {}) };
    }
    case "exception": return { ...state, chapter: 1, elapsed: 0, missing: true, playing: false };
    case "resolve": return { ...state, missing: false, playing: false };
    case "award": return !state.scope.trim() ? state.playing ? { ...state, playing: false } : state : state.chapter === 2 && !state.missing ? { ...state, elapsed: Math.max(5500, state.elapsed), playing: false } : state;
    case "attach": return state.chapter === 3 ? { ...state, elapsed: Math.max(4500, state.elapsed), playing: false } : state;
    case "review": return state.chapter === 4 ? { ...state, elapsed: Math.max(5500, state.elapsed), playing: false } : state;
  }
}

export function filmSnapshot(state: FilmState) {
  const scopeReady = Boolean(state.scope.trim());
  const ready = scopeReady && !state.missing;
  const awarded = ready && (state.chapter > 2 || (state.chapter === 2 && state.elapsed >= 5500));
  const fieldAttached = ready && (state.chapter > 3 || (state.chapter === 3 && state.elapsed >= 4500));
  const reportReady = ready && (state.chapter > 4 || (state.chapter === 4 && state.elapsed >= 5500));
  return {
    id: sample.id, projectId: awarded ? sample.projectId : null, customer: sample.customer, site: sample.site, scope: state.scope,
    access: state.missing ? "Access detail needed" : sample.access,
    awarded, fieldAttached, reportReady,
    kind: awarded ? "Project" : "Request",
    status: state.missing ? "Needs access detail" : !scopeReady ? "Add a scope" : state.chapter < 2 ? "Ready for proposal" : !awarded ? "Proposal ready for review" : !fieldAttached ? "Field work prepared" : state.chapter < 4 ? "Field note attached" : !reportReady ? "Report in review" : "Ready for delivery · sample",
    next: state.missing ? "Add access instructions" : !scopeReady ? "Review proposal scope" : state.chapter < 2 ? "Prepare proposal" : !awarded ? "Review scope and simulate award" : !fieldAttached ? "Document the north roof edge" : !reportReady ? "Review the sample report" : "Discuss your workflow with Aaron",
    observation: fieldAttached ? sample.observation : null,
    report: state.chapter >= 4 && fieldAttached ? { id: sample.reportId, site: sample.site, scope: state.scope, observation: sample.observation, photo: sample.photo, access: sample.access } : null,
  };
}

export function filmPerspective(state: FilmState) {
  const record = filmSnapshot(state);
  if (state.seat === "field") return { title: record.awarded ? "Your work package" : "Before the visit", status: record.awarded ? record.fieldAttached ? "Observation attached" : "Ready for field work" : "Awaiting an awarded job", next: record.awarded ? record.fieldAttached ? "Office review is next" : record.next : "Office is preparing the request", detail: record.awarded ? record.access : "Site and scope stay with the request." };
  if (state.seat === "customer") return { title: "Your request", status: state.chapter < 2 ? "Request received" : !record.awarded ? "Proposal in review" : !record.fieldAttached ? "Visit prepared · simulated" : !record.reportReady ? "Assessment in review" : "Report ready · sample", next: record.reportReady ? "View the sample report" : "Your project contact owns the next update", detail: state.scope };
  return { title: record.kind + " workspace", status: record.status, next: record.next, detail: record.fieldAttached ? sample.observation : record.access };
}
