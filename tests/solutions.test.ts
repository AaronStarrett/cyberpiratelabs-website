import { describe, expect, it } from "vitest";
import { bundles, demoRequestHref, getBundle, getSolution, solutionGroups, solutions } from "../shared/solutions";
import { validateInquiry } from "../shared/inquiry/validate";

describe("selected solution catalog", () => {
  it("publishes exactly the owner's ten services with stable, unique URLs", () => {
    expect(solutions.map(({ id, name, delivery }) => ({ id, name, delivery }))).toEqual([
      { id: "01", name: "After-Hours Inquiry Capture", delivery: "voice" },
      { id: "02", name: "Sales Call Screening and Transfer", delivery: "voice" },
      { id: "03", name: "Ready-to-Review Quote Requests", delivery: "chat" },
      { id: "04", name: "Website Front Desk", delivery: "chat" },
      { id: "05", name: "Service Selection Assistant", delivery: "chat" },
      { id: "06", name: "New-Customer Welcome Guide", delivery: "chat" },
      { id: "07", name: "Booking Assistance", delivery: "chat" },
      { id: "08", name: "First-Line Troubleshooting", delivery: "chat" },
      { id: "09", name: "Complaint and Feedback Intake", delivery: "chat" },
      { id: "10", name: "Employee Procedure Help Desk", delivery: "chat" },
    ]);
    expect(solutions.map(({ slug }) => slug)).toEqual([
      "after-hours-inquiry-capture",
      "sales-call-screening-and-transfer",
      "ready-to-review-quote-requests",
      "website-front-desk",
      "service-selection-assistant",
      "new-customer-welcome-guide",
      "booking-assistance",
      "first-line-troubleshooting",
      "complaint-and-feedback-intake",
      "employee-procedure-help-desk",
    ]);
    expect(new Set(solutions.map(({ slug }) => slug)).size).toBe(10);
  });

  it.each(solutions)("$name supplies the reusable detail page and an explicitly fictional demonstration", (solution) => {
    for (const field of ["headline", "problem", "benefit", "configuration", "next", "human", "scope"] as const) {
      expect(solution[field].trim(), `${solution.slug}.${field}`).not.toBe("");
    }
    expect(solution.inclusions.length).toBeGreaterThanOrEqual(3);
    expect(solution.inclusions.length).toBeLessThanOrEqual(5);
    expect(solution.inclusions.every((text) => text.trim().length > 0)).toBe(true);
    expect(solution.fit.length).toBeGreaterThan(0);
    expect(solutionGroups.some(({ id }) => id === solution.group)).toBe(true);
    expect(solution.demo.title).toMatch(/^Fictional demo/);
    expect(solution.demo.resultTitle).toMatch(/^Sample /);
    expect(solution.demo.turns.length).toBeGreaterThanOrEqual(2);
    expect(solution.demo.turns.some(({ speaker }) => speaker === "visitor")).toBe(true);
    expect(solution.demo.turns.some(({ speaker }) => speaker === "agent")).toBe(true);
    expect(solution.demo.turns.every(({ text }) => text.trim().length > 0)).toBe(true);
    expect(solution.demo.result.length).toBeGreaterThan(0);
    expect(solution.demo.result.every(({ label, value }) => label.trim() && value.trim())).toBe(true);
    expect(new Set(solution.demo.result.map(({ label }) => label)).size).toBe(solution.demo.result.length);
    expect(solution.demo.next.trim()).not.toBe("");
  });

  it("gives every service a discoverable group and valid related-service links", () => {
    expect(solutionGroups.map(({ id }) => id)).toEqual(["capture", "guide", "care", "team"]);
    for (const group of solutionGroups) {
      expect(group.label.trim()).not.toBe("");
      expect(group.description.trim()).not.toBe("");
      expect(solutions.some((solution) => solution.group === group.id)).toBe(true);
    }
    for (const solution of solutions) {
      expect(solution.relatedSlugs.length).toBeGreaterThan(0);
      expect(new Set(solution.relatedSlugs).size).toBe(solution.relatedSlugs.length);
      for (const slug of solution.relatedSlugs) {
        expect(slug).not.toBe(solution.slug);
        expect(getSolution(slug), `${solution.slug} → ${slug}`).toBeDefined();
      }
    }
  });

  it("collects all six quote-request fields without calculating or issuing a quote", () => {
    const solution = getSolution("ready-to-review-quote-requests")!;
    expect(solution.demo.result.map(({ label }) => label)).toEqual([
      "Project type", "Approximate size", "Location", "Timing", "Budget", "Contact information",
    ]);
    const spoken = solution.demo.turns.map(({ text }) => text).join(" ");
    expect(spoken).toMatch(/size, location, timing, budget, and contact/i);
    expect(solution.configuration).toMatch(/emails the structured request/);
    expect(solution.human).toMatch(/person.*calculates or issues the quote/);
    expect(solution.demo.next).toMatch(/Nothing is emailed and no quote is calculated or issued/);
  });

  it("keeps sales screening to one human number with a visible unanswered fallback", () => {
    const solution = getSolution("sales-call-screening-and-transfer")!;
    expect(solution.configuration).toMatch(/one configured human number/);
    expect(solution.inclusions.join(" ")).toMatch(/If unanswered.*callback details.*email the team/);
    expect(solution.demo.result).toContainEqual({ label: "Transfer step", value: "Simulated attempt · one configured human number · unanswered" });
    expect(solution.demo.result).toContainEqual({ label: "If unanswered", value: "Capture callback details and email the team" });
    expect(solution.demo.result).toContainEqual({ label: "Callback", value: "Casey · +1 202-555-0147" });
    expect(solution.demo.turns[1].text).toMatch(/Simulated transfer to one configured human number: no answer/);
    expect(solution.demo.next).toMatch(/No call is placed or connected/);
  });

  it("leaves booking completion to the customer in the existing system", () => {
    const solution = getSolution("booking-assistance")!;
    expect(solution.next).toMatch(/customer opens the existing booking link.*completes the booking in that system/i);
    expect(solution.demo.result).toContainEqual({ label: "Who completes it", value: "The customer, in the linked booking system" });
    expect(solution.demo.next).toMatch(/no appointment is booked, rescheduled, or cancelled/);
    expect(solution.scope).toMatch(/does not book, reschedule, or cancel appointments autonomously/);
  });

  it("makes the private staff-access boundary visible in both scope and demonstration", () => {
    const solution = getSolution("employee-procedure-help-desk")!;
    expect(solution.configuration).toMatch(/Private material requires verified controlled access/);
    expect(solution.scope).toMatch(/ordinary public widget is not suitable for confidential staff information/);
    expect(solution.scope).toMatch(/No automatic synchronization with public agents/);
    expect(solution.demo.result).toContainEqual({ label: "Source", value: "Fictional opening checklist" });
    expect(solution.demo.result).toContainEqual({ label: "Private deployment", value: "Verified controlled staff access required" });
    expect(solution.demo.next).toMatch(/No private SOPs or customer conversations are accessed/);
  });

  it("retains the service-specific limits and human responsibilities", () => {
    expect(getSolution("after-hours-inquiry-capture")!.scope).toMatch(/No dispatch, guaranteed callback, or confirmed appointment/);
    expect(getSolution("website-front-desk")!.scope).toMatch(/No live account, inventory, availability, or operational lookup/);
    expect(getSolution("service-selection-assistant")!.scope).toMatch(/No checkout, live inventory, or invented personalized pricing/);
    expect(getSolution("new-customer-welcome-guide")!.scope).toMatch(/does not create accounts or verify.*completed a task/);
    const support = getSolution("first-line-troubleshooting")!;
    expect(support.scope).toMatch(/No password resets, remote repairs, or unsupported safety-critical advice/);
    expect(support.next).toMatch(/Availability and response expectations follow your actual support process/);
    expect(getSolution("complaint-and-feedback-intake")!.scope).toMatch(/No automatic refunds, support-system tickets, or guaranteed resolution/);
  });
});

