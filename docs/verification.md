# Verification

Updated as checks were run in this workspace on 2026-09-21.

## Automated

- `npm test`: 15 tests passed. Covers scenario transitions, validation, duplicate submission, honeypot, Turnstile failure, Google failure then recovery with a mocked fetch, operator export, and deletion.
- `npm run typecheck`: `astro check` and worker `tsc` passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run scan:secrets`: passed before commit. Re-run before any public push.

Live Google sync: not tested. Live Turnstile: not tested. Live owner email: not tested. Cloudflare remote deploy: not tested until `wrangler login` succeeds.

## Browser

Local Worker on http://127.0.0.1:43123, 2026-09-21.

- Desktop 1440 and 1280: homepage, workflow step, and demo rendered. No horizontal overflow.
- Tablet 768: homepage stacks to one column, menu control is shown, overflow is 0.
- Phone 390: homepage, open menu, and demo stepper. The step list is hidden and the select stepper is shown. Overflow is 0.
- Demo: missing information stops before the proposal. Reject adds “Approval not granted” and hides the job. Approve reveals the job, field notes, report, and handoff. The sync checkbox replaces the handoff with “Handoff cannot sync”. Discuss this workflow links to `/contact/?interest=demonstration&scenario=inspection` with no personal fields.
- Reduced motion: Run from start stayed on step 1 after four seconds, and the reduced-motion note was visible.
- Contact: interest and scenario prefill work. Empty submit shows field errors and does not save. A complete sample is refused with “Verification is not configured on this deployment. Nothing was saved.”
- `GET /does-not-exist` returned HTTP 404 and the designed page. The console error is the document 404 itself.
- Other checked pages reported no console warnings. Homepage, demo, and contact had no asset errors during those passes.
- `POST /api/inquiries` without Worker secrets returned 503 and did not claim a save.

Screenshots: `home-desktop.png`, `home-mobile.png`, `home-tablet.png`, `demo-desktop.png`, `demo-mobile.png`, `mobile-menu.png`, `not-found.png` in the project media folder.
