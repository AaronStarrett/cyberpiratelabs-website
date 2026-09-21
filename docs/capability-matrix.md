# Capability matrix

Reviewed against the public repository [AaronStarrett/CPL-Command-Center-Public](https://github.com/AaronStarrett/CPL-Command-Center-Public) at commit `25d294c8743a938466a6b8faf769f13f3c30a700` on 2026-09-21. That checkout was not modified. No private repository was read.

The public README describes a development checkpoint. The production entry is empty setup, and customer operations, hosted authentication, live connectors, and deployment acceptance are not activated. This website repeats that boundary.

| Capability | Status | Why |
| --- | --- | --- |
| This website and the sample walkthrough | On this website | Built here. The walkthrough does not call the application. |
| Hosted Command Center for customers | In development | Public deployment notes say deployment acceptance was not run. |
| Lead intake and information check | In development | Present as runtime-backed stages in the public guided scenario. Not a live service here. |
| Proposal draft and human review | In development | Review states exist. The production catalog is unconfigured. Acceptance is not executable. |
| Customer acceptance and e-signature | Planned | The public scenario marks customer decision as not connected. |
| Project setup from an awarded job | Planned | Marked deferred in the public guided scenario. |
| Inspection, validation, report assembly, technical and executive review | In development | Runtime-backed in the public scenario. Still behind the production gate. |
| Customer delivery of a report | In development | The public scenario uses a local test adapter and does not send externally. |
| Invoice readiness and accounting | Planned | Billing is a demonstration stage. Accounting is not connected. |
| Scheduling and field updates | In development | Scheduler routes exist. Hosted behavior was not exercised for this site. |
| Per-company workflow configuration | In development | Settings and templates exist. Onboarding routes are blocked in the public foundation notes. |
| Live integrations | Needs a discussion | Public defaults are mock or unavailable providers. CRM, accounting, and field tools are not replaced. |
| Product login | Planned | No verified public app URL. Hosted identity is a documented blocker. |

Field service and recurring property care on `/demo/` are illustrative website scenarios. They are not separate verified products in the public source.

The homepage table is generated from `shared/capability.ts`. Keep the two in agreement.