describe("bundle topology and handoffs", () => {
  it.each([
    ["lead-to-next-step", "A", "chat", ["04", "05", "03", "07"]],
    ["phone-front-desk", "B", "voice", ["01", "02"]],
    ["customer-care", "C", "chat", ["06", "08", "09"]],
    ["team-knowledge", "D", "chat", ["10"]],
  ] as const)("%s contains the owner-selected services without mixing entry points", (slug, label, delivery, ids) => {
    const bundle = getBundle(slug)!;
    expect(bundle.label).toBe(label);
    expect(bundle.delivery).toBe(delivery);
    expect(bundle.solutionSlugs.map((item) => getSolution(item)?.id)).toEqual(ids);
    expect(bundle.solutionSlugs.every((item) => getSolution(item)?.delivery === delivery)).toBe(true);
    expect(bundle.steps.length).toBeGreaterThan(0);
    expect(bundle.steps.every(({ title, description }) => title.trim() && description.trim())).toBe(true);
    expect(bundle.branches.length).toBeGreaterThan(0);
    expect(bundle.branches.every(({ title, description, recipient }) => title.trim() && description.trim() && recipient.trim())).toBe(true);
    for (const field of ["name", "headline", "summary", "fit", "scope"] as const) {
      expect(bundle[field].trim(), `${slug}.${field}`).not.toBe("");
    }
  });

  it("has exactly four bundles and reciprocal service-to-bundle links", () => {
    expect(bundles).toHaveLength(4);
    expect(new Set(bundles.map(({ slug }) => slug)).size).toBe(4);
    expect(new Set(bundles.map(({ label }) => label)).size).toBe(4);
    for (const solution of solutions) {
      expect(solution.bundleSlugs.length).toBeGreaterThan(0);
      for (const slug of solution.bundleSlugs) {
        expect(getBundle(slug)?.solutionSlugs).toContain(solution.slug);
      }
    }
    for (const bundle of bundles) {
      expect(new Set(bundle.solutionSlugs).size).toBe(bundle.solutionSlugs.length);
      for (const slug of bundle.solutionSlugs) {
        expect(getSolution(slug)?.bundleSlugs).toContain(bundle.slug);
      }
    }
  });

  it("branches a lead into a quote email OR customer-completed booking", () => {
    const bundle = getBundle("lead-to-next-step")!;
    expect(bundle.steps.at(-1)?.description).toMatch(/quote request OR a booking link.*do not have to complete both/);
    expect(bundle.branches).toHaveLength(2);
    expect(bundle.branches[0].description).toMatch(/email.*staff review.*quote separately/);
    expect(bundle.branches[0].recipient).toMatch(/staff email/);
    expect(bundle.branches[1].description).toMatch(/customer.*completes booking in that system/);
    expect(bundle.branches[1].recipient).toMatch(/^Customer/);
  });

  it("keeps the phone fallback and three care routes distinct from automatic handoffs", () => {
    const phone = getBundle("phone-front-desk")!;
    expect(phone.steps[0].title).toMatch(/inbound/);
    expect(phone.branches[0].description).toMatch(/one configured human number/);
    expect(phone.branches[1].description).toMatch(/unsuitable or unanswered.*email the summary/);
    expect(phone.scope).toMatch(/not an outbound calling campaign/);
    const care = getBundle("customer-care")!;
    expect(care.branches.map(({ title }) => title)).toEqual(["Get started", "Ask for support", "Leave feedback"]);
    expect(care.steps[1].description).toMatch(/one appropriate path.*all three/);
    expect(care.scope).toMatch(/No ticketing-system integration/);
    const team = getBundle("team-knowledge")!;
    expect(team.steps[0].description).toMatch(/verified controlled access/);
    expect(team.scope).toMatch(/No automatic synchronization.*unrestricted access to customer conversations.*agent-to-agent handoff/);
  });
});

