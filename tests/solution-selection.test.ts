import { describe, expect, it } from "vitest";
import { businessProblems, demoSelection, matchingSolutions } from "../shared/solution-selection";
import { bundles, demoRequestHref, solutions } from "../shared/solutions";
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
