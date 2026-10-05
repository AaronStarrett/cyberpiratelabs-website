import { solutions } from "../solutions";
import type { AgentBeat, AgentMessage, AgentScenario, Capture } from "./fixtures";

const comparable = (text: string) => text.normalize("NFKC").toLocaleLowerCase("en-US")
  .replace(/[^\p{L}\p{N}]+/gu, " ").trim();

// Authored reveal timing for summarized fields, keyed by the catalog's field labels.
// A turn index is the point where that fictional conversation supplies the detail.
const resultTurns: Record<string, Record<string, number>> = {
  "after-hours-inquiry-capture": { Request: 0, "Size / location": 2, Timing: 2, Callback: 2 },
  "sales-call-screening-and-transfer": { Service: 0, Location: 0, "Transfer step": 1, "If unanswered": 3, Callback: 2 },
  "ready-to-review-quote-requests": { "Project type": 2, "Approximate size": 2, Location: 2, Timing: 2, Budget: 2, "Contact information": 2 },
  "website-front-desk": { "Service area": 1, "Office hours": 1, "Next page": 3 },
  "service-selection-assistant": { Regular: 1, Deep: 1, "Move-out": 2, "Suggested next page": 3 },
  "new-customer-welcome-guide": { Bring: 1, "Prepare if available": 1, "Ask a person": 3 },
  "booking-assistance": { "Appointment type": 1, Destination: 3, "Who completes it": 3 },
  "first-line-troubleshooting": { Issue: 0, "Steps tried": 2, Status: 2, "Next step": 3 },
  "complaint-and-feedback-intake": { Issue: 2, Contact: 2, "Desired resolution": 2, Recipient: 3 },
  "employee-procedure-help-desk": { Source: 1, Steps: 1, Exception: 3, "Private deployment": 3 },
};

/** Start with a complete exchange, then allow time to read each answer and its result. */
function solutionBeats(messages: AgentMessage[]): AgentBeat[] {
  const beats: AgentBeat[] = [];
  let from = 0;
  while (from < messages.length) {
    const through = Math.min(from === 0 ? 1 : from, messages.length - 1);
    const group = messages.slice(from, through + 1);
    const words = group.reduce((count, message) => count + message.text.split(/\s+/).length, 0);
    const final = through === messages.length - 1;
    beats.push({
      through,
      duration: Math.max(3000, Math.min(7000, Math.ceil(words * 180 / 500) * 500)),
      label: final ? "A useful result and a clear next step"
        : from === 0 ? "The request becomes clear"
        : group.some((message) => message.capture?.length) ? "Useful details join the sample result"
        : "The approved response guides the conversation",
    });
    from = through + 1;
  }
  return beats;
}

/**
 * These are authored examples derived from the service catalog, not extraction or AI.
 * Captures arrive with their authored source turn. Unmapped summaries wait until the
 * final turn, when the complete fictional exchange has been presented.
 */
export const solutionAgentScenarios: AgentScenario[] = solutions.map((solution) => {
  const messages: AgentMessage[] = solution.demo.turns.map((turn) => ({ ...turn, capture: [] }));
  const result: Capture[] = solution.demo.result.map((field, index) => ({
    ...field, key: `result-${index}`,
  }));
  const last = messages.length - 1;
  for (const field of result) {
    const value = comparable(field.value);
    const exactIndex = messages.findIndex((message) => value.length > 0 && comparable(message.text).includes(value));
    const evidenceIndex = resultTurns[solution.slug]?.[field.label] ?? (exactIndex >= 0 ? exactIndex : last);
    messages[Math.min(evidenceIndex, last)]!.capture!.push(field);
  }
  messages[last]!.capture!.push({ key: "next", label: "Next step", value: solution.demo.next });

  const internal = solution.slug === "employee-procedure-help-desk";
  return {
    id: `solution:${solution.slug}`,
    label: solution.name,
    business: internal ? "Sample staff workspace" : "Sample business",
    initials: internal ? "ST" : "SB",
    setting: solution.demo.title,
    kind: "inquiry",
    approvedInformation: internal
      ? "A fictional, approved procedure is the only source for this staff example. Real private material requires verified controlled access."
      : "Only the service details supplied in this fictional example are available. There is no live customer, account, booking, or operational connection.",
    delivery: solution.delivery,
    // One authored script, bound to its actual delivery. No simulated channel switching.
    stories: { voice: messages, chat: messages },
    beats: solutionBeats(messages),
    solution: {
      slug: solution.slug,
      title: solution.demo.title,
      resultTitle: solution.demo.resultTitle,
      result,
      next: solution.demo.next,
      ...(internal ? {
        accessNote: "Staff-only configuration: private procedures require verified controlled access. This public demonstration uses fictional material only.",
      } : {}),
    },
  };
});

export function getSolutionAgentScenario(slug: string | undefined): AgentScenario | undefined {
  return slug ? solutionAgentScenarios.find((scenario) => scenario.solution?.slug === slug) : undefined;
}
