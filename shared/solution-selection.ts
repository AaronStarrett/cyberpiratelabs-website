import { bundles, solutions } from "./solutions";
import { customConsultation } from "./custom-automation";

export const businessProblems = [
  { id: "missed", label: "We miss inquiries when we’re busy or closed", solutions: ["01", "02"] },
  { id: "questions", label: "Our team answers the same questions repeatedly", solutions: ["04", "08"] },
  { id: "quotes", label: "Quote requests arrive without enough information", solutions: ["03"] },
  { id: "choosing", label: "Customers need help choosing or booking", solutions: ["05", "07"] },
  { id: "welcome", label: "New customers need clearer guidance", solutions: ["06", "08", "09"] },
  { id: "procedures", label: "Staff need easier access to procedures", solutions: ["10"] },
] as const;

export function matchingSolutions(problem: string) {
  const selected = businessProblems.find(item => item.id === problem);
  return selected ? solutions.filter(item => (selected.solutions as readonly string[]).includes(item.id)) : solutions;
}

/** Only known catalogue selections enter the existing inquiry text field. */
export function demoSelection(params: URLSearchParams) {
  const solution = solutions.find(item => item.slug === params.get("solution"));
  if (solution) return {
    name: solution.name,
    interest: solution.delivery,
    context: `I'd like a demonstration of ${solution.name} (${solution.delivery === "voice" ? "Voice" : "Chat"}).\nBusiness problem: ${solution.problem}\n\nMy business context: `,
  };
  const bundle = bundles.find(item => item.slug === params.get("bundle"));
  if (bundle) return {
    name: bundle.name,
    interest: bundle.delivery,
    context: `I'd like a demonstration of the ${bundle.name} bundle.\nSolutions: ${bundle.solutionSlugs.map(slug => solutions.find(item => item.slug === slug)?.name).join(", ")}.\n\nMy business context: `,
  };
  if (params.get("consultation") === "custom-automation") return customConsultation;
  return null;
}
