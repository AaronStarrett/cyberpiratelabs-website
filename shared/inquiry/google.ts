import { claimDelivery, findInquiry, releaseDelivery, updateDelivery } from "./repository";
import { sha256Hex, signEnvelope, timingSafeEqual } from "./sign";
import type { InquiryRecord, Sql } from "./types";
import { MAX_DELIVERY_ATTEMPTS, backoffDelay } from "./types";

export const OWNER_NOTIFICATION_EMAIL = "astarrett@cyberpiratelabs.com";
export const RECOVERY_REFERENCE = "CPL-347301C3";
export const EXCLUDED_QA_REFERENCE = "CPL-2AA16BBF";
export type GoogleEnv = {
  GOOGLE_APPS_SCRIPT_URL?: string;
  GOOGLE_HMAC_SECRET?: string;
  GOOGLE_ARCHIVE_ENABLED?: string;
  NOTIFICATION_ENABLED_AFTER?: string;
  NOTIFICATION_RECOVERY_REFERENCES?: string;
};
export type DeliveryReport = {
  archive: "synced" | "failed" | "unconfigured" | "disabled";
  notification: "sent" | "failed" | "unconfigured" | "held" | "ambiguous" | "not_started";
  archiveRetryable?: boolean;
  notificationRetryable?: boolean;
  error?: string;
  sentAt?: string;
};
type DeliveryActions = { notify: boolean; archive: boolean };

export function archiveBody(record: InquiryRecord): string {
  // Raw normalized values are used in email; spreadsheet escaping belongs to
  // the archive adapter, so a phone beginning with "+" survives unchanged.
  return JSON.stringify({
    submissionId: record.submissionId,
    reference: record.publicReference,
    createdAt: record.createdAt,
    payloadHash: record.payloadHash,
    name: record.name,
    email: record.email,
    company: record.company,
    phone: record.phone,
    serviceCategory: record.serviceCategory,
    teamSize: record.teamSize,
    currentTools: record.currentTools,
    interest: record.interest,
    workflowProblem: record.workflowProblem,
    scenarioInterest: record.scenarioInterest,
    marketingConsent: record.marketingConsent,
    sourcePath: record.sourcePath,
  });
}

export function googleConfigured(env: GoogleEnv): boolean {
  if (!env.GOOGLE_HMAC_SECRET || env.GOOGLE_HMAC_SECRET.length < 16) return false;
  try {
    const url = new URL(env.GOOGLE_APPS_SCRIPT_URL ?? "");
    return url.protocol === "https:" && url.hostname === "script.google.com"
      && /^\/macros\/s\/[^/]+\/exec$/.test(url.pathname);
  } catch { return false; }
}

export function notificationCutoff(env: GoogleEnv): string | null {
  const value = env.NOTIFICATION_ENABLED_AFTER ?? "";
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value)) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

export function recoveryReferences(env: GoogleEnv): string[] {
  return (env.NOTIFICATION_RECOVERY_REFERENCES ?? "").split(",").map(value => value.trim().toUpperCase())
    .filter(value => value === RECOVERY_REFERENCE).slice(0, 1);
}

export function notificationEligible(record: InquiryRecord, env: GoogleEnv): boolean {
  if (record.publicReference === EXCLUDED_QA_REFERENCE) return false;
  const cutoff = notificationCutoff(env);
  if (!cutoff) return false;
  return record.createdAt >= cutoff || recoveryReferences(env).includes(record.publicReference);
}

function nextIso(now: number, attempts: number): string {
  return new Date(now + backoffDelay(attempts)).toISOString();
}

export async function parseBridgeResponse(
  raw: unknown, env: GoogleEnv, record: InquiryRecord, timestamp: string,
): Promise<DeliveryReport | null> {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as Record<string, unknown>;
  if (envelope.version !== 2 || envelope.timestamp !== timestamp || envelope.submissionId !== record.submissionId
    || typeof envelope.payload !== "string" || envelope.payload.length > 8000
    || typeof envelope.signature !== "string" || !/^[0-9a-f]{64}$/.test(envelope.signature)) return null;
  const expected = await signEnvelope(env.GOOGLE_HMAC_SECRET ?? "", "response:" + timestamp, record.submissionId, envelope.payload);
  if (!timingSafeEqual(expected, envelope.signature)) return null;
  let result: Record<string, unknown>;
  try { result = JSON.parse(envelope.payload) as Record<string, unknown>; } catch { return null; }
  if (!result || typeof result !== "object" || result.version !== 2 || result.submissionId !== record.submissionId
    || result.reference !== record.publicReference || result.payloadHash !== record.payloadHash
    || result.recipient !== OWNER_NOTIFICATION_EMAIL) return null;
  if (!["synced", "failed", "unconfigured", "disabled"].includes(String(result.archive))
    || !["sent", "failed", "unconfigured", "held", "ambiguous", "not_started"].includes(String(result.notification))
    || typeof result.archiveRetryable !== "boolean" || typeof result.notificationRetryable !== "boolean") return null;
  if (result.notification === "sent" && (typeof result.sentAt !== "string" || !Number.isFinite(Date.parse(result.sentAt)))) return null;
  if (typeof result.errorCode !== "string" || !/^[A-Z0-9_]{0,64}$/.test(result.errorCode)) return null;
  return {
    archive: result.archive as DeliveryReport["archive"],
    notification: result.notification as DeliveryReport["notification"],
    archiveRetryable: result.archiveRetryable,
    notificationRetryable: result.notificationRetryable,
    error: result.errorCode || undefined,
    sentAt: typeof result.sentAt === "string" ? result.sentAt : undefined,
  };
}

