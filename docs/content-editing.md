# Content editing

## Pages

- Homepage: `src/pages/index.astro`, with workflow, use cases, and FAQ copy in `shared/site.ts`.
- Walkthrough shell: `src/pages/demo.astro`. Step text: `shared/demo/scenarios.ts`.
- Contact labels: `src/pages/contact.astro`. Field rules: `shared/inquiry/validate.ts`.
- Privacy and terms: `src/pages/privacy.astro` and `src/pages/terms.astro`. Both are flagged for owner review. If storage behavior changes, update privacy in the same change.

## Capability claims

`shared/capability.ts` is the public boundary. Homepage status labels are rendered from it. Do not describe a feature as available unless its status is `on-this-website`.

The walkthrough must keep the banner “Interactive walkthrough · Sample data”. Evidence on each step is `development-source`, `illustrative`, or `planned`.

## Logo

`public/brand/cpl-logo.png` is the approved mark. Do not redraw, recolor, or recompress it. Icons and the social image are resized copies made by `scripts/generate-icons.mjs`.

## Sample data

Companies, people, sites, and notes in the scenarios are synthetic. Do not replace them with customer records.
