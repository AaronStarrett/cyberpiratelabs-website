import { describe, expect, it } from "vitest";
import { archiveBody } from "../shared/inquiry/google";
import { handleInquiryPost, handleOperator, retryDue } from "../shared/inquiry/http";
import type { InquiryRecord } from "../shared/inquiry/types";
import { AGENT_INTERESTS, LIMITS, neutralizeSpreadsheetFormula, validateInquiry } from "../shared/inquiry/validate";
import { createTestSql } from "./sql";
import { createScriptMock, mockedBridgeFetch, TEST_CUTOFF, TEST_HMAC } from "./apps-script.mock";

const origin = "http://127.0.0.1:43123";
const salt = "test-salt-value-123";
const operator = "operator-token-value-123456";

function inquiryBody(overrides: Record<string, unknown> = {}) {
  return {
    name: "Casey Quinn",
    email: "casey@example.com",
    workflowProblem: "Requests sit in email until someone notices a missing site note.",
    interest: "demonstration",
    submissionId: crypto.randomUUID(),
    turnstileToken: "token",
    marketingConsent: false,
    ...overrides,
  };
}

function post(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request(`${origin}/api/inquiries`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      origin,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "content-type": "application/json" } });
}

describe("form validation", () => {
  it("requires a name, email, and a real description", () => {
    const result = validateInquiry({ name: "", email: "nope", workflowProblem: "too short" });
    expect(result.ok).toBe(false);
    expect(result.errors.name).toBeTruthy();
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.workflowProblem).toBeTruthy();
  });

  it("neutralizes spreadsheet formulas", () => {
    expect(neutralizeSpreadsheetFormula("=cmd")).toBe("'=cmd");
    expect(neutralizeSpreadsheetFormula("normal")).toBe("normal");
  });
});

