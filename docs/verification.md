# Voice and chat website verification

This repository is the CPL marketing website. Checks below describe this revision and do not establish a deployed customer agent, Stammer account, or customer acceptance.

## Recorded implementation checks

- Existing Node 24.14.0 on the Extreme SSD; npm ci completed against the unchanged package-lock.json (607 packages).
- Vitest: 86/86 tests across six files passed.
- Astro: 38 files, zero errors, warnings, or hints. Worker TypeScript passed.
- ESLint, production build, source secret scan, and git diff whitespace checks passed.
- Existing Worker deployment dry run passed: correct documented Worker and original ASSETS/DB/ENVIRONMENT bindings. Framework, dependencies, lockfile, Wrangler settings, migrations, Worker entry, origin/verification controls, and delivery adapters remain unchanged.
- The native sample progress element avoids inline style attributes blocked by the existing CSP. Generated CSP hashes change with the content; policy permissions remain unchanged.

## Browser review

Actual Chromium in-app browser checks covered responsive homepage layouts at 360, 390, 768, 1440, and 1920 pixels, plus voice, chat, demo request, contact, privacy, terms, and error-page content. Desktop and mobile screenshots were captured on the SSD and inspected. Meaningful refinement included mobile hero sizing/disclosure, form focus and input readability, result containment, tablet stacking, genuine 3D shell alignment, native progress, and static navigation fallback.

Verified interactions: voice/chat and scenario switching; remodeling, cleaning, and simulated billing results; play/pause/replay and transcript access; mobile menu and Escape behavior; direct route refresh; form required-field validation and focus; reserved example contacts in demo data. No horizontal document overflow was observed at the tested widths. The core HTML and CTA render before the optional Three.js chunk.

Browser emulation permission was declined, so reduced-motion and deliberately disabled-WebGL/browser-JavaScript tests are NOT RUN in the final browser pass. Corresponding fallback paths were reviewed in source; this is not equivalent to browser verification. Physical devices, WebKit, and real-user performance were not tested. LCP, CLS, and INP were not measured; no performance-target claim is made. The existing Three.js dependency remains a deferred 177.02 kB gzip chunk. The application scene chunk is approximately 2.80 kB gzip.

## Conversion

The request form uses the original /api/inquiries Worker/D1 path. A real local Worker with the existing migrations and Cloudflare's documented dummy Turnstile verification passed six HTTP checks: modern minimal request saved, identical retry deduplicated, missing company rejected, invalid website rejected, cross-origin rejected, and missing verification rejected. Local D1 readback confirmed one synthetic row. These are local tests, not production notification proof. See https://developers.cloudflare.com/turnstile/troubleshooting/testing/ for the documented dummy keys; they are never used in the released build.

Only actual backend confirmation produces the saved state. Delivery and storage remain separate. Current release preflight found existing Turnstile and rate-limit secrets, with Google archive/owner notification unconfigured. The verified existing AStarrett@cyberpiratelabs.com inbox is visible as an honest direct-contact fallback. No personal form data is persisted in browser storage or included in public source or screenshots.

## Release evidence

Baseline b8e0a3b1e9f7b6da7e23d3cd8f8b05c0dbaadd33 matched the existing active Worker version e4a4dd76-400c-4197-8aab-8791d1635ed8. Official-domain and workers.dev baseline HTML and social preview bytes matched exactly; www redirected to apex. The existing GitHub main branch permits publication. Actions is disabled and no Actions workflow exists; use the documented manual release process without changing those settings. Final commit/deployed-version/public-website readback is recorded in the private release handoff, not inferred from these checks.
