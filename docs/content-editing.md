# Content editing

## Pages

- Film hero, playback, chapters, and perspective controls: `src/islands/ProductStage.tsx`. Film framing and responsive controls: `src/styles/film.css`.
- Film interfaces and dialogs: `src/islands/FilmScenes.tsx`. Product surface styling: `src/styles/film-scenes.css`.
- Film chapter labels, captions, durations, sample content, and state transitions: `shared/demo/film.ts`.
- Homepage business-fit examples, configuration explanation, and contact copy: `src/pages/index.astro`. Shared site finish: `src/styles/site-finish.css`.
- Demo page: `src/pages/demo.astro`. It mounts the same film and renders capability notes plus a static transcript built from `filmChapters`, `sample`, and `filmSnapshot`. Keep the transcript prose aligned with scene behavior. `ProductStage` supplies the page's sole `h1`.
- Contact form: `src/components/InquiryForm.astro`. Field rules: `shared/inquiry/validate.ts`.
- Privacy and terms: `src/pages/privacy.astro` and `src/pages/terms.astro`. Both are flagged for owner review. If storage behavior changes, update privacy in the same change.

The homepage and demo no longer use `shared/demo/scenarios.ts`, `chapters.ts`, `watch.ts`, or `engine.ts` for the visible story. Those retained modules are not the place to edit the new film. There is no current industry-template switch: inspection, field service, and recurring care are illustrative fit examples below the homepage film.

## Story continuity and interaction

Keep `HA-1044`, its related proposal/project/report IDs, customer, site, access note, and field observation consistent across the original sources, record, proposal, field view, report, overview, and transcript. The current fictional scenario is Harborline Assessment's roof and envelope assessment for Cedar Wharf Property Co. at 18 Cedar Wharf, Port Merrow.

The six durations in `filmChapters` total 54 seconds. Changes to timing must preserve readable holds and the award, field-attachment, and review thresholds in `filmReducer`/`filmSnapshot`. Update the duration shown by `ProductStage` if the total changes. Keep the Three.js pose derived from this state; do not add a separate timer that can contradict the HTML record.

Manual chapter and perspective changes, opening/closing a source or report, scope edits, simulated award, field attachment, review, and access-detail actions pause guided playback. The optional missing-detail example holds the request until the existing access note is supplied. Preserve this behavior so a timer cannot undo a visitor's inspection. Proposal scope edits should flow through `state.scope`, not mutate the immutable original email. Replay restores the initial sample while retaining the chosen perspective.

Matching `data-flow` attributes identify customer, site, scope, access, observation, and image elements for shared-element motion. Keep those identities on the actual readable content. Prefer short field values and complete observations to placeholder lines. Use the same sample image and observation in the field and report.

## Capability claims

`shared/capability.ts` is the public boundary and the demo page renders it. `on-this-website` describes an implemented website feature; it does not mean the customer application is generally available. Product capabilities remain in development, planned, or subject to discussion according to their source notes.

The current product reference is `CPL-Command-Center-Public` at `26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c`, reviewed on 2026-09-21. Keep source changes and claim changes together with `docs/capability-matrix.md`.

Retain “Interactive product preview · Sample data” and early-access/development status. Keep planned behavior labeled where it is shown, particularly customer acceptance and award-to-project setup. Sample awards, field handoffs, review states, and report readiness are deterministic demonstrations. They do not establish live source extraction, connected customer systems, external delivery, or automatic technical diagnosis. Do not introduce live badges, verified integration logos, invented testimonials, or measured savings without corresponding evidence.

## Logo

`public/brand/cpl-logo.png` is the approved mark. Do not redraw, recolor, distort, or recompress it. `scripts/generate-icons.mjs` derives icon sizes and composes the social card from that mark, brand tokens, and a readable sample-report graphic. The social card is an illustration, not a website screenshot. The source mark stays unchanged.

Use the existing tokens in `shared/brand.ts` for CSS, SVG, and Three.js. Typography uses the bundled IBM Plex Sans Variable and IBM Plex Mono fonts. Preserve the navy/teal/green identity, readable contrast, and light product surfaces within the dark film environment.

## Sample data

Companies, people, sites, notes, and images in the film are synthetic or illustrative. Do not replace them with customer records. The source and field SVG illustrations are under `public/sample/`. Keep descriptive alternative text and visible illustrative-image captions.

## Form and verification

Layout and surrounding copy can be edited in `InquiryForm.astro`, but preserve `name`, `email`, `workflowProblem`, `company`, `scenarioInterest`, `sourcePath`, `submissionId`, the honeypot, Turnstile container, error/status IDs, and the `/api/inquiries` endpoint. Do not replace the real save with a sample success state. Keep `AStarrett@cyberpiratelabs.com` next to the form. Preserve the distinction between inquiry storage and downstream Google/email delivery.

After a change, run the repository tests, type check, lint, production build, and secret scan. `tests/film.test.ts` covers reducer transitions, identity continuity, replay, perspective changes, sample edits, source dialogs, missing-detail recovery, and report data. Browser review is still required for rendered motion, focus, mobile layouts, reduced motion, WebGL fallback/context handling, and form interactions. Record results and limits in `docs/verification.md`; passing source checks alone is not visual or deployment acceptance.
