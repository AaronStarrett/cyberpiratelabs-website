import { describe, expect, it } from "vitest";
import { businessProblems, demoSelection, matchingSolutions } from "../shared/solution-selection";
import { bundles, demoRequestHref, solutions } from "../shared/solutions";
import { customConsultation, customConsultationHref } from "../shared/custom-automation";
import { AGENT_INTERESTS, validateInquiry } from "../shared/inquiry/validate";

describe("problem selection and existing inquiry contract", () => {
  it("keeps the entire catalogue discoverable without a selected problem", () => {
    expect(matchingSolutions("all")).toEqual(solutions);
    expect(matchingSolutions("unknown")).toEqual(solutions);
  });
  it.each(businessProblems)("offers the relevant services for $id", problem => {
    expect(matchingSolutions(problem.id).map(item => item.id)).toEqual([...problem.solutions]);
    expect(matchingSolutions(problem.id).length).toBeGreaterThan(0);
  });
  it.each(solutions)("preserves the inquiry payload for $name", solution => {
    const url = new URL(demoRequestHref({solution:solution.slug}), "https://example.invalid");
    const selected = demoSelection(url.searchParams)!;
    expect(AGENT_INTERESTS).toContain(selected.interest);
    expect(selected.context).toContain(solution.name);
    expect(selected.context).toContain(solution.problem);
    const result = validateInquiry({name:"Fictional QA",email:"qa@example.invalid",company:"Fictional Company",interest:selected.interest,workflowProblem:selected.context,sourcePath:"/demo/"});
    expect(result.ok).toBe(true);
    expect(result.value?.workflowProblem).toBe(selected.context.trim());
  });
  it.each(bundles)("preserves the inquiry payload for the $name bundle", bundle => {
    const selected = demoSelection(new URL(demoRequestHref({bundle:bundle.slug}), "https://example.invalid").searchParams)!;
    expect(selected.name).toBe(bundle.name);
    expect(selected.interest).toBe(bundle.delivery);
    expect(validateInquiry({name:"Fictional QA",email:"qa@example.invalid",company:"Fictional Company",interest:selected.interest,workflowProblem:selected.context}).ok).toBe(true);
  });
  it("ignores unknown or injected URL selections", () => {
    expect(demoSelection(new URLSearchParams({solution:"<script>alert(1)</script>",bundle:"made-up"}))).toBeNull();
    expect(demoSelection(new URLSearchParams({interest:"voice"}))).toBeNull();
  });
  it("uses an allowlisted solution before a bundle when both are supplied", () => {
    const selected = demoSelection(new URLSearchParams({solution:solutions[0].slug,bundle:bundles[0].slug}));
    expect(selected?.name).toBe(solutions[0].name);
  });
  it("rejects a solution slug masquerading as an inquiry interest", () => {
    expect(validateInquiry({name:"Fictional QA",email:"qa@example.invalid",company:"Fictional Company",interest:solutions[0].slug,workflowProblem:"A demonstration request"}).ok).toBe(false);
  });
});


describe("custom consultation within the existing inquiry contract", () => {
  it("sends the allowlisted consultation context through existing fields", () => {
    const url = new URL(customConsultationHref, "https://example.invalid");
    expect(url.pathname).toBe("/demo/");
    const selection = demoSelection(url.searchParams)!;
    expect(selection).toEqual(customConsultation);
    const result = validateInquiry({ name: "Fictional QA", email: "qa@example.invalid", company: "Fictional Company", interest: selection.interest, workflowProblem: selection.context, sourcePath: url.pathname });
    expect(result.ok).toBe(true);
    expect(result.value?.interest).toBe("not-sure");
    expect(result.value?.sourcePath).toBe("/demo/");
    expect(result.value?.workflowProblem).toContain("custom automation consultation");
    expect(result.value).not.toHaveProperty("consultation");
    expect(solutions).toHaveLength(10);
  });
  it.each(["made-up", "<script>alert(1)</script>"])("does not copy unknown consultation value %s into the request", value => {
    expect(demoSelection(new URLSearchParams({ consultation: value, interest: "not-sure" }))).toBeNull();
  });
  it.each([
    { query: { solution: solutions[0].slug, consultation: "custom-automation" }, expected: solutions[0].name },
    { query: { bundle: bundles[0].slug, consultation: "custom-automation" }, expected: bundles[0].name },
  ])("keeps an existing core selection when a consultation key is also present", ({ query, expected }) => {
    expect(demoSelection(new URLSearchParams(query))?.name).toBe(expected);
  });
});
