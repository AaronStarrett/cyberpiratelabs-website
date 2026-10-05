# Content editing

## Active content

| Source | Edit here |
| --- | --- |
| `src/pages/index.astro` | Homepage offer, focused quote-request example, bundle previews, implementation sequence, and supporting delivery explanations |
| `shared/solutions.ts` | The ten service names, stable slugs, copy, inclusions, fit, scopes, fictional demos, related services, and four bundle workflows |
| `shared/solution-selection.ts`, `src/components/ProblemFinder.astro` | Accessible problem choices, matching cards, and allowlisted demo-request context |
| `src/pages/solutions/`, `src/components/SolutionCard.astro`, `SolutionDetail.astro`, `BundleFlow.astro` | Catalog-generated hubs/detail pages, reusable cards, and bundle paths/recipients |
| `src/pages/voice-agents.astro`, `chat-agents.astro` | Supporting delivery explanations and scoped setup details |
| `src/pages/demo.astro`, `contact.astro` | Demonstration request context and existing contact route |
| `shared/site.ts` | Shared FAQ answers |
| `src/components/Header.astro`, `Footer.astro`, `HeroStage.astro`, `ClosingCTA.astro` | Shared navigation, brand composition, and calls to action |
| `src/layouts/Base.astro` | Shared metadata, canonical URLs, social image, fonts, and page shell |
| `src/styles/agent-site.css` | Shared marketing layout and responsive styling |
| `src/styles/solutions.css`, `solution-home.css` | Solution/bundle templates and homepage problem selector/bundle styling |
| `shared/agents/fixtures.ts` | Four retained general fictional business examples, approved information, voice/chat scripts, timings, and captured fields |
| `shared/agents/solution-scenarios.ts` | Adapter from catalog demos to the existing playback model, including source-turn reveal timing and locked delivery |
| `shared/agents/experience.ts` | Playback state and transcript/result derivation |
| `src/islands/AgentExperience.tsx`, `src/styles/agent-experience.css` | Walkthrough controls, transcript, result, responsive composition, and motion preferences |
| `src/islands/stage/createAgentStage.ts` | Optional Three.js geometry, camera poses, lighting, and cleanup |
| `src/components/InquiryForm.astro`, `shared/inquiry/validate.ts` | Real request form and shared client/server validation |

Old `ProductStage`, `FilmScenes`, film styles, `shared/demo/`, and `shared/capability.ts` are retained historical source. Current public pages do not render them. Editing those files does not update the voice/chat experience.

## Truthful service copy

Use Cyber Pirate Labs, CPL AI Voice Agents, and CPL AI Chat Agents without unsupported trademark marks. Describe the agents as configured around business information and workflows, with CPL handling implementation and ongoing management. Stammer AI is the underlying service platform; the website does not imply an active account, number, customer deployment, or proprietary foundation model.

Lead with a recognizable problem and useful outcome, then describe what CPL configures. Keep phone setup, transfers, recording, connections, usage, and human follow-up scoped. Booking Assistance provides an existing link; the customer completes booking in that system. It does not autonomously book, reschedule, or cancel. Quote Requests collects all six fields: project type, approximate size, location, timing, budget, and contact information; a person calculates and issues any quote. Pricing, allowances, timelines, and support commitments require an agreed scope. Do not add invented customers, testimonials, metrics, certifications, universal compatibility, or guaranteed outcomes.

Preserve these bundle boundaries:

- **Lead to Next Step:** one configured chat experience offers a structured quote-request email **or** an existing booking link. Do not force both paths.
- **Phone Front Desk:** inbound screening leads to one configured human number or message capture/email, including an unanswered-call fallback. No outbound campaign or complex multi-department routing.
- **Customer Care:** getting started, basic support, and feedback are three possible needs. Keep actual human availability clear; ticketing, refunds, and guaranteed resolution are not implied.
- **Team Knowledge:** private procedures require verified controlled staff access. An ordinary public widget is unsuitable for confidential material. Do not imply automatic synchronization with public agents or unrestricted customer-conversation access.

Voice and chat are separate entry points. Email notifications, customer-clicked booking links, and human actions must remain distinct; do not invent shared memory, CRM synchronization, SMS automation, or agent-to-agent handoff.

