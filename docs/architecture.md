# Architecture

The site is a static Astro build plus a small Cloudflare Worker.

## Public experience

Pages are prerendered HTML and CSS, with a React island for the product film. The homepage and `/demo/` mount the same `ProductStage`; the demo page adds capability notes and a static transcript. Each page has one primary heading from the film. Homepage business-fit and configuration sections are ordinary Astro content, followed by the inquiry form.

| File | Responsibility |
| --- | --- |
| `shared/demo/film.ts` | Sample identity, six chapter definitions and durations, `filmReducer`, `filmSnapshot`, and `filmPerspective`. |
| `src/islands/ProductStage.tsx` | Hero, chapter and playback controls, visibility/motion preferences, HTML shared-element transitions, and optional scene loading. |
| `src/islands/FilmScenes.tsx` | Source inputs, organized record, proposal review, field/office handoff, report, overview, alternate perspectives, and modal content. |
| `src/styles/film.css` | Film framing, hero, navigation, transport, and responsive layout. |
| `src/styles/film-scenes.css` | Product interfaces, documents, mobile field view, source mapping, and dialogs. |
| `src/islands/stage/createStage.ts` | Three.js environment, derived camera/lighting poses, on-demand rendering, context handling, and cleanup. |
| `src/styles/site-finish.css` | Header/footer, business-fit and configuration sections, contact form presentation, and supporting pages. |

The film follows fictional request `HA-1044` through six connected chapters: request, organized record, proposal/award, field work, report, and overview. Their durations total 54 seconds. The user starts guided playback; the opening does not autoplay.

One reducer owns `chapter`, `elapsed`, `playing`, `seat`, `missing`, `scope`, and `modal`. `filmSnapshot` derives lifecycle status and linked artifacts from that state. A request remains a request until the simulated award point. Field evidence becomes report content only after the field-attachment point. `filmPerspective` derives each audience's status and next action from the same record. Chapter navigation selects a point in this deterministic narrative; it is not a live application's persistent event history.

Inputs and interactions have bounded effects:

- Source dialogs show the fictional email, call note, or image beside the fields that source contributes.
- Editing the proposal scope updates the same sample scope in later chapters and perspectives.
- Award, field-attachment, and review buttons advance the corresponding sample transition. Guided playback reaches those same transition points.
- Chapter changes, perspective changes, source/report dialogs, scope editing, and lifecycle actions pause guided playback. Closing a dialog does not restart it.
- The optional access-detail exception returns to the organized record and holds later chapters until the call-note detail is restored. The visitor can then resume.
- Replay resets the sample and leaves it paused, retaining the selected perspective. Watch the workflow starts again from the opening and plays when reduced motion is not requested.

All story state is in browser memory. It does not call product APIs, use model keys, upload files, save customer jobs, or send reports. The three business-fit examples below the film do not change its scenario. The older `shared/demo/{engine,scenarios,watch,chapters}` modules are retained legacy modules; the rendered homepage/demo film does not import them.

## Rendering and accessibility

Essential business text, images, controls, and dialogs are HTML. The prerendered opening is meaningful before hydration or WebGL loading; without JavaScript, the static transcript on `/demo/` provides the complete written story. After hydration, the same HTML interactions work when WebGL cannot initialize.

Three.js is loaded progressively for the environment. Its pose is derived from the reducer state, rather than a second narrative timeline. Shared `data-flow` identities support HTML source-to-field movement through the Web Animations API. The renderer caps device pixel ratio at 1.5, renders on pose/viewport changes instead of an idle loop, stops while hidden or offscreen, and disposes listeners, observers, geometry, materials, and the renderer on teardown. Context loss leaves the HTML story available; context restoration requests another render.

Reduced motion uses still chapter states and manual Next navigation. The film avoids mounting WebGL for reduced motion, data-saving preference, or a reported device memory of 2 GB or less. The narrative clock also stops while the stage is offscreen or the document is hidden. Native dialogs include focus containment, Escape/close behavior, and focus restoration. These are implementation descriptions; actual browser and performance results belong in `docs/verification.md`.

Brand values come from `shared/brand.ts` for CSS and Three.js. The approved `public/brand/cpl-logo.png` remains the source for icons and the generated social card. Supporting illustrations under `public/sample/` are labeled sample evidence.

## Inquiry backend

- `worker/index.ts` handles `POST /api/inquiries`, operator routes under `/api/operator`, and a 15-minute scheduled retry.
- Cloudflare serves `dist/` as static assets. Only `/api/*` runs the Worker first. Unknown pages use `404.html` with a 404 status.
- Inquiry rows live in D1. Preview and production are different Worker names and different databases.
- Google Sheets, Drive, and owner email are a later delivery step. The browser never receives Google tokens, the HMAC secret, or the script URL.
- The HMAC envelope is `{ timestamp, submissionId, signature, payload }`. `signature` is hex HMAC-SHA256 over `timestamp.submissionId.sha256(payload)` using `GOOGLE_HMAC_SECRET`.
- “Saved” means the D1 insert succeeded. Google sync and notification have their own statuses: `pending`, `pending_unconfigured`, `synced` or `sent`, and `failed`.
- Turnstile is required whenever a secret is configured, and submissions are rejected when it is not configured. There is no bypass flag.
- Operator routes require `Authorization: Bearer` matching `OPERATOR_TOKEN` (at least 24 characters). There is no public inquiry list.

Scheduled retries select rows that are still pending or whose backoff time has arrived, up to 8 attempts. Backoff is 1 minute, 5 minutes, 15 minutes, 1 hour, 6 hours, then 24 hours.

The presentation update retains the inquiry form's field names, validation contract, submission identity, duplicate prevention, and retry behavior. A successful D1 save and a successful Google/email delivery remain separate outcomes. The marketing film never invokes this backend; only a visitor's form submission does.
