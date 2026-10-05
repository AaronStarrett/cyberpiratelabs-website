# Capability boundaries

This document describes the ten-solution/four-bundle marketing implementation in the local review preview. It does not claim a new production deployment. Source implementation, synthetic tests, live deployment, provider acceptance, and a customer's commissioned service are separate evidence states. Actual checks are recorded in [verification](verification.md).

| Capability | Current boundary | Source |
| --- | --- | --- |
| Solution catalog and detail pages | Ten data-driven services with stable URLs, problem/outcome copy, practical inclusions, fictional samples, human responsibility, scope, and relevant links | `shared/solutions.ts`, `src/pages/solutions/`, `src/components/SolutionDetail.astro` |
| Problem selector | Accessible homepage filtering with a visible next step; all ten cards are prerendered and discoverable without using the selector | `shared/solution-selection.ts`, `src/components/ProblemFinder.astro` |
| Four bundle workflows | Lead to Next Step branches to quote email OR customer-completed booking; Phone Front Desk transfers to one number OR captures a message; Customer Care has three possible needs; Team Knowledge is a separate staff companion | `shared/solutions.ts`, `src/components/BundleFlow.astro` |
| Voice/chat service pages | Describes CPL’s configuration, implementation, connections, testing, and ongoing management; commercial scope is discussed separately | `src/pages/voice-agents.astro`, `chat-agents.astro` |
| Voice/chat walkthrough | Implemented local, fixed transcript examples; no live AI, audio, microphone, calls, or Stammer requests | `src/islands/AgentExperience.tsx` |
| Fictional scenarios | Ten catalog-derived focused samples, locked to their actual delivery, plus the four retained general examples: remodeling, cleaning, maintenance, and billing handoff | `shared/solutions.ts`, `shared/agents/solution-scenarios.ts`, `shared/agents/fixtures.ts` |
| Organized sample result | Authored fields appear with their source turn; unmapped summaries wait for matching text or the final turn. No result establishes a real send, call connection, quote, booking, or completed staff task | `shared/agents/solution-scenarios.ts`, `shared/agents/experience.ts` |
| 3D scene | Optional progressively loaded geometry, lighting, materials, and camera perspective; readable HTML remains available | `src/islands/stage/createAgentStage.ts` |
| Reduced-motion/WebGL fallback | Stable HTML composition and transcript; browser verification is reported separately | `AgentExperience.tsx`, `agent-experience.css` |
| Real demonstration request | Uses the existing same-origin Worker endpoint, Turnstile, D1 persistence/readback, and duplicate protection when configured | `src/components/InquiryForm.astro`, `shared/inquiry/` |
| Selected solution/bundle request | Known query values prefill readable context in existing `workflowProblem` and existing `voice`/`chat` interest; no new schema or service-slug interest | `shared/solution-selection.ts`, `src/components/InquiryForm.astro` |
| Request confirmation | A saved reference establishes site storage; it does not book a meeting or establish notification arrival | `shared/inquiry/http.ts` |
| Google archive and business notification | Preserves `bb2366d`: email independent of optional archive, HMAC verification, cutoff/backlog controls, durable send ledger, held/ambiguous states, and bounded retries. Possible unconfigured states do not establish current production configuration | `shared/inquiry/google.ts`, `shared/inquiry/http.ts` |
| Direct business contact | Existing public email fallback: `AStarrett@cyberpiratelabs.com`; a mailto link is not evidence of mailbox delivery | `InquiryForm.astro`, `src/pages/contact.astro` |
| Live CPL customer agent | Not connected to this website walkthrough and not established by this repository; Stammer AI is the selected underlying service platform | Service-page disclosures |
| Phone screening and transfer | Inbound qualification with one configured human number and an unanswered-call message/email fallback; no complex departmental routing, outbound campaign, dispatch, or guaranteed callback | `shared/solutions.ts` |
| Quote-request capture | Collects project type, approximate size, location, timing, budget, and contact details for staff review; does not calculate or issue the quote | `shared/solutions.ts` |
| Booking Assistance | Explains appointments and supplies the existing booking link; the customer completes booking there. No autonomous booking, rescheduling, or cancellation | `shared/solutions.ts`, `src/pages/chat-agents.astro`, `shared/site.ts` |
| Staff procedure help | Answers from approved SOPs/training; private material requires verified controlled access. Public samples use invented content, not confidential procedures or customer conversations | `shared/solutions.ts`, `shared/agents/solution-scenarios.ts` |
| Cross-service connections | Voice/chat are separate entry points; email, customer-clicked links, and human actions are explicit. No shared memory, CRM/SMS synchronization, or automatic agent-to-agent handoff is implied | Bundle scopes in `shared/solutions.ts` |
| Prices, usage, support, delivery timing | No standard price, unlimited allowance, guaranteed result, or fixed contractual commitment is published | Request page and FAQ |
| Privacy and terms | Existing factual website disclosures and draft/owner-review notices are retained; no legal or security certification is claimed | `src/pages/privacy.astro`, `terms.astro` |

The public experience is labeled **Illustrative demo · Fictional business · Sample data** near its controls and result. Simulated follow-up does not send a lead to a person or suggest someone has joined the conversation.

Retired Command Center marketing sources are preserved in the repository but are not imported by current public routes. Historical source and tests do not advertise that separate application or imply customer availability. The old `shared/capability.ts` is retained history; current service boundaries are expressed by the active pages, FAQ, and this document.