export async function postArchive(
  env: GoogleEnv, record: InquiryRecord, fetchImpl: typeof fetch, now: number,
  actions: DeliveryActions = { notify: true, archive: env.GOOGLE_ARCHIVE_ENABLED === "true" },
): Promise<DeliveryReport> {
  const archive = actions.archive ? "unconfigured" : "disabled";
  if (!googleConfigured(env)) return { archive, notification: "unconfigured", error: "BRIDGE_UNCONFIGURED" };
  if (!notificationEligible(record, env)) return { archive, notification: "held", error: "BACKLOG_HELD" };
  const payload = JSON.stringify({ ...JSON.parse(archiveBody(record)), delivery: actions });
  const timestamp = String(now);
  const signature = await signEnvelope(env.GOOGLE_HMAC_SECRET ?? "", timestamp, record.submissionId, payload);
  try {
    const response = await fetchImpl(env.GOOGLE_APPS_SCRIPT_URL ?? "", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ timestamp, submissionId: record.submissionId, signature, payload }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return { archive: actions.archive ? "failed" : "disabled", notification: "ambiguous",
      archiveRetryable: true, notificationRetryable: true, error: "BRIDGE_HTTP_" + response.status };
    const body = await response.text();
    const parsed = body.length <= 16_000 ? await parseBridgeResponse(JSON.parse(body), env, record, timestamp) : null;
    return parsed ?? { archive: actions.archive ? "failed" : "disabled", notification: "ambiguous",
      archiveRetryable: true, notificationRetryable: true, error: "BRIDGE_RESPONSE_INVALID" };
  } catch {
    // A response failure cannot prove a send did not occur. The next attempt
    // queries the durable bridge ledger with notify:false before any new send.
    return { archive: actions.archive ? "failed" : "disabled", notification: "ambiguous",
      archiveRetryable: true, notificationRetryable: true, error: "BRIDGE_OUTCOME_UNKNOWN" };
  }
}

export async function applyDeliveryReport(
  sql: Sql, record: InquiryRecord, report: DeliveryReport, now: number, claimToken?: string,
): Promise<InquiryRecord> {
  const next = { ...record };
  if (record.googleStatus !== "synced") {
    if (report.archive === "synced") {
      next.googleStatus = "synced"; next.googleNextAt = null; next.googleError = null;
      next.googleConfirmedAt = new Date(now).toISOString();
    } else if (report.archive === "disabled" || report.archive === "unconfigured") {
      next.googleStatus = report.archive === "disabled" ? "disabled" : "pending_unconfigured";
      next.googleNextAt = null; next.googleError = report.error ?? null;
    } else {
      next.googleStatus = "failed"; next.googleAttempts += 1; next.googleError = report.error ?? "ARCHIVE_FAILED";
      next.googleNextAt = report.archiveRetryable && next.googleAttempts < MAX_DELIVERY_ATTEMPTS ? nextIso(now, next.googleAttempts) : null;
    }
  }
  if (record.notifyStatus !== "sent") {
    if (report.notification === "sent") {
      next.notifyStatus = "sent"; next.notifyNextAt = null; next.notifyError = null;
      next.notifyConfirmedAt = report.sentAt ?? new Date(now).toISOString();
    } else if (report.notification === "unconfigured" || report.notification === "held") {
      next.notifyStatus = report.notification === "held" ? "held" : "pending_unconfigured";
      next.notifyNextAt = null; next.notifyError = report.error ?? null;
    } else {
      next.notifyStatus = report.notification === "ambiguous" ? "ambiguous" : "failed";
      next.notifyAttempts += 1; next.notifyError = report.error ?? "NOTIFICATION_FAILED";
      next.notifyNextAt = report.notificationRetryable && next.notifyAttempts < MAX_DELIVERY_ATTEMPTS ? nextIso(now, next.notifyAttempts) : null;
    }
  }
  await updateDelivery(sql, record.id, next, claimToken);
  return await findInquiry(sql, record.id) ?? next;
}

export async function deliverInquiry(
  sql: Sql, env: GoogleEnv, record: InquiryRecord, fetchImpl: typeof fetch, now: number,
): Promise<InquiryRecord> {
  const claim = await claimDelivery(sql, record.id, now);
  if (!claim) return await findInquiry(sql, record.id) ?? record;
  try {
    const current = await findInquiry(sql, record.id);
    if (!current) return record;
    const archive = env.GOOGLE_ARCHIVE_ENABLED === "true" && current.googleStatus !== "synced"
      && current.googleAttempts < MAX_DELIVERY_ATTEMPTS;
    const notify = current.notifyStatus !== "sent" && current.notifyStatus !== "ambiguous"
      && current.notifyAttempts < MAX_DELIVERY_ATTEMPTS;
    if (current.notifyStatus === "sent" && !archive) return current;
    const report = await postArchive(env, current, fetchImpl, now, { notify, archive });
    return await applyDeliveryReport(sql, current, report, now, claim);
  } finally {
    await releaseDelivery(sql, record.id, claim);
  }
}

// A stable hash is also checked independently by the bridge before it writes
// the send ledger; exposed for contract tests and bridge adapters.
export async function bridgeContentHash(record: InquiryRecord): Promise<string> {
  return sha256Hex(archiveBody(record));
}
