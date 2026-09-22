# Cyber Pirate Labs website

Public site for CPL Command Center, the early-access workflow platform from Cyber Pirate Labs, LLC.

The site explains that product through one interactive film: fictional request `HA-1044` moves from an email, call note, and site image into an organized record, a proposal and simulated award, field documentation, a reviewable report, and a connected overview. Optional guided playback lasts 54 seconds. Visitors can also explore chapters and perspectives at their own pace.

The preview runs locally in the browser with sample data. The inquiry form is a separate, real Worker/D1 workflow. This repository is the public website, not the Command Center application, and it does not establish the application's general availability.

## Run locally

```bash
npm ci
npm run dev
```

The Astro dev server listens on http://127.0.0.1:43123. Inquiry storage is served by the Worker, so use this when you also want the form API and the real 404:

```bash
npm run build
npx wrangler d1 migrations apply cpl-website-inquiries-preview --local
cp .dev.vars.example .dev.vars
npm run cf:dev
```

Configure `.dev.vars` for local testing and do not commit it. Turnstile is required for inquiry submission; arbitrary placeholder values do not make verification work. Production Turnstile, Google, and operator secrets are not in the repository. For the owner's Windows workspace, source, dependencies, caches, build output, and test artifacts stay on the verified external SSD.

## Product film

- `shared/demo/film.ts`: fictional sample data, six chapter definitions, durations, reducer, derived record, and Office/Field/Customer perspectives.
- `src/islands/ProductStage.tsx`: hero, transport, chapter navigation, source-to-field motion, reduced-motion handling, and progressive Three.js loading.
- `src/islands/FilmScenes.tsx`: readable business interfaces, input/source dialogs, editable proposal scope, field evidence, sample report, and perspective views.
- `src/styles/film.css` and `src/styles/film-scenes.css`: film layout, responsive product surfaces, and transitions.
- `src/islands/stage/createStage.ts`: optional Three.js environment; essential text and controls remain HTML.
- `src/pages/index.astro` and `src/styles/site-finish.css`: three illustrative business fits, configuration explanation, contact presentation, and branded site shell.

Opening a source or report, changing perspective or chapter, editing scope, simulating an award, attaching field evidence, and reviewing the report pause guided playback. An optional missing-access-detail example holds the same request until the existing call note supplies the detail. These actions change deterministic sample state; they do not parse a live inbox, create a customer job, or send a report.

The homepage and `/demo/` share this film. `/demo/` also provides capability notes and a static six-chapter transcript. The lower homepage examples cover inspection, field service, and recurring care; the film does not have an industry-template switch. Older `shared/demo/{engine,scenarios,watch,chapters}` modules remain in the repository but are not the rendered film's state or content source.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run scan:secrets
```

## Edit and redeploy

Page copy lives in `src/pages`; film content and lifecycle state live in `shared/demo/film.ts`. The public capability list lives in `shared/capability.ts`. See `docs/content-editing.md` before changing story identity, transition timing, or product claims.

Run the checks above and review the rendered desktop, mobile, reduced-motion, and HTML fallback experiences. For an authorized preview release, confirm the existing Cloudflare account, Worker, database binding, and secrets, then deploy the reviewed committed revision:

```bash
npm run cf:deploy
```

This script builds the website and publishes the existing preview Worker, `cyberpiratelabs-website`. The separate production environment and official-domain cutover require their own authorization and configuration. Preserve deployed secrets and inquiry records; a UI update does not require a new database. Keep GitHub Actions disabled. See `docs/cloudflare-deploy.md` for configuration details and `docs/verification.md` for recorded checks. Commands in this README are instructions, not evidence that a build, browser check, or deployment has succeeded.

## Rights

All rights reserved. No open-source license is granted.

Product behavior notes cite the public repository [CPL-Command-Center-Public](https://github.com/AaronStarrett/CPL-Command-Center-Public/tree/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c) at commit `26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c`, reviewed on 2026-09-21. That repository is a read-only product reference. See `docs/capability-matrix.md` for the distinction between website sample behavior, development source, and planned features.
