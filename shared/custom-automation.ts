/** Separate consultation pathway; never append this offer to the ten-service catalogue. */
export const customConsultation = {
  name: "Custom Automation Consultation",
  requestKind: "custom" as const,
  interest: "not-sure" as const,
  context: "I'd like a custom automation consultation for a business process outside the ten core solutions.\n\nCurrent process and where work gets stuck: ",
};
export const customConsultationHref = "/demo/?consultation=custom-automation&interest=not-sure";

export const customAutomationSteps = [
  { title: "Assess the process", text: "Map the current steps, systems, people and exceptions. Understand where repeated work gets stuck." },
  { title: "Define the outcome", text: "Agree what useful output or change the software should deliver, how to assess it and who owns the next decision." },
  { title: "Check feasibility", text: "Review available APIs, authorized access, data quality, security needs and technical constraints." },
  { title: "Approve the scope", text: "Agree deliverables, boundaries, budget, timeline and acceptance checks before implementation begins." },
  { title: "Build and test", text: "Develop the approved workflow and test normal cases, failures, exceptions and any required human approvals." },
  { title: "Launch and support", text: "Verify the agreed behavior, hand over the working process and establish the approved support and maintenance scope." },
];
export const customAutomationFaqs = [
  { q: "How is custom automation different from the ten core solutions?", a: "The ten core solutions address defined inquiry, guidance, customer-care and staff needs. Custom automation is a separate discovery and implementation pathway for a different business process. It is not an eleventh catalog service or an automatic extension of a core package." },
  { q: "Can every business process be automated?", a: "Feasibility depends on the process, available APIs, authorized access, data, security and practical constraints. We may recommend a smaller scope, retain a human step or identify that a proposed approach is unsuitable. A consultation is an assessment, not a guarantee that any requested automation can be delivered." },
  { q: "Does a custom workflow have to use AI?", a: "No. CPL is platform and tech-stack agnostic. We choose software and integrations around your needs, existing systems and the agreed scope. AI is used where appropriate. Supported APIs, authorized access and technical feasibility determine the proposed implementation." },
  { q: "What should I bring to a consultation?", a: "Describe the repeated process, the tools your team uses, where work gets stuck and the outcome you want. An approximate volume and common exceptions help. Do not send passwords, payment details or sensitive customer records through this public form." },
  { q: "How are price, timing and ongoing support agreed?", a: "We establish an approved scope, budget, timeline, acceptance checks and support arrangements before implementation. No standard price, fixed completion date, universal integration coverage or unlimited support is promised by this website." },
];
