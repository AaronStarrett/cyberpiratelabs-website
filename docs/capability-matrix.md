# Capability matrix

Reviewed against the public repository [AaronStarrett/CPL-Command-Center-Public](https://github.com/AaronStarrett/CPL-Command-Center-Public/tree/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c) at commit `26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c` on 2026-09-21 America/New_York. Public source was read through the GitHub API; the product application was not changed, run, or deployed. No private repository was read.

The current [README](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/README.md) describes a development checkpoint with a bounded hosted slice: Google identity, sessions, passkeys, organization membership, manually entered leads and proposal drafts, and a durable preparation job. Complete live owner acceptance remains unfinished. Legacy demonstration workflows require isolated test mode; live connectors, customer communications, and general availability are not established.

The [deployment record](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/docs/PUBLIC_DEPLOYMENT.md) records an earlier acceptance deployment with anonymous HTTPS checks, a free-plan CPU blocker, and an unsuccessful owner Google callback. Later source changes still require deployed acceptance. Those are the product's documented outcomes, not live checks performed by this website task.

| Capability | Status | Why |
| --- | --- | --- |
| This website and the sample walkthrough | On this website | Built here. The walkthrough does not call the application. |
| Hosted Command Center for customers | In development | A bounded hosted identity/lead/proposal slice is implemented. Complete live owner acceptance remains blocked. |
| Lead intake and information check | In development | Hosted manual lead entry exists. Intake and information checks are runtime-backed in the isolated guided scenario; live source extraction is not verified. |
| Proposal draft and human review | In development | Hosted manual proposal drafts and versioned preparation exist. The isolated commercial workflow has review states; its production catalog remains unconfigured and acceptance is not executable. |
| Customer acceptance and e-signature | Planned | The public scenario marks customer decision as not connected. |
| Project setup from an awarded job | Planned | Marked deferred in the public guided scenario. |
| Inspection, validation, report assembly, technical and executive review | In development | Runtime-backed in the isolated public guided scenario. Hosted execution of the legacy operational workflow is not activated. |
| Customer delivery of a report | In development | The public scenario uses a local test adapter and does not send externally. |
| Invoice readiness and accounting | Planned | Billing is a demonstration stage. Accounting is not connected. |
| Scheduling and field updates | In development | Scheduler routes exist. Hosted behavior was not exercised for this site. |
| Per-company workflow configuration | In development | Tenant settings, catalogs, and templates persist. Adoption by the legacy commercial engine and complete hosted acceptance are not established. |
| Live integrations | Needs a discussion | Public defaults are mock or unavailable providers. CRM, accounting, and field tools are not replaced. |
| Product login | In development | Google identity, sessions, and passkeys are implemented. Successful live owner sign-in and physical-device acceptance remain unverified. |

The interactive homepage and `/demo/` walkthrough follow the single fictional HA-1044 assessment request. Lower-page examples explain how similar workflows could fit field service and recurring property care; they are illustrative fit examples, not additional interactive scenarios or separate verified products.

The homepage film uses the fictional HA-1044 request. Its source extraction, audience views, award, field update, and report interactions change deterministic website sample state. The award-to-project transition is labeled planned at the relevant point; a sample internal review is not real customer acceptance. Field observations and illustrative images remain sample content. Report delivery, if displayed, is simulated.

Supporting source: [guided workflow stages and truth labels](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/packages/domain/src/guided-demo.ts#L184), [hosted workflow implementation](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/packages/database/src/hosted-workflow.ts#L189), [commercial acceptance boundary](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/packages/domain/src/commercial.ts#L12), and [integration defaults](https://github.com/AaronStarrett/CPL-Command-Center-Public/blob/26e56aea4fe74cbed65bdeb3f9e7cc4f4391bf7c/packages/integrations/src/defaults.ts#L7).

The capability table is generated from `shared/capability.ts`. Keep the two in agreement. The film retains the label “Interactive product preview · Sample data” and the site's early-access status.
