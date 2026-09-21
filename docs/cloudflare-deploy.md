# Cloudflare deploy

Project name: `cyberpiratelabs-website` (preview) and `cyberpiratelabs-website-production` (production).

This uses Workers Static Assets, one Worker, D1, Turnstile, and a cron trigger. It does not enable R2, paid add-ons, or GitHub Actions.

## Auth step that is still required

`wrangler` was not logged in during the build. Deploy is blocked until Aaron runs:

```bash
npx wrangler login
npx wrangler whoami
```

Confirm the account before creating resources. Do not change billing.

## Create separate databases

Preview:

```bash
npx wrangler d1 create cpl-website-inquiries-preview
```

Production:

```bash
npx wrangler d1 create cpl-website-inquiries-production
```

Replace the placeholder `database_id` values in `wrangler.jsonc` with the ids Cloudflare prints. Keep the preview id on the top-level config and the production id under `env.production`. Choose the D1 location when prompted. This repository does not claim a region.

Apply migrations to each, separately:

```bash
npx wrangler d1 migrations apply cpl-website-inquiries-preview --local
npx wrangler d1 migrations apply cpl-website-inquiries-preview --remote
npx wrangler d1 migrations apply cpl-website-inquiries-production --remote --env production
```

## Secrets

Set these on preview, then again with `--env production`. Use different values.

```bash
npx wrangler secret put RATE_LIMIT_SALT
npx wrangler secret put TURNSTILE_SECRET
npx wrangler secret put OPERATOR_TOKEN
npx wrangler secret put GOOGLE_HMAC_SECRET
npx wrangler secret put GOOGLE_APPS_SCRIPT_URL
```

`OPERATOR_TOKEN` must be at least 24 characters. `GOOGLE_HMAC_SECRET` must be at least 16 if Google is enabled. Leave the Google secrets unset until the Apps Script setup is done. Inquiries still save, with delivery marked `pending_unconfigured`.

Turnstile site keys are build-time public values, not Worker secrets:

```bash
PUBLIC_TURNSTILE_SITE_KEY=your-site-key PUBLIC_INDEXABLE=false npm run build
npx wrangler deploy
```

Use a production Turnstile widget only for the production build. Cloudflare publishes test keys for local wrangler. Do not put an always-pass test secret in the production Worker.

Preview stays `noindex` unless `PUBLIC_INDEXABLE=true` at build time. Use that only for the production domain build.

## Deploy

```bash
npm run build
npx wrangler deploy
```

Check the printed `*.workers.dev` URL before any domain change. Production:

```bash
PUBLIC_INDEXABLE=true SITE_URL=https://cyberpiratelabs.com npm run build
npx wrangler deploy --env production
```

Do that only after the production database id and production secrets exist. `workers_dev` is false for production, so it will not be the public site until a custom domain is attached.

## Native Git integration

Preferred path after the public GitHub repository exists: Cloudflare dashboard, Workers, Create, connect `AaronStarrett/cyberpiratelabs-website`, production branch `main`, build command `npm run build`, no GitHub Actions. Non-production builds must keep `PUBLIC_INDEXABLE` unset. Preview and production environment variables stay separate.
