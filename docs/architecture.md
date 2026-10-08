# Architecture

## Outcome-led marketing and separate consultation path

The ten-service catalog remains unchanged. shared/custom-automation.ts holds the separate consultation context, process and FAQ; custom-automation.astro explains the offer and consultation.astro reuses InquiryForm with requestKind=custom. The homepage links directly to custom automation and its consultation URL; CustomAutomationCTA remains on the catalog and bundle hub. The consultation uses existing inquiry fields and not-sure interest; no Worker, database, migration, binding, secret or provider deployment is introduced.


The marketing site keeps the existing static Astro build, React islands, npm lockfile, and Cloudflare Worker/D1 inquiry backend.

## Public rendering

`src/pages/` defines the homepage, solution and bundle hubs, ten generated solution pages, four generated bundle pages, supporting voice/chat pages, request page, existing contact route, legal routes, and 404. `src/pages/solutions/[slug].astro` and `bundles/[slug].astro` use catalog-driven static paths. `SolutionCard`, `SolutionDetail`, and `BundleFlow` provide reusable presentation, including scope, alternative paths, and recipients. `Base.astro` supplies metadata, bundled fonts, navigation, footer, and shared `agent-site.css`; `solutions.css` and `solution-home.css` extend the existing style. Approved logo and pirate illustration assets are reused.

The homepage renders a navy software-automation hero with `AutomationStage.astro`: an SVG isometric workflow and three native buttons that update local labels and a polite readable status. All ten service links are prerendered in compact groups beside the approved pirate artwork. Custom software, three process steps and concise native FAQs use varied sections. The homepage imports no React/Three.js experience. Solution details still mount their matching catalog demos; supporting voice/chat pages retain the general experience. Islands use `client:visible`. The inquiry form remains a separate component on `/demo/`. Existing homepage anchors `experience`, `services`, `use-cases`, `how-it-works` and `faq` remain available with their current related content.

`shared/seo.ts` defines factual Organization, Service and visible-path BreadcrumbList markup. Official production assets are built with `PUBLIC_INDEXABLE=true`; the workers.dev host has an exact-host noindex header, API responses have runtime noindex headers, and the 404 document explicitly stays noindex.

## Local Agent Experience

| Source | Responsibility |
| --- | --- |
| `shared/solutions.ts` | Ten solutions, four bundles, stable slugs, groups, scope, fictional demos, relationships, and safe request URLs |
| `shared/solution-selection.ts` | Problem-to-solution matching and known solution/bundle query selection for request prefill |
| `shared/agents/fixtures.ts` | Four retained general fictional business scenarios, approved information, voice/chat messages, timings, and sample captures |
| `shared/agents/solution-scenarios.ts` | Adapts catalog demos into the existing scenario shape, with authored source-turn captures and one assigned delivery mode |
| `shared/agents/experience.ts` | One reducer for mode, scenario, elapsed time, and playback; derives transcript progress and result fields |
| `src/islands/AgentExperience.tsx` | Mode/scenario selection, playback, transcript, HTML result, motion preferences, and lazy scene mounting |
| `src/styles/agent-experience.css` | Dimensional HTML composition and responsive/static presentation |
| `src/islands/stage/createAgentStage.ts` | Optional Three.js phone, conversation, and inquiry geometry, lighting, perspective, and pose transitions |

The reducer's snapshot reveals complete messages and collects their explicitly supplied fields. The catalog adapter associates result fields with authored source turns; unknown mappings fall back to an exact text match or the final turn. The final next-step disclosure is added at the final turn. Focused scenarios lock their voice/chat delivery and replace the legacy chooser with a delivery label. General mode/scenario changes restart the sample; play, pause, replay, and skip-to-result use the same state. The complete selected transcript, plus a focused sample's complete result, is prerendered in an expandable native HTML disclosure. The retained billing scenario illustrates a simulated person-needed boundary.

These fixed stories exist in browser memory. They do not request microphone access, play audio, invoke an LLM or Stammer API, create an appointment, or submit a real inquiry. No visitor scenario choice is transmitted as a lead. Stammer AI is an optional platform when it fits separately scoped CPL services; the marketing implementation does not establish a live platform account or deployment.

## Motion and fallback

