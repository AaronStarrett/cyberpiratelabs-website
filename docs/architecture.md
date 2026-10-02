# Architecture

The marketing site keeps the existing static Astro build, React islands, npm lockfile, and Cloudflare Worker/D1 inquiry backend.

## Public rendering

`src/pages/` defines the homepage, voice and chat service pages, request page, existing contact route, legal routes, and 404. `Base.astro` supplies metadata, bundled fonts, navigation, footer, and shared `agent-site.css`. The approved CPL logo is unchanged; the build derives icons and voice/chat social artwork.

The homepage’s initial `HeroStage.astro` composition is lightweight HTML/CSS. Core offer text and the request CTA are prerendered. The homepage and both service pages mount `AgentExperience` with `client:visible`; the request form is a separate component on `/demo/`.

## Local Agent Experience

| Source | Responsibility |
| --- | --- |
| `shared/agents/fixtures.ts` | Four fictional business scenarios, approved information, voice/chat messages, timings, and sample captures |
| `shared/agents/experience.ts` | One reducer for mode, scenario, elapsed time, and playback; derives transcript progress and result fields |
| `src/islands/AgentExperience.tsx` | Mode/scenario selection, playback, transcript, HTML result, motion preferences, and lazy scene mounting |
| `src/styles/agent-experience.css` | Dimensional HTML composition and responsive/static presentation |
| `src/islands/stage/createAgentStage.ts` | Optional Three.js phone, conversation, and inquiry geometry, lighting, perspective, and pose transitions |

The reducer’s snapshot reveals complete messages and collects only their explicitly supplied fields. Mode/scenario changes restart the sample; play, pause, replay, and skip-to-result use the same state. The complete selected transcript is rendered in semantic HTML. A billing scenario illustrates a simulated person-needed boundary.

These fixed stories exist in browser memory. They do not request microphone access, play audio, invoke an LLM or Stammer API, create an appointment, or submit a real inquiry. No visitor scenario choice is transmitted as a lead. Stammer AI is the selected platform for separately scoped CPL services; the marketing implementation does not establish a live platform account or deployment.

## Motion and fallback

HTML carries the readable conversation and result; the decorative canvas is hidden from the accessibility tree. Three.js loads progressively after the island is visible and the stage approaches the viewport. Narrow layouts and reduced-motion preferences use the HTML composition without mounting the 3D scene.

The renderer caps pixel ratio at 1.5. It renders bounded pose transitions and changes on demand, pauses offscreen or while the document is hidden, and disposes observers, listeners, geometry, materials, and GPU resources. WebGL failure or context loss leaves the HTML story available. Playback also stops advancing while hidden or offscreen.

Reduced motion shows a completed stable sample and uses immediate state changes. A separate motion control governs visual interpolation; playback has its own pause control. These are source-level behavior descriptions. Browser and measured performance outcomes belong in `docs/verification.md`.

## Real inquiry path

`InquiryForm.astro` posts to `POST /api/inquiries`. Shared `validateInquiry` rules run in the browser and Worker. New agent interests (`voice`, `chat`, `both`, `not-sure`) require name, email, and company. Phone, website, and problem text are optional and bounded. The website is represented by the existing `currentTools` column; omitted problem text becomes an explicit request stating that additional details were not provided. Existing legacy interest values and their required-description rules remain supported.

`worker/index.ts` routes inquiry and protected operator requests; static assets are served from `dist/` through the existing asset configuration. The backend retains:

- Same-origin checks, Turnstile verification, honeypot rejection, bounded field validation, and hashed rate-limit identifiers.
- Stable submission UUIDs, canonical payload hashing, duplicate detection, durable D1 insertion, and readback.
- Separate Google archive and business notification status, delivery attempts, and bounded retry/backoff behavior.
- Private operator routes requiring an appropriately configured bearer token.

The browser only treats a response as saved when it confirms `ok`, `saved`, `storage: "saved"`, and a reference. An unchanged retry keeps its submission id; changed form content gets a new identity. Personal request data is not kept in browser local storage. The public email fallback is `AStarrett@cyberpiratelabs.com`.

## Downstream delivery

A D1 save establishes website storage. It does not establish arrival in a Google Sheet, Drive folder, or inbox. A configured later step sends a signed payload to the existing Google endpoint; credentials remain server-side.

Archive status is `pending`, `pending_unconfigured`, `synced`, or `failed`. Notification status is `pending`, `pending_unconfigured`, `sent`, or `failed`. The form reports the recorded state. Unconfigured delivery has no live acceptance claim; configured failures can be retried on the existing 15-minute schedule, subject to backoff and an eight-attempt limit.

No new schema migration, database, platform account, resource binding, or environment secret is required by this presentation update. Use the existing verified release target and process documented in `docs/cloudflare-deploy.md`.

## Retained history

`ProductStage.tsx`, `FilmScenes.tsx`, their styles, `shared/demo/`, and the old `shared/capability.ts` remain as historical source. Current routes do not import the retired Command Center marketing experience. Its tests preserve past source invariants; they do not establish active website or customer-product behavior.
