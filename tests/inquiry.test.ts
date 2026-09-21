import { describe, expect, it } from "vitest";
import { archiveBody } from "../shared/inquiry/google";
import { handleInquiryPost, handleOperator, retryDue } from "../shared/inquiry/http";
import type { InquiryRecord } from "../shared/inquiry/types";
import { neutralizeSpreadsheetFormula, validateInquiry } from "../shared/inquiry/validate";
import { createTestSql } from "./sql";

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

describe("inquiry persistence", () => {
  it("saves once and treats the same submission id as a duplicate", async () => {
    const sql = createTestSql();
    const body = inquiryBody();
    const env = { RATE_LIMIT_SALT: salt, TURNSTILE_SECRET: "secret", GOOGLE_APPS_SCRIPT_URL: "", GOOGLE_HMAC_SECRET: "" };
    const fetchImpl = async () => jsonResponse({ success: true });
    const first = await handleInquiryPost(post(body), sql, env, fetchImpl, 1_000);
    const second = await handleInquiryPost(post(body), sql, env, fetchImpl, 2_000);
    expect(first.status).toBe(201);
    expect(first.json.saved).toBe(true);
    expect(first.json.google).toBe("pending_unconfigured");
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

  it("keeps the lead when Google fails and recovers on a later retry", async () => {
    const sql = createTestSql();
    let calls = 0;
    const fetchImpl = async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("turnstile")) return jsonResponse({ success: true });
      calls += 1;
      if (calls === 1) throw new Error("google down");
      return jsonResponse({ archive: "synced", notification: "sent" });
    };
    const env = {
      RATE_LIMIT_SALT: salt,
      TURNSTILE_SECRET: "secret",
      GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/example/exec",
      GOOGLE_HMAC_SECRET: "hmac-secret-value-123",
    };
    const saved = await handleInquiryPost(post(inquiryBody()), sql, env, fetchImpl, 10_000);
    expect(saved.status).toBe(201);
    expect(saved.json.storage).toBe("saved");
    expect(saved.json.google).toBe("failed");
    expect(saved.json.notification).toBe("failed");
    const tooSoon = await retryDue(sql, env, fetchImpl, 10_500);
    expect(tooSoon).toBe(0);
    expect(calls).toBe(1);
    const retried = await retryDue(sql, env, fetchImpl, 10_000 + 60_000);
    expect(retried).toBe(1);
    const row = await sql.get<{ google_status: string; notify_status: string }>("SELECT google_status, notify_status FROM inquiries");
    expect(row?.google_status).toBe("synced");
    expect(row?.notify_status).toBe("sent");
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
  it("prefixes formula-like names before they leave the worker", () => {
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
    expect(archiveBody(record)).toContain("'=Casey");
  });
});