HTML carries the readable conversation and result; the decorative canvas is hidden from the accessibility tree. Three.js loads progressively after the island is visible and the stage approaches the viewport. Narrow layouts and reduced-motion preferences use the HTML composition without mounting the 3D scene.

The renderer caps pixel ratio at 1.5. It renders bounded pose transitions and changes on demand, pauses offscreen or while the document is hidden, and disposes observers, listeners, geometry, materials, and GPU resources. WebGL failure or context loss leaves the HTML story available. Playback also stops advancing while hidden or offscreen.

Reduced motion shows a completed stable sample and disables animated playback controls. The scene's paused state follows playback and motion preferences. These are source-level behavior descriptions. Browser and measured performance outcomes belong in `docs/verification.md`.

## Real inquiry path

`InquiryForm.astro` posts to `POST /api/inquiries`. Shared `validateInquiry` rules run in the browser and Worker. New agent interests (`voice`, `chat`, `both`, `not-sure`) require name, email, and company. Phone, website, and problem text are optional and bounded. The website is represented by the existing `currentTools` column; omitted problem text becomes an explicit request stating that additional details were not provided. Existing legacy interest values and their required-description rules remain supported.

`demoRequestHref` builds `/demo/?solution=<known-slug>&interest=voice|chat` or the equivalent `bundle` link. In the form, `demoSelection` resolves only catalog entries, writes readable selection context to an empty `workflowProblem` field, and sets the existing delivery interest. A valid solution takes precedence over a bundle. Unknown slugs do not become inquiry interests or arbitrary public copy. This is client-side prefill, with no new payload field, database column, or backend route.

`worker/index.ts` routes inquiry and protected operator requests; static assets are served from `dist/` through the existing asset configuration. The backend retains:

- Same-origin checks, Turnstile verification, honeypot rejection, bounded field validation, and hashed rate-limit identifiers.
- Stable submission UUIDs, canonical payload hashing, duplicate detection, durable D1 insertion, and readback.
- Separate Google archive and business notification status, delivery attempts, and bounded retry/backoff behavior.
- Private operator routes requiring an appropriately configured bearer token.

The browser only treats a response as saved when it confirms `ok`, `saved`, `storage: "saved"`, and a reference. An unchanged retry keeps its submission id; changed form content gets a new identity. Personal request data is not kept in browser local storage. The public email fallback is `AStarrett@cyberpiratelabs.com`.

## Downstream delivery

A D1 save establishes website storage. It does not establish arrival in a Google Sheet, Drive folder, or inbox. A configured later step sends a signed payload to the existing Google endpoint; credentials remain server-side.

Archive status is `pending`, `pending_unconfigured`, `disabled`, `synced`, or `failed`. Notification status also includes `held` and `ambiguous` alongside `pending`, `pending_unconfigured`, `sent`, and `failed`. These are possible states, not an assertion that the current configuration is unconfigured. The form provides a received reference and a concise delay/contact message. The `bb2366d` notification repair remains intact: eligible due deliveries use an explicit activation cutoff, per-inquiry claims, HMAC validation, eight-attempt backoff and the existing 15-minute schedule. Apps Script's durable send ledger protects retries and reconciles lost responses; uncertain sends require owner review. Email is independent of the optional archive. See [notification setup](google-setup.md) for the additive script, preserved legacy deployments and exact backlog gate. The local Apps Script example is not the authoritative cloud connector and is not bulk-deployed by this update.

No new schema migration, database, platform account, resource binding, or environment secret is required by this presentation update. The current official website release is authorized and uses the existing target and process documented in `docs/cloudflare-deploy.md`, preserving bindings, credentials, cron and domain configuration. Production inquiry submissions remain excluded. API response headers now include noindex; processing behavior is unchanged.

## Retained history

`ProductStage.tsx`, `FilmScenes.tsx`, their styles, `shared/demo/`, and the old `shared/capability.ts` remain as historical source. Current routes do not import the retired Command Center marketing experience. Its tests preserve past source invariants; they do not establish active website or customer-product behavior.

The established /demo/ document and CTA destination remains available for core demonstrations and custom consultation. Custom links use /demo/?consultation=custom-automation&interest=not-sure; /consultation/ is an additional direct custom-form route. All payload fields, notification processing and saved-state checks remain unchanged.