describe("demo request links and the existing inquiry contract", () => {
  it.each(solutions)("$name uses a known selection plus the existing delivery interest", (solution) => {
    const url = new URL(demoRequestHref({ solution: solution.slug }), "https://example.com");
    expect(url.pathname).toBe("/demo/");
    expect([...url.searchParams.keys()]).toEqual(["solution", "interest"]);
    expect(url.searchParams.get("solution")).toBe(solution.slug);
    expect(url.searchParams.get("interest")).toBe(solution.delivery);
    const result = validateInquiry({
      name: "Casey Sample", email: "casey@example.com", company: "Fictional Sample Business",
      interest: url.searchParams.get("interest"),
      workflowProblem: `Requested solution: ${solution.name}.`,
      sourcePath: "/demo/",
    });
    expect(result.ok).toBe(true);
    expect(result.value?.workflowProblem).toContain(solution.name);
    expect(result.value?.interest).toBe(solution.delivery);
  });

  it.each(bundles)("$name supplies bundle context without a new inquiry interest", (bundle) => {
    const url = new URL(demoRequestHref({ bundle: bundle.slug }), "https://example.com");
    expect(url.pathname).toBe("/demo/");
    expect([...url.searchParams.keys()]).toEqual(["bundle", "interest"]);
    expect(url.searchParams.get("bundle")).toBe(bundle.slug);
    expect(url.searchParams.get("interest")).toBe(bundle.delivery);
    const result = validateInquiry({
      name: "Casey Sample", email: "casey@example.com", company: "Fictional Sample Business",
      interest: url.searchParams.get("interest"),
      workflowProblem: `Requested bundle: ${bundle.name}.`,
      sourcePath: "/demo/",
    });
    expect(result.ok).toBe(true);
    expect(result.value?.workflowProblem).toContain(bundle.name);
  });

  it("returns no match for unknown slugs and does not forward arbitrary selection values", () => {
    for (const slug of [undefined, null, "", "not-a-service", "../../private", "booking-assistance&interest=both", "https://example.com"]) {
      expect(getSolution(slug)).toBeUndefined();
      expect(getBundle(slug)).toBeUndefined();
      if (slug !== null) {
        expect(demoRequestHref({ solution: slug, bundle: slug })).toBe("/demo/");
      }
    }
    expect(demoRequestHref()).toBe("/demo/");
  });

  it("selects one valid context deterministically and falls back to a valid bundle", () => {
    expect(demoRequestHref({ solution: "booking-assistance", bundle: "phone-front-desk" }))
      .toBe("/demo/?solution=booking-assistance&interest=chat");
    expect(demoRequestHref({ solution: "unknown", bundle: "phone-front-desk" }))
      .toBe("/demo/?bundle=phone-front-desk&interest=voice");
  });
});
