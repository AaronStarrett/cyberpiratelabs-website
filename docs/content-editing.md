# Content editing

## Active content

| Source | Edit here |
| --- | --- |
| `src/pages/index.astro` | Homepage offer, service sections, use cases, implementation sequence, connections, and closing flow |
| `src/pages/voice-agents.astro`, `chat-agents.astro` | Focused service explanations and scoped setup details |
| `src/pages/demo.astro`, `contact.astro` | Demonstration request context and existing contact route |
| `shared/site.ts` | Shared FAQ answers |
| `src/components/Header.astro`, `Footer.astro`, `HeroStage.astro`, `ClosingCTA.astro` | Shared navigation, brand composition, and calls to action |
| `src/layouts/Base.astro` | Shared metadata, canonical URLs, social image, fonts, and page shell |
| `src/styles/agent-site.css` | Shared marketing layout and responsive styling |
| `shared/agents/fixtures.ts` | Fictional businesses, approved information, voice/chat scripts, timings, and captured sample fields |
| `shared/agents/experience.ts` | Playback state and transcript/result derivation |
| `src/islands/AgentExperience.tsx`, `src/styles/agent-experience.css` | Walkthrough controls, transcript, result, responsive composition, and motion preferences |
| `src/islands/stage/createAgentStage.ts` | Optional Three.js geometry, camera poses, lighting, and cleanup |
| `src/components/InquiryForm.astro`, `shared/inquiry/validate.ts` | Real request form and shared client/server validation |

Old `ProductStage`, `FilmScenes`, film styles, `shared/demo/`, and `shared/capability.ts` are retained historical source. Current public pages do not render them. Editing those files does not update the voice/chat experience.

## Truthful service copy

Use Cyber Pirate Labs, CPL AI Voice Agents, and CPL AI Chat Agents without unsupported trademark marks. Describe the agents as configured around business information and workflows, with CPL handling implementation and ongoing management. Stammer AI is the underlying service platform; the website does not imply an active account, number, customer deployment, or proprietary foundation model.

Keep phone setup, transfers, recording, connections, usage, and human follow-up scoped. Distinguish an approved booking link from a confirmed appointment created through a supported integration. Pricing, allowances, timelines, and support commitments require an agreed scope. Do not add invented customers, testimonials, metrics, certifications, universal compatibility, or guaranteed outcomes.

## Sample continuity

The selectable examples are bathroom remodeling, recurring cleaning, routine home maintenance, and a billing question that needs a person. Each offers voice and chat scripts. Keep the fictional business’s approved information consistent with its answers.

Add captured fields only to messages that supply them. The result derives from the messages already reached; it must not invent contact details, timing, a quote, availability, or a booking. Use reserved example contact data. The billing result is a simulated follow-up request, not evidence that a human joined.

Keep the visible “Illustrative demo · Fictional business · Sample data” disclosure, transcript access, no-audio wording, and local-only result notice. The walkthrough must not call the inquiry endpoint or a model/platform API. Play, pause, replay, skip, mode/scenario changes, reduced motion, and hidden/offscreen behavior share one playback state; keep the 3D pose derived from it.

## Brand and discovery

Preserve the original `public/brand/cpl-logo.png` bytes and proportions. `scripts/generate-icons.mjs` derives icons and locally authored social-preview artwork; the social composition is illustrative. Typography uses bundled IBM Plex Sans Variable and IBM Plex Mono. Keep readable navy/teal contrast and dimensional light surfaces.

Update titles, descriptions, social-preview copy, structured data, and relevant sitemap routes alongside page changes. `SITE_URL` supplies the canonical base, with the existing apex URL as default. `PUBLIC_INDEXABLE` controls indexing. Do not add fabricated ratings, prices, locations, or certifications.

## Real request form

Keep `/api/inquiries`, existing payload names, submission identity, Turnstile, honeypot, same-origin protection, and genuine error/save states. New `voice`, `chat`, `both`, and `not-sure` interests require company and permit optional problem text. An omitted problem is stored as an explicit request with no additional details. The optional website uses the existing `currentTools` field; legacy callers keep their former meanings and validation.

Name, email, and company are required. Optional fields remain bounded. No customer files, credentials, payment information, or newsletter consent should be added. Keep **AStarrett@cyberpiratelabs.com** visible as the direct fallback.

A saved D1 reference and a delivered notification are different outcomes. Never replace backend confirmation with a timer or a simulated success. An unchanged retry must reuse its submission id. Update factual privacy content alongside collection or processing changes; retain the existing owner-review notices on privacy and terms.

## Verification

Run the tests, type check, lint, build, and secret scan. `tests/agent-experience.test.ts` checks the active narrative; `tests/inquiry.test.ts` checks validation and synthetic persistence/delivery behavior. Older film tests preserve historical source invariants.

Browser review remains necessary for meaningful motion, transcript/result continuity, mobile sizing, keyboard focus, reduced motion, missing WebGL, asset loads, and form failures. Use synthetic data and record actual outcomes and limits in `docs/verification.md`.
