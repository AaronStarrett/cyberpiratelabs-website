# Cyber Pirate Labs website

Public site for CPL Command Center, the early-access workflow platform from Cyber Pirate Labs, LLC.

The site is a visual preview of that one product: a sample job you can play, with an inquiry form. It is not the Command Center application and it does not claim general availability.

## Run locally

```bash
npm install
npm run dev
```

The Astro dev server listens on http://127.0.0.1:43123. Inquiry storage is served by the Worker, so use this when you also want the form API and the real 404:

```bash
npm run build
npx wrangler d1 migrations apply cpl-website-inquiries-preview --local
cp .dev.vars.example .dev.vars
npm run cf:dev
```

Fill `.dev.vars` with local placeholders. Do not commit it. Production Turnstile, Google, and operator secrets are not in the repository.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run scan:secrets
```

## Edit and redeploy

Copy and page structure live in `src/pages`. Scenario text lives in `shared/demo/scenarios.ts`. The public capability list lives in `shared/capability.ts`. After a content change:

```bash
npm test
npm run build
npx wrangler deploy
```

`wrangler deploy` publishes the preview Worker named `cyberpiratelabs-website`. Production is a separate Worker and database:

```bash
npx wrangler deploy --env production
```

Set secrets separately for each. See `docs/cloudflare-deploy.md`.

## Rights

All rights reserved. No open-source license is granted.

Product behavior notes cite the public repository [CPL-Command-Center-Public](https://github.com/AaronStarrett/CPL-Command-Center-Public) at commit `25d294c8743a938466a6b8faf769f13f3c30a700`, read on 2026-09-21. That repository is a reference only.