describe("agent demo request validation", () => {
  const request = {
    name: "Jordan Sample",
    email: "jordan@example.com",
    company: "Example Home Services",
    interest: "not-sure",
    sourcePath: "/demo/",
  };

  it("accepts only the three required details and records that no additional problem was provided", () => {
    const result = validateInquiry(request);
    expect(result.ok).toBe(true);
    expect(result.value?.workflowProblem).toBe("CPL demo requested. Additional details were not provided.");
    expect(result.value?.marketingConsent).toBe(false);
  });

  it.each(AGENT_INTERESTS)("requires a company for a %s demo request", (interest) => {
    const result = validateInquiry({ ...request, interest, company: "" });
    expect(result.ok).toBe(false);
    expect(result.errors.company).toBeTruthy();
  });

  it("accepts a brief optional problem and validates an optional website in the existing tools field", () => {
    const result = validateInquiry({
      ...request,
      workflowProblem: "After-hours questions",
      currentTools: "https://example.com",
      phone: "+1 (555) 010-0142",
    });
    expect(result.ok).toBe(true);
    expect(result.value?.currentTools).toBe("https://example.com");
    expect(result.value?.workflowProblem).toBe("After-hours questions");
  });

  it.each(["javascript:alert(1)", "example.com", "https://user:password@example.com"])("rejects invalid website %s", (currentTools) => {
    const result = validateInquiry({ ...request, currentTools });
    expect(result.ok).toBe(false);
    expect(result.errors.currentTools).toBeTruthy();
  });

  it("bounds optional fields and rejects hidden characters", () => {
    const result = validateInquiry({
      ...request,
      company: "c".repeat(LIMITS.company + 1),
      workflowProblem: "w".repeat(LIMITS.workflowMax + 1),
      phone: "123-4567\u0000",
      currentTools: "https://example.com/" + "w".repeat(LIMITS.tools),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.company).toBeTruthy();
    expect(result.errors.workflowProblem).toBeTruthy();
    expect(result.errors.phone).toBeTruthy();
    expect(result.errors.currentTools).toBeTruthy();
  });

  it("keeps legacy caller fields and required-description rules intact", () => {
    const accepted = validateInquiry(inquiryBody({ currentTools: "Email and spreadsheets" }));
    expect(accepted.ok).toBe(true);
    expect(accepted.value?.company).toBeNull();
    expect(accepted.value?.currentTools).toBe("Email and spreadsheets");
    const missingDescription = validateInquiry(inquiryBody({ workflowProblem: "" }));
    expect(missingDescription.ok).toBe(false);
    expect(missingDescription.errors.workflowProblem).toBeTruthy();
  });
});

describe("inquiry persistence", () => {
  it("stores a minimal agent demo request and reports downstream delivery separately", async () => {
    const sql = createTestSql();
    const body = inquiryBody({
      company: "Example Home Services",
      interest: "both",
      workflowProblem: "",
      currentTools: "https://example.com",
      sourcePath: "/demo/",
    });
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret" };
    const fetchImpl = async () => jsonResponse({ success: true });
    const saved = await handleInquiryPost(post(body), sql, env, fetchImpl, 1_000);
    const retried = await handleInquiryPost(post(body), sql, env, fetchImpl, 2_000);
    expect(saved.status).toBe(201);
    expect(saved.json.saved).toBe(true);
    expect(saved.json.storage).toBe("saved");
    expect(saved.json.google).toBe("disabled");
    expect(saved.json.notification).toBe("pending_unconfigured");
    expect(saved.json.message).toContain("Our notification is delayed");
    expect(retried.json.duplicate).toBe(true);
    expect(retried.json.reference).toBe(saved.json.reference);
    const row = await sql.get<{ company: string; interest: string; current_tools: string; workflow_problem: string }>(
      "SELECT company, interest, current_tools, workflow_problem FROM inquiries",
    );
    expect(row?.company).toBe("Example Home Services");
    expect(row?.interest).toBe("both");
    expect(row?.current_tools).toBe("https://example.com");
    expect(row?.workflow_problem).toBe("CPL demo requested. Additional details were not provided.");
  });

  it("refuses an agent demo without a company before it reaches storage", async () => {
    const sql = createTestSql();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret" };
    const failed = await handleInquiryPost(
      post(inquiryBody({ company: "", interest: "voice", workflowProblem: "" })),
      sql,
      env,
      async () => jsonResponse({ success: true }),
      1_000,
    );
    expect(failed.status).toBe(422);
    expect(failed.json.errors).toHaveProperty("company");
    const count = await sql.get<{ count: number }>("SELECT COUNT(*) AS count FROM inquiries");
    expect(count?.count).toBe(0);
  });
  it("saves once and treats the same submission id as a duplicate", async () => {
    const sql = createTestSql();
    const body = inquiryBody();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret", GOOGLE_APPS_SCRIPT_URL: "", GOOGLE_HMAC_SECRET: "" };
    const fetchImpl = async () => jsonResponse({ success: true });
    const first = await handleInquiryPost(post(body), sql, env, fetchImpl, 1_000);
    const second = await handleInquiryPost(post(body), sql, env, fetchImpl, 2_000);
    expect(first.status).toBe(201);
    expect(first.json.saved).toBe(true);
    expect(first.json.google).toBe("disabled");
    expect(second.status).toBe(200);
    expect(second.json.duplicate).toBe(true);
    expect(second.json.reference).toBe(first.json.reference);
    const count = await sql.get<{ count: number }>("SELECT COUNT(*) AS count FROM inquiries");
    expect(count?.count).toBe(1);
  });

  it("rejects a reused submission id when the payload changes", async () => {
    const sql = createTestSql();
    const body = inquiryBody();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret" };
    const fetchImpl = async () => jsonResponse({ success: true });
    await handleInquiryPost(post(body), sql, env, fetchImpl, 1_000);
    const changed = await handleInquiryPost(
      post({ ...body, workflowProblem: "A different description of the stuck handoff between field notes and invoicing." }),
      sql,
      env,
      fetchImpl,
      2_000,
    );
    expect(changed.status).toBe(409);
  });

  it("does not save a honeypot or a failed verification", async () => {
    const sql = createTestSql();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret" };
    const fetchImpl = async () => jsonResponse({ success: false });
    const honeypot = await handleInquiryPost(post(inquiryBody({ cpl_leave_blank: "http://spam.test" })), sql, env, fetchImpl, 1_000);
    const failed = await handleInquiryPost(post(inquiryBody()), sql, env, fetchImpl, 1_000);
    expect(honeypot.status).toBe(400);
    expect(failed.status).toBe(400);
    const count = await sql.get<{ count: number }>("SELECT COUNT(*) AS count FROM inquiries");
    expect(count?.count).toBe(0);
  });

  it("keeps the saved lead and reconciles a lost response after email was sent without sending twice", async () => {
    const sql = createTestSql();
    const runtime = createScriptMock();
    const bridge = mockedBridgeFetch(runtime);
    let calls = 0;
    const fetchImpl: typeof fetch = async (input, init) => {
      if (String(input).includes("turnstile")) return jsonResponse({ success: true });
      calls += 1;
      const response = await bridge(input, init);
      if (calls === 1) throw new Error("mocked response lost after sent");
      return response;
    };
    const env = {
      RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret",
      GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/example/exec",
      GOOGLE_HMAC_SECRET: TEST_HMAC, NOTIFICATION_ENABLED_AFTER: TEST_CUTOFF,
    };
    const now = Date.now();
    const saved = await handleInquiryPost(post(inquiryBody()), sql, env, fetchImpl, now);
    expect(saved.status).toBe(201);
    expect(saved.json.storage).toBe("saved");
    expect(saved.json.google).toBe("disabled");
    expect(saved.json.notification).toBe("ambiguous");
    expect(runtime.mails).toHaveLength(1);
    expect(await retryDue(sql, env, fetchImpl, now + 500)).toBe(0);
    expect(await retryDue(sql, env, fetchImpl, now + 60_000)).toBe(1);
    const row = await sql.get<{ notify_status: string }>("SELECT notify_status FROM inquiries");
    expect(row?.notify_status).toBe("sent");
    expect(runtime.mails).toHaveLength(1);
  });
  it("lets an operator export and delete, and hides records without a token", async () => {
    const sql = createTestSql();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret", OPERATOR_TOKEN: operator };
    const fetchImpl = async () => jsonResponse({ success: true });
    const saved = await handleInquiryPost(post(inquiryBody({ workflowProblem: "=HYPERLINK(\"http://evil.test\") stuck handoff" })), sql, env, fetchImpl, 5_000);
    const denied = await handleOperator(new Request(`${origin}/api/operator/inquiries`), sql, env, fetchImpl, 5_000);
    expect(denied.status).toBe(401);
    const listed = await handleOperator(
      new Request(`${origin}/api/operator/inquiries`, { headers: { authorization: `Bearer ${operator}` } }),
      sql,
      env,
      fetchImpl,
      5_000,
    );
    expect(listed.status).toBe(200);
    const exported = await handleOperator(
      new Request(`${origin}/api/operator/export`, { headers: { authorization: `Bearer ${operator}` } }),
      sql,
      env,
      fetchImpl,
      5_000,
    );
    expect(exported.html.startsWith("reference")).toBe(true);
    expect(exported.html).toContain("'=HYPERLINK");
    const reference = String(saved.json.reference);
    const removed = await handleOperator(
      new Request(`${origin}/api/operator/inquiries/${reference}`, { method: "DELETE", headers: { authorization: `Bearer ${operator}` } }),
      sql,
      env,
      fetchImpl,
      6_000,
    );
    expect(removed.status).toBe(200);
    const count = await sql.get<{ count: number }>("SELECT COUNT(*) AS count FROM inquiries");
    expect(count?.count).toBe(0);
  });
});

describe("archive payload", () => {
  it("preserves raw values for email and leaves spreadsheet escaping to its adapter", () => {
    const record = {
      id: "1",
      submissionId: "s",
      publicReference: "CPL-TEST",
      createdAt: "2026-09-21T00:00:00.000Z",
      payloadHash: "h",
      name: "=Casey",
      email: "casey@example.com",
      company: null,
      phone: null,
      serviceCategory: null,
      teamSize: null,
      currentTools: null,
      interest: null,
      workflowProblem: "Requests sit in email until someone notices.",
      scenarioInterest: null,
      marketingConsent: false,
      sourcePath: null,
      googleStatus: "pending",
      notifyStatus: "pending",
      googleAttempts: 0,
      notifyAttempts: 0,
      googleNextAt: null,
      notifyNextAt: null,
      googleError: null,
      notifyError: null,
      googleConfirmedAt: null,
      notifyConfirmedAt: null,
    } satisfies InquiryRecord;
    expect(JSON.parse(archiveBody(record)).name).toBe("=Casey");
  });
});
