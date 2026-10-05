# Cyber Pirate Labs website

The official Cyber Pirate Labs marketing website presents **ten business solutions and four scoped bundles**, delivered through configured voice or chat assistance. CPL implements and manages the agreed business information and workflows, using Stammer AI as the underlying service platform.

This repository contains a static Astro website, a local React/Three.js conversation walkthrough, and the existing Cloudflare Worker/D1 inquiry system. It does not contain a live Stammer agent, a customer portal, or the separate Command Center application.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Outcome-led offer, problem selector, all ten solutions, focused quote-request example, bundles, implementation sequence, and FAQ |
| `/solutions/` | All ten services grouped by capture, guidance, customer care, and staff needs |
| `/solutions/[slug]/` | Ten catalog-generated detail pages with inclusions, fictional samples, scope, and relevant links |
| `/solutions/bundles/` | Four connected workflows with alternative paths and named human recipients |
| `/solutions/bundles/[slug]/` | Four catalog-generated bundle detail pages |
| `/voice-agents/` | Inbound voice service and setup boundaries |
| `/chat-agents/` | Website chat service and setup boundaries |
| `/demo/` | Real demonstration request form |
| `/contact/` | Existing business email and access to the request form |
| `/privacy/`, `/terms/` | Existing legal routes with owner-review notices |

## Local development

Use Node 24 with support for the test suite’s `node:sqlite` module and the committed npm lockfile:

~~~powershell
npm ci
npm run dev
~~~

The Astro server listens at `http://127.0.0.1:43123`. It previews the static site; the inquiry API requires the Worker.

On the owner’s Windows workspace, select the existing SSD Node 24 toolchain for the current terminal and keep task-controlled source, dependencies, npm cache, TEMP/TMP, build output, and screenshots on the verified external SSD. Do not relocate global tools.

For a local Worker preview with the existing schema:

~~~powershell
npm run build
npx wrangler d1 migrations apply cpl-website-inquiries-preview --local
Copy-Item .dev.vars.example .dev.vars
npm run cf:dev
~~~

Configure ignored local environment files for your test environment. `PUBLIC_TURNSTILE_SITE_KEY` must be present when Astro builds; it is public configuration. Server verification requires its matching Turnstile configuration. Placeholder tokens do not pass verification. Never commit `.dev.vars`, secret values, or inquiry data. See [deployment documentation](docs/cloudflare-deploy.md) for the established environment and release procedure.

## Source map

- Page copy: `src/pages/`; FAQ: `shared/site.ts`.
- Service/bundle metadata, stable slugs, boundaries, and fictional demos: `shared/solutions.ts`.
- Problem matching and allowlisted request context: `shared/solution-selection.ts`; homepage selector: `src/components/ProblemFinder.astro`.
- Reusable solution and bundle presentation: `src/components/{SolutionCard,SolutionDetail,BundleFlow}.astro` and `src/pages/solutions/`.
- Navigation, hero composition, and final CTA: `src/components/{Header,HeroStage,ClosingCTA}.astro`.
- Signature walkthrough: `src/islands/AgentExperience.tsx`, `shared/agents/fixtures.ts`, and `shared/agents/experience.ts`; focused catalog adapter: `shared/agents/solution-scenarios.ts`.
- Optional 3D scene: `src/islands/stage/createAgentStage.ts`.
- Presentation: `src/styles/agent-site.css`, `src/styles/agent-experience.css`, `src/styles/solutions.css`, and `src/styles/solution-home.css`.
- Request form and shared validation: `src/components/InquiryForm.astro` and `shared/inquiry/validate.ts`.
- Backend: `worker/index.ts` and `shared/inquiry/`.
- Approved logo: `public/brand/cpl-logo.png`; derived icons/social artwork: `scripts/generate-icons.mjs`.

Retired Command Center marketing components, styles, and `shared/demo/` modules remain as source history. Current public pages do not import that experience. Retained historical source is not deployed marketing or proof of a live product.

## Demonstration and inquiry boundaries

The homepage and solution details use focused demonstrations derived from the ten-service catalog. Each keeps its assigned voice or chat delivery, playback controls, an accessible complete transcript, and a sample result. The general experience on the supporting voice/chat pages retains its four fictional scenarios and mode/scenario selection. All examples are transcript-only: no audio, microphone, live AI request, Stammer connection, real call, booking, or lead transmission. The retained billing example shows a simulated human follow-up boundary.

The separate form sends to `POST /api/inquiries`. Name, email, and company are required for new agent-demo requests; phone, website, interest, and problem details are optional. The existing payload and D1 schema are preserved. Legacy inquiry interests retain their earlier validation rules.

Known `solution` or `bundle` query values on `/demo/` prefill clear selection context in the existing `workflowProblem` field and select the existing `voice` or `chat` interest. Service slugs are not submitted as inquiry interests. Unknown selections are ignored; no new payload or database field is introduced.

A confirmed save means the D1 record was inserted and read back. Google archive and business notification use separate statuses; a saved request does not establish final notification delivery. The notification repair from `bb2366d`, including the durable send ledger, HMAC verification, activation cutoff/backlog gate, uncertain-send handling, and retry protections, is preserved. Status names such as `pending_unconfigured` describe possible states, not an assertion about current production configuration. The form keeps a stable submission id for unchanged retries. The verified public email fallback is **AStarrett@cyberpiratelabs.com**. No meeting is automatically booked and no newsletter consent is bundled into an inquiry.

## Checks and release

~~~powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run scan:secrets
~~~

Inspect rendered desktop, tablet, mobile, keyboard, reduced-motion, and WebGL fallback behavior as well as request validation and failure states. Review the problem selector, all ten direct solution pages and sample results, four bundle paths, and selected context on `/demo/`. Do not submit production test inquiries or trigger customer communications during preview review. [Verification](docs/verification.md) records actual results; commands here are instructions, not a claim that checks or deployment have passed.

The ten-solution update is a local review preview and stops before a new production deployment. For a separately authorized release, use the established Worker procedure in [deployment documentation](docs/cloudflare-deploy.md). Preserve existing infrastructure, deployed secrets, bindings, cron, domains, and workflow configuration; do not bulk-deploy `google/apps-script/`, whose local example is not the authoritative cloud connector. A Git push, Worker deployment, public-page verification, and downstream notification acceptance are separate states. [Rollback notes](docs/rollback.md) describe recovery through the existing release mechanism.

See [content editing](docs/content-editing.md), [architecture](docs/architecture.md), and [capability boundaries](docs/capability-matrix.md).

## Rights

All rights reserved. No open-source license is granted.
