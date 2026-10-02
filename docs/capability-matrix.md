# Capability boundaries

This document describes the current voice/chat marketing implementation. Source implementation, synthetic tests, live deployment, provider acceptance, and a customer’s commissioned service are separate evidence states. Actual checks are recorded in [verification](verification.md).

| Capability | Current boundary | Source |
| --- | --- | --- |
| Voice/chat service pages | Describes CPL’s configuration, implementation, connections, testing, and ongoing management; commercial scope is discussed separately | `src/pages/voice-agents.astro`, `chat-agents.astro` |
| Voice/chat walkthrough | Implemented local, fixed transcript examples; no live AI, audio, microphone, calls, or Stammer requests | `src/islands/AgentExperience.tsx` |
| Fictional scenarios | Remodeling, recurring cleaning, routine home maintenance, and simulated billing handoff; reserved sample identities/contact data | `shared/agents/fixtures.ts` |
| Organized sample inquiry | Derived only from messages already reached; next step is simulated team review/follow-up | `shared/agents/experience.ts` |
| 3D scene | Optional progressively loaded geometry, lighting, materials, and camera perspective; readable HTML remains available | `src/islands/stage/createAgentStage.ts` |
| Reduced-motion/WebGL fallback | Stable HTML composition and transcript; browser verification is reported separately | `AgentExperience.tsx`, `agent-experience.css` |
| Real demonstration request | Uses the existing same-origin Worker endpoint, Turnstile, D1 persistence/readback, and duplicate protection when configured | `src/components/InquiryForm.astro`, `shared/inquiry/` |
| Request confirmation | A saved reference establishes site storage; it does not book a meeting or establish notification arrival | `shared/inquiry/http.ts` |
| Google archive and business notification | Separate configured delivery step with explicit pending, unconfigured, success, or failure status; runtime configuration and live acceptance require their own evidence | `shared/inquiry/google.ts` |
| Direct business contact | Existing public email fallback: `AStarrett@cyberpiratelabs.com`; a mailto link is not evidence of mailbox delivery | `InquiryForm.astro`, `src/pages/contact.astro` |
| Live CPL customer agent | Not connected to this website walkthrough and not established by this repository; Stammer AI is the selected underlying service platform | Service-page disclosures |
| Phone setup, transfers, recording, integrations | Assessed, agreed, configured, and tested for the specific implementation; universal compatibility and active recording are not assumed | Service pages and FAQ |
| Booking | A booking link and creation of an appointment are distinct; a connected system must confirm a real booking | `src/pages/chat-agents.astro`, `shared/site.ts` |
| Prices, usage, support, delivery timing | No standard price, unlimited allowance, guaranteed result, or fixed contractual commitment is published | Request page and FAQ |
| Privacy and terms | Existing factual website disclosures and draft/owner-review notices are retained; no legal or security certification is claimed | `src/pages/privacy.astro`, `terms.astro` |

The public experience is labeled **Illustrative demo · Fictional business · Sample data** near its controls and result. Simulated follow-up does not send a lead to a person or suggest someone has joined the conversation.

Retired Command Center marketing sources are preserved in the repository but are not imported by current public routes. Historical source and tests do not advertise that separate application or imply customer availability. The old `shared/capability.ts` is retained history; current service boundaries are expressed by the active pages, FAQ, and this document.