## Sample continuity

Each catalog service supplies a fictional conversation and result through `Solution.demo`. The homepage uses the quote-request example; detail pages use their matching service. Focused samples keep their configured delivery and do not show the legacy mode/scenario selector. The general voice/chat experience retains bathroom remodeling, recurring cleaning, routine home maintenance, and a billing question that needs a person, each with voice and chat scripts.

Keep the fictional business's approved information consistent with its answers. Add captured fields only to messages that supply them. Catalog output labels are used by the authored source-turn map in `solution-scenarios.ts`; update that map when changing labels or turn order. Unmapped summaries wait for their matching text or the final turn. The result must not invent contact details, timing, a quote, availability, or a booking. Use reserved example contact data. The transfer and billing results are simulations, not evidence that a call connected or a human joined.

Keep the visible “Illustrative demo · Fictional business · Sample data” disclosure, transcript access, no-audio wording, and local-only result notice. The walkthrough must not call the inquiry endpoint or a model/platform API. Play, pause, replay, skip, mode/scenario changes, reduced motion, and hidden/offscreen behavior share one playback state; keep the 3D pose derived from it.

## Brand and discovery

Preserve the original `public/brand/cpl-logo.png` bytes and proportions. `scripts/generate-icons.mjs` derives icons and locally authored social-preview artwork; the social composition is illustrative. Typography uses bundled IBM Plex Sans Variable and IBM Plex Mono. Keep readable navy/teal contrast and dimensional light surfaces.

Update titles, descriptions, social-preview copy, structured data, and relevant sitemap routes alongside page changes. `SITE_URL` supplies the canonical base, with the existing apex URL as default. `PUBLIC_INDEXABLE` controls indexing. Do not add fabricated ratings, prices, locations, or certifications.

## Real request form

Keep `/api/inquiries`, existing payload names, submission identity, Turnstile, honeypot, same-origin protection, and genuine error/save states. New `voice`, `chat`, `both`, and `not-sure` interests require company and permit optional problem text. An omitted problem is stored as an explicit request with no additional details. The optional website uses the existing `currentTools` field; legacy callers keep their former meanings and validation.

Use `demoRequestHref` for solution/bundle CTAs. `demoSelection` accepts only known catalog slugs, places readable context in the existing `workflowProblem` field, and chooses `voice` or `chat` for the existing interest field. Do not replace that interest with a service slug or add an unnecessary schema field. A valid solution takes precedence if both query keys are present; unknown values do not become public copy or inquiry context.

Name, email, and company are required. Optional fields remain bounded. No customer files, credentials, payment information, or newsletter consent should be added. Keep **AStarrett@cyberpiratelabs.com** visible as the direct fallback.

A saved D1 reference and a delivered notification are different outcomes. Never replace backend confirmation with a timer or a simulated success. An unchanged retry must reuse its submission id. Update factual privacy content alongside collection or processing changes; retain the existing owner-review notices on privacy and terms.

Preserve the `bb2366d` notification safeguards: separate archive/email states, durable send ledger, HMAC verification, activation cutoff/backlog controls, uncertain-send handling, and retry protection. Do not treat older unconfigured-status notes as current configuration, or bulk-deploy the local Apps Script example over the authoritative cloud connector.

## Verification

Run the tests, type check, lint, build, and secret scan. `tests/solutions.test.ts` checks catalog boundaries, reciprocal links, bundle topology, and request links; `tests/solution-selection.test.ts` checks filtering and prefill; `tests/solution-experience.test.ts` checks catalog scenario/playback continuity. `tests/agent-experience.test.ts` retains general narrative coverage; `tests/inquiry.test.ts` checks validation and synthetic persistence/delivery behavior. Older film tests preserve historical source invariants.

Browser review remains necessary for meaningful motion, transcript/result continuity, responsive sizing, keyboard focus, reduced motion, missing WebGL, asset loads, and form failures. Check all ten detail URLs, all four bundles, related links, retained homepage anchors, and every selected-service/bundle prefill. Keep stable slugs unless providing deliberate redirects. Use synthetic local/mocked requests; do not submit production test inquiries or trigger customer communications. Record actual outcomes and limits in `docs/verification.md`. This update stops at a local review preview before production deployment.
