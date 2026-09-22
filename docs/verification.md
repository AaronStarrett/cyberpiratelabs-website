# Verification

Verification recorded on 2026-09-21 (America/New_York) / 2026-09-22 UTC for the six-chapter HA-1044 product film. Local checks were followed by a deployment and inspection of the existing preview. A subsequent mobile CSS refinement keeps proposal context and the simulated award in the same phone view.

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

The live Turnstile widget could not complete verification on the local domain and reported `300030`. The deployed preview completed genuine Turnstile verification. One fictional inquiry returned HTTP 201 and was read back from D1. Replaying the same UUID and unchanged fields with a fresh challenge returned HTTP 200, duplicate=true, and the same reference. A second D1 read found exactly one matching row; the earlier owner-reported reference remained present. Private evidence records the UUID and reference.

Live Google Sheets/Drive delivery and owner email delivery are **NOT VERIFIED**. Their statuses are separate from a durable D1 inquiry save. The official-domain cutover and deployment of the Command Center application are outside this website release.

## Release evidence

- [x] The focused branch was published and fast-forwarded into main in the existing public repository. Actions remained disabled.
- [x] The existing account, preview Worker, D1 binding, and secret names were verified. No migration, database reset, or secret replacement was performed.
- [x] The preview deployment was tagged with its exact Git commit. Homepage, demo, contact, privacy, and terms returned 200; an unknown route returned the designed 404. The inspected live film logged no application errors or CSP violations. The final version and SHA are recorded in the private release handoff.
- [x] One bounded fictional inquiry and same-identity replay passed, with authenticated D1 readback. The successful form button was temporarily re-enabled for the replay; validation, Turnstile, and the normal Worker path remained intact.
- [x] Google archive and owner notification both remain pending_unconfigured. They are not claimed delivered.
- [ ] Complete and retain the default-story and mobile-emulation recordings, matching before/after screenshots, silent and caption-hidden design reviews, and measured browser performance. Restore captions after review.
- [x] WebKit and physical-device testing remain NOT RUN. No external user research or owner design acceptance is claimed.

Screenshots, recordings, and private test evidence are kept on the verified external SSD outside the public repository. Do not commit inquiry contact data, operator responses, credentials, or private recovery material.
