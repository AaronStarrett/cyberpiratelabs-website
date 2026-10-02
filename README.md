# Cyber Pirate Labs website

The official marketing website for **CPL AI Voice Agents** and **CPL AI Chat Agents**. Cyber Pirate Labs configures, implements, connects, tests, and manages agents around agreed business information and workflows, using Stammer AI as the underlying service platform.

This repository contains a static Astro website, a local React/Three.js conversation walkthrough, and the existing Cloudflare Worker/D1 inquiry system. It does not contain a live Stammer agent, a customer portal, or the separate Command Center application.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Main offer, interactive experience, service explanations, examples, implementation sequence, and FAQ |
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
- Navigation, hero composition, and final CTA: `src/components/{Header,HeroStage,ClosingCTA}.astro`.
- Signature walkthrough: `src/islands/AgentExperience.tsx`, `shared/agents/fixtures.ts`, and `shared/agents/experience.ts`.
- Optional 3D scene: `src/islands/stage/createAgentStage.ts`.
- Presentation: `src/styles/agent-site.css` and `src/styles/agent-experience.css`.
- Request form and shared validation: `src/components/InquiryForm.astro` and `shared/inquiry/validate.ts`.
- Backend: `worker/index.ts` and `shared/inquiry/`.
- Approved logo: `public/brand/cpl-logo.png`; derived icons/social artwork: `scripts/generate-icons.mjs`.

Retired Command Center marketing components, styles, and `shared/demo/` modules remain as source history. Current public pages do not import that experience. Retained historical source is not deployed marketing or proof of a live product.

## Demonstration and inquiry boundaries

The walkthrough offers voice/chat selection, four fictional scenarios, playback controls, an accessible complete transcript, and an organized sample result. It is transcript-only: no audio, microphone, live AI request, Stammer connection, or real lead transmission. The billing example shows a simulated human follow-up boundary.

The separate form sends to `POST /api/inquiries`. Name, email, and company are required for new agent-demo requests; phone, website, interest, and problem details are optional. The existing payload and D1 schema are preserved. Legacy inquiry interests retain their earlier validation rules.

A confirmed save means the D1 record was inserted and read back. Google archive and business notification use separate statuses, including `pending_unconfigured`; a saved request does not establish final notification delivery. The form keeps a stable submission id for unchanged retries. The verified public email fallback is **AStarrett@cyberpiratelabs.com**. No meeting is automatically booked and no newsletter consent is bundled into an inquiry.

## Checks and release

~~~powershell
npm test
npm run typecheck
npm run lint
npm run build
npm run scan:secrets
~~~

Inspect rendered desktop, mobile, keyboard, reduced-motion, and WebGL fallback behavior as well as request validation and failure states. [Verification](docs/verification.md) records actual results; commands here are instructions, not a claim that checks or deployment have passed.

Review and commit the intended website changes, push to the existing repository, and use the established verified Worker release procedure in [deployment documentation](docs/cloudflare-deploy.md). Preserve existing infrastructure, deployed secrets, bindings, and workflow configuration. A Git push, Worker deployment, public-page verification, and downstream notification acceptance are separate states. [Rollback notes](docs/rollback.md) describe recovery through the existing release mechanism.

See [content editing](docs/content-editing.md), [architecture](docs/architecture.md), and [capability boundaries](docs/capability-matrix.md).

## Rights

All rights reserved. No open-source license is granted.
