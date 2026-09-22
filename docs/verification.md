# Verification

Release preflight recorded on 2026-09-21 for the six-chapter HA-1044 product film. These results describe the local production build served by the Worker. Preview deployment and a real preview inquiry submission remain pending.

## Automated checks

| Check | Result |
| --- | --- |
| Unit tests | PASS — 52/52: 29 film tests and 23 existing tests. |
| Astro and Worker type checks | PASS — Astro reported 0 errors, 0 warnings, and 0 hints; Worker TypeScript passed. |
| ESLint | PASS |
| Production build | PASS |
| Secret scan | PASS |

These checks cover sample-state and existing backend regressions. They do not establish a live inquiry save, downstream delivery, or a deployed revision.

## Chromium browser checks

The production build was inspected through the local Worker in Chromium.

| Viewport | Result |
| --- | --- |
| Wide desktop, 1440 × 1000 | PASS — inspected; no horizontal overflow. |
| Laptop, 1280 × 800 | PASS — inspected; no horizontal overflow. |
| Mobile emulation, 390 × 844 | PASS — no horizontal overflow across all six chapters. |
| Small mobile emulation, 360 × 800 | PASS — no horizontal overflow across all six chapters. |

- An edited proposal scope remained visible after the simulated award and in Field and Customer perspectives.
- The missing-access example paused playback and disabled later chapters; restoring the access detail cleared the hold.
- Escape closed the sample report dialog and returned focus to its trigger.
- Reduced motion used the HTML presentation and manual Next navigation.
- Deliberate WebGL context loss retained the usable report dialog. Restoration was observed returning the environment to WebGL.
- Scrolling the stage offscreen paused the narrative; it remained on the same chapter.

These are browser checks with desktop and mobile emulation, not physical-device tests. WebKit: **NOT RUN**. Physical devices: **NOT RUN**.

## Inquiry and live-environment limits

The live Turnstile widget could not complete verification on the local domain and reported `300030`. A real preview submission, authenticated persistence readback, and replay of that same submission identity are **PENDING**. Passing unit tests does not replace those checks.

Live Google Sheets/Drive delivery and owner email delivery are **NOT VERIFIED**. Their statuses are separate from a durable D1 inquiry save. The official-domain cutover and deployment of the Command Center application are outside this website release.

## Release completion checklist

- [ ] Record the published branch/default-branch status and exact committed source revision.
- [ ] Verify the existing Cloudflare account, preview Worker, and database binding; deploy that known revision without replacing inquiry records or secrets.
- [ ] Record the actual preview URL and deployed revision, then inspect the deployed film, supporting pages, contact form, and CSP/browser errors.
- [ ] Submit one bounded fictional inquiry through normal preview controls, verify durable persistence, then replay the same submission identity and verify no duplicate.
- [ ] Record Google/email delivery outcomes independently, including any remaining credentials or configuration gap.
- [ ] Complete and retain the default-story and mobile-emulation recordings, matching before/after screenshots, silent and caption-hidden design reviews, and measured browser performance. Restore captions after review.
- [ ] Update this record with deployment results and any checks that remain unrun. Re-run affected checks if the source changes.

Screenshots, recordings, and private test evidence are kept on the verified external SSD outside the public repository. Do not commit inquiry contact data, operator responses, credentials, or private recovery material.
