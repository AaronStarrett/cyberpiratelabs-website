# Content editing

## Pages

- Homepage scene and controls: `src/islands/ProductStage.tsx`. Chapter captions: `shared/demo/chapters.ts`.
- Homepage contact and FAQ: `src/pages/index.astro`. FAQ copy: `shared/site.ts`.
- Demo page: `src/pages/demo.astro`. Step text: `shared/demo/scenarios.ts`. Capability notes render here.
- Contact form: `src/components/InquiryForm.astro`. Field rules: `shared/inquiry/validate.ts`.
- Privacy and terms: `src/pages/privacy.astro` and `src/pages/terms.astro`. Both are flagged for owner review. If storage behavior changes, update privacy in the same change.

## Capability claims

`shared/capability.ts` is the public boundary. The demo page renders it. Do not describe a feature as available unless its status is `on-this-website`.

The stage keeps the line “Interactive product preview · Sample data”. Evidence on each step is `development-source`, `illustrative`, or `planned`.

## Logo

`public/brand/cpl-logo.png` is the approved mark. Do not redraw, recolor, or recompress it. Icons and the social image are resized copies made by `scripts/generate-icons.mjs`.

## Sample data

Companies, people, sites, and notes in the scenarios are synthetic. Do not replace them with customer records.
