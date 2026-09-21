import { deliverInquiry } from "./google";
import { bumpRateLimit, deleteInquiry, findBySubmissionId, findInquiry, insertInquiry, listDueInquiries, listInquiries, updateDelivery } from "./repository";
import { newId, publicReference, sha256Hex, timingSafeEqual } from "./sign";
import type { GoogleEnv } from "./google";
import type { InquiryRecord, Sql } from "./types";
import { canonicalPayload, escapeHtml, neutralizeSpreadsheetFormula, validateInquiry } from "./validate";
import type { InquiryInput } from "./validate";

export type InquiryEnv = GoogleEnv & {
  ENVIRONMENT?: string;
  TURNSTILE_SECRET?: string;
  OPERATOR_TOKEN?: string;
  ALLOWED_ORIGINS?: string;
  RATE_LIMIT_SALT?: string;
};

export type HandlerResult = {
  status: number;
  json: Record<string, unknown>;
  html: string;
};

const IP_LIMIT = 8;
const EMAIL_LIMIT = 4;

function jsonResult(status: number, json: Record<string, unknown>, html?: string): HandlerResult {
  return { status, json, html: html ?? renderMessage(status, json) };
}

function renderMessage(status: number, json: Record<string, unknown>): string {
  const title = status < 300 ? "Inquiry saved" : "Inquiry not saved";
  const detail = typeof json.message === "string" ? json.message : title;
  const reference = typeof json.reference === "string" ? `<p>Reference <strong>${escapeHtml(json.reference)}</strong></p>` : "";
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>${title}</title><body><main><h1>${title}</h1><p>${escapeHtml(detail)}</p>${reference}<p><a href="/contact/">Return to the form</a></p></main></body></html>`;
}

export function originAllowed(requestUrl: string, origin: string | null, allowList: string): boolean {
  if (!origin) return false;
  try {
    const request = new URL(requestUrl);
    const source = new URL(origin);
    if (source.origin === request.origin) return true;
    return allowList.split(",").map((item) => item.trim()).filter(Boolean).includes(source.origin);
  } catch {
    return false;
  }
}

async function readBody(request: Request): Promise<{ raw: Record<string, unknown>; contentType: string } | null> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const raw = (await request.json()) as Record<string, unknown>;
      return raw && typeof raw === "object" ? { raw, contentType } : null;
    } catch {
      return null;
    }
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const raw: Record<string, unknown> = {};
    for (const [key, value] of form.entries()) {
      if (typeof value === "string") raw[key] = value;
    }
    return { raw, contentType };
  }
  return null;
}

export async function defaultVerifyTurnstile(token: string, ip: string | null, secret: string, fetchImpl: typeof fetch): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);
  const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
  });
  if (!response.ok) return false;
  const parsed = (await response.json()) as { success?: boolean };
  return parsed.success === true;
}

function clientIp(request: Request): string | null {
  const header = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for");
  return header?.split(",")[0]?.trim() || null;
}

export function savedMessage(record: InquiryRecord): string {
  const stored = `Saved. Reference ${record.publicReference}. This does not reserve a meeting or promise a response time.`;
  if (record.googleStatus === "synced" && record.notifyStatus === "sent") {
    return `${stored} The owner archive and notification steps reported success.`;
  }
  if (record.googleStatus === "pending_unconfigured" || record.notifyStatus === "pending_unconfigured") {
    return `${stored} Site storage succeeded. Google archive and owner notification are not configured on this deployment, so those steps stay pending.`;
  }
  return `${stored} Site storage succeeded. Owner delivery is still pending and will be retried.`;
}

export async function handleInquiryPost(
  request: Request,
  sql: Sql,
  env: InquiryEnv,
  fetchImpl: typeof fetch,
  now = Date.now(),
): Promise<HandlerResult> {
  if (request.method !== "POST") return jsonResult(405, { ok: false, message: "Use POST." });
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > 20_000) return jsonResult(413, { ok: false, message: "The submission is too large." });
  const secFetch = request.headers.get("sec-fetch-site");
  if (secFetch && secFetch !== "same-origin" && secFetch !== "none") {
    return jsonResult(403, { ok: false, message: "This form only accepts same-origin submissions." });
  }
  if (!originAllowed(request.url, request.headers.get("origin"), env.ALLOWED_ORIGINS ?? "")) {
    return jsonResult(403, { ok: false, message: "This form only accepts same-origin submissions." });
  }
  if (!env.RATE_LIMIT_SALT || env.RATE_LIMIT_SALT.length < 16) {
    return jsonResult(503, { ok: false, message: "Inquiry storage is not configured yet. Nothing was saved." });
  }
  const parsed = await readBody(request);
  if (!parsed) return jsonResult(415, { ok: false, message: "Send the form as JSON or a standard form post." });
  const { raw } = parsed;
  if (typeof raw.cpl_leave_blank === "string" && raw.cpl_leave_blank.trim()) {
    return jsonResult(400, { ok: false, message: "This submission could not be accepted." });
  }
  const validated = validateInquiry(raw);
  if (!validated.ok || !validated.value) {
    return jsonResult(422, { ok: false, message: "Check the highlighted fields.", errors: validated.errors });
  }
  const value = validated.value;
  if (!env.TURNSTILE_SECRET) {
    return jsonResult(503, {
      ok: false,
      message: "Verification is not configured on this deployment. Nothing was saved.",
      errors: { turnstile: "Verification is not configured." },
    });
  }
  const token = typeof raw.turnstileToken === "string" ? raw.turnstileToken : typeof raw["cf-turnstile-response"] === "string" ? raw["cf-turnstile-response"] : "";
  const ip = clientIp(request);
  const passed = await defaultVerifyTurnstile(token, ip, env.TURNSTILE_SECRET, fetchImpl);
  if (!passed) {
    return jsonResult(400, {
      ok: false,
      message: "Verification failed. Retry the form.",
      errors: { turnstile: "Verification failed. Retry the form." },
    });
  }

  const submissionId = value.submissionId ?? newId();
  const payloadHash = await sha256Hex(canonicalPayload({ ...value, submissionId }));
  const existing = await findBySubmissionId(sql, submissionId);
  if (existing) {
    if (existing.payloadHash === payloadHash) {
      return jsonResult(200, publicPayload(existing, true));
    }
    return jsonResult(409, { ok: false, message: "This submission id was already used for a different inquiry." });
  }

  const windowStart = Math.floor(now / 3_600_000);
  const ipHash = await sha256Hex(`${env.RATE_LIMIT_SALT}:${ip ?? "unknown"}`);
  const emailHash = await sha256Hex(`${env.RATE_LIMIT_SALT}:${value.email}`);
  const ipAllowed = await bumpRateLimit(sql, `ip:${ipHash}`, windowStart, IP_LIMIT);
  const emailAllowed = await bumpRateLimit(sql, `email:${emailHash}`, windowStart, EMAIL_LIMIT);
  if (!ipAllowed || !emailAllowed) {
    return jsonResult(429, { ok: false, message: "Too many submissions. Wait and try again. Nothing new was saved." });
  }

  const id = newId();
  const createdAt = new Date(now).toISOString();
  const draft = {
    ...value,
    submissionId,
    id,
    publicReference: publicReference(id),
    createdAt,
    payloadHash,
    ipHash,
    userAgent: (request.headers.get("user-agent") ?? "").slice(0, 180) || null,
  };
  try {
    await insertInquiry(sql, draft);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      const raced = await findBySubmissionId(sql, submissionId);
      if (raced && raced.payloadHash === payloadHash) return jsonResult(200, publicPayload(raced, true));
      return jsonResult(409, { ok: false, message: "This submission id was already used for a different inquiry." });
    }
    throw error;
  }
  let record = await findBySubmissionId(sql, submissionId);
  if (!record) return jsonResult(500, { ok: false, message: "The inquiry could not be read back. Retry with the same submission id." });
  record = await deliverInquiry(sql, env, record, fetchImpl, now);
  return jsonResult(201, publicPayload(record, false));
}

function publicPayload(record: InquiryRecord, duplicate: boolean): Record<string, unknown> {
  return {
    ok: true,
    saved: true,
    duplicate,
    reference: record.publicReference,
    storage: "saved",
    google: record.googleStatus,
    notification: record.notifyStatus,
    message: savedMessage(record),
  };
}

export function csvEscape(value: string): string {
  const safe = neutralizeSpreadsheetFormula(value);
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function inquiriesToCsv(records: InquiryRecord[]): string {
  const headers = ["reference", "createdAt", "name", "email", "company", "interest", "workflowProblem", "google", "notification", "marketingConsent"];
  const lines = [headers.join(",")];
  for (const record of records) {
    lines.push(
      [
        record.publicReference,
        record.createdAt,
        record.name,
        record.email,
        record.company ?? "",
        record.interest ?? "",
        record.workflowProblem,
        record.googleStatus,
        record.notifyStatus,
        record.marketingConsent ? "yes" : "no",
      ].map(csvEscape).join(","),
    );
  }
  return lines.join("\n");
}

export function operatorAuthorized(request: Request, env: InquiryEnv): boolean {
  const token = env.OPERATOR_TOKEN ?? "";
  if (token.length < 24) return false;
  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  return timingSafeEqual(presented, token);
}

export async function handleOperator(
  request: Request,
  sql: Sql,
  env: InquiryEnv,
  fetchImpl: typeof fetch,
  now = Date.now(),
): Promise<HandlerResult> {
  if (!env.OPERATOR_TOKEN || env.OPERATOR_TOKEN.length < 24) {
    return jsonResult(503, { ok: false, message: "The operator path is not configured." });
  }
  if (!operatorAuthorized(request, env)) {
    return jsonResult(401, { ok: false, message: "Operator authorization failed." });
  }
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "");
  if (request.method === "GET" && path === "/api/operator/inquiries") {
    const pending = url.searchParams.get("pending") !== "0";
    const records = await listInquiries(sql, pending);
    return jsonResult(200, { ok: true, inquiries: records.map(operatorView) });
  }
  if (request.method === "GET" && path === "/api/operator/export") {
    const records = await listInquiries(sql, false);
    return {
      status: 200,
      json: { ok: true, format: "csv" },
      html: inquiriesToCsv(records),
    };
  }
  const match = path.match(/^\/api\/operator\/inquiries\/([^/]+)(?:\/(retry|confirm))?$/);
  if (!match) return jsonResult(404, { ok: false, message: "Operator route not found." });
  const id = decodeURIComponent(match[1] ?? "");
  const action = match[2];
  if (request.method === "DELETE" && !action) {
    const deleted = await deleteInquiry(sql, id, new Date(now).toISOString());
    if (!deleted) return jsonResult(404, { ok: false, message: "Inquiry not found." });
    return jsonResult(200, { ok: true, deleted: true, reference: deleted.publicReference });
  }
  const record = await findInquiry(sql, id);
  if (!record) return jsonResult(404, { ok: false, message: "Inquiry not found." });
  if (request.method === "POST" && action === "retry") {
    const updated = await deliverInquiry(sql, env, record, fetchImpl, now);
    return jsonResult(200, { ok: true, inquiry: operatorView(updated) });
  }
  if (request.method === "POST" && action === "confirm") {
    const body = (await request.json().catch(() => ({}))) as { archive?: boolean; notification?: boolean };
    const stamp = new Date(now).toISOString();
    const patch: Parameters<typeof updateDelivery>[2] = {};
    if (body.archive) {
      patch.googleStatus = "synced";
      patch.googleConfirmedAt = stamp;
      patch.googleError = "Confirmed by an operator. This is not a live Google callback.";
      patch.googleNextAt = null;
    }
    if (body.notification) {
      patch.notifyStatus = "sent";
      patch.notifyConfirmedAt = stamp;
      patch.notifyError = "Confirmed by an operator. This is not a live mailbox callback.";
      patch.notifyNextAt = null;
    }
    await updateDelivery(sql, record.id, patch);
    const updated = await findInquiry(sql, record.id);
    return jsonResult(200, { ok: true, confirmedBy: "operator", inquiry: updated ? operatorView(updated) : null });
  }
  return jsonResult(405, { ok: false, message: "Method not allowed." });
}

function operatorView(record: InquiryRecord) {
  return {
    id: record.id,
    reference: record.publicReference,
    createdAt: record.createdAt,
    name: record.name,
    email: record.email,
    company: record.company,
    interest: record.interest,
    scenarioInterest: record.scenarioInterest,
    marketingConsent: record.marketingConsent,
    storage: "saved",
    google: record.googleStatus,
    notification: record.notifyStatus,
    googleAttempts: record.googleAttempts,
    notifyAttempts: record.notifyAttempts,
    googleNextAt: record.googleNextAt,
    notifyNextAt: record.notifyNextAt,
    googleError: record.googleError,
    notifyError: record.notifyError,
    googleConfirmedAt: record.googleConfirmedAt,
    notifyConfirmedAt: record.notifyConfirmedAt,
  };
}

export function payloadForHash(value: InquiryInput, submissionId: string): Promise<string> {
  return sha256Hex(canonicalPayload({ ...value, submissionId }));
}

export async function retryDue(sql: Sql, env: InquiryEnv, fetchImpl: typeof fetch, now = Date.now()): Promise<number> {
  const due = await listDueInquiries(sql, new Date(now).toISOString());
  for (const record of due) {
    await deliverInquiry(sql, env, record, fetchImpl, now);
  }
  return due.length;
}
