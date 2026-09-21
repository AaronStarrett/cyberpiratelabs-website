# Architecture

The site is a static Astro build plus a small Cloudflare Worker.

- Pages are prerendered HTML, CSS, and a React island for the walkthrough.
- `worker/index.ts` handles `POST /api/inquiries`, operator routes under `/api/operator`, and a 15-minute scheduled retry.
- Cloudflare serves `dist/` as static assets. Only `/api/*` runs the Worker first. Unknown pages use `404.html` with a 404 status.
- Inquiry rows live in D1. Preview and production are different Worker names and different databases.
- Google Sheets, Drive, and owner email are a later delivery step. The browser never receives Google tokens, the HMAC secret, or the script URL.
- The HMAC envelope is `{ timestamp, submissionId, signature, payload }`. `signature` is hex HMAC-SHA256 over `timestamp.submissionId.sha256(payload)` using `GOOGLE_HMAC_SECRET`.
- “Saved” means the D1 insert succeeded. Google sync and notification have their own statuses: `pending`, `pending_unconfigured`, `synced` or `sent`, and `failed`.
- Turnstile is required whenever a secret is configured, and submissions are rejected when it is not configured. There is no bypass flag.
- Operator routes require `Authorization: Bearer` matching `OPERATOR_TOKEN` (at least 24 characters). There is no public inquiry list.

Scheduled retries select rows that are still pending or whose backoff time has arrived, up to 8 attempts. Backoff is 1 minute, 5 minutes, 15 minutes, 1 hour, 6 hours, then 24 hours.
