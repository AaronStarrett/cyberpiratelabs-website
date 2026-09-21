import { updateDelivery } from "./repository";
import { signEnvelope } from "./sign";
import type { InquiryRecord, Sql } from "./types";
import { MAX_DELIVERY_ATTEMPTS, backoffDelay } from "./types";
import { neutralizeSpreadsheetFormula } from "./validate";

export type GoogleEnv = {
  GOOGLE_APPS_SCRIPT_URL?: string;
  GOOGLE_HMAC_SECRET?: string;
};

export type DeliveryReport = {
  archive: "synced" | "failed" | "unconfigured";
  notification: "sent" | "failed" | "unconfigured";
  error?: string;
};

function sheetValue(value: string | null): string {
  return neutralizeSpreadsheetFormula(value ?? "");
}

export function archiveBody(record: InquiryRecord): string {
  return JSON.stringify({
    submissionId: record.submissionId,
    reference: record.publicReference,
    createdAt: record.createdAt,
    name: sheetValue(record.name),
    email: sheetValue(record.email),
    company: sheetValue(record.company),
    phone: sheetValue(record.phone),
    serviceCategory: sheetValue(record.serviceCategory),
    teamSize: sheetValue(record.teamSize),
    currentTools: sheetValue(record.currentTools),
    interest: sheetValue(record.interest),
    workflowProblem: sheetValue(record.workflowProblem),
    scenarioInterest: sheetValue(record.scenarioInterest),
    marketingConsent: record.marketingConsent ? "yes" : "no",
    sourcePath: sheetValue(record.sourcePath),
  });
}

export function googleConfigured(env: GoogleEnv): boolean {
  return Boolean(env.GOOGLE_APPS_SCRIPT_URL && env.GOOGLE_HMAC_SECRET && env.GOOGLE_HMAC_SECRET.length >= 16);
}

function nextIso(now: number, attempts: number): string {
  return new Date(now + backoffDelay(attempts)).toISOString();
}

export async function postArchive(
  env: GoogleEnv,
  record: InquiryRecord,
  fetchImpl: typeof fetch,
  now: number,
): Promise<DeliveryReport> {
  if (!googleConfigured(env)) {
    return {
      archive: "unconfigured",
      notification: "unconfigured",
      error: "Google archive is not configured.",
    };
  }
  try {
    const payload = archiveBody(record);
    const timestamp = String(now);
    const signature = await signEnvelope(env.GOOGLE_HMAC_SECRET ?? "", timestamp, record.submissionId, payload);
    const response = await fetchImpl(env.GOOGLE_APPS_SCRIPT_URL ?? "", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timestamp, submissionId: record.submissionId, signature, payload }),
    });
    if (!response.ok) {
      return { archive: "failed", notification: "failed", error: `Archive responded ${response.status}.` };
    }
    const parsed = (await response.json()) as Partial<DeliveryReport>;
    return {
      archive: parsed.archive === "synced" ? "synced" : "failed",
      notification: parsed.notification === "sent" ? "sent" : "failed",
      error: typeof parsed.error === "string" ? parsed.error.slice(0, 300) : undefined,
    };
  } catch (error) {
    return {
      archive: "failed",
      notification: "failed",
      error: error instanceof Error ? error.message.slice(0, 300) : "Delivery failed.",
    };
  }
}

export async function applyDeliveryReport(
  sql: Sql,
  record: InquiryRecord,
  report: DeliveryReport,
  now: number,
): Promise<InquiryRecord> {
  let googleStatus = record.googleStatus;
  let notifyStatus = record.notifyStatus;
  let googleAttempts = record.googleAttempts;
  let notifyAttempts = record.notifyAttempts;
  let googleNextAt = record.googleNextAt;
  let notifyNextAt = record.notifyNextAt;
  let googleError = record.googleError;
  let notifyError = record.notifyError;

  if (googleStatus !== "synced") {
    if (report.archive === "synced") {
      googleStatus = "synced";
      googleNextAt = null;
      googleError = null;
    } else if (report.archive === "unconfigured") {
      googleStatus = "pending_unconfigured";
      googleNextAt = null;
      googleError = report.error ?? "Google archive is not configured.";
    } else {
      googleAttempts += 1;
      googleStatus = "failed";
      googleError = report.error ?? "Google archive failed.";
      googleNextAt = googleAttempts >= MAX_DELIVERY_ATTEMPTS ? null : nextIso(now, googleAttempts);
    }
  }

  if (notifyStatus !== "sent") {
    if (report.notification === "sent") {
      notifyStatus = "sent";
      notifyNextAt = null;
      notifyError = null;
    } else if (report.notification === "unconfigured") {
      notifyStatus = "pending_unconfigured";
      notifyNextAt = null;
      notifyError = report.error ?? "Owner notification is not configured.";
    } else {
      notifyAttempts += 1;
      notifyStatus = "failed";
      notifyError = report.error ?? "Owner notification failed.";
      notifyNextAt = notifyAttempts >= MAX_DELIVERY_ATTEMPTS ? null : nextIso(now, notifyAttempts);
    }
  }

  const patch = {
    googleStatus,
    notifyStatus,
    googleAttempts,
    notifyAttempts,
    googleNextAt,
    notifyNextAt,
    googleError,
    notifyError,
  };
  await updateDelivery(sql, record.id, patch);
  return { ...record, ...patch };
}

export async function deliverInquiry(
  sql: Sql,
  env: GoogleEnv,
  record: InquiryRecord,
  fetchImpl: typeof fetch,
  now: number,
): Promise<InquiryRecord> {
  const report = await postArchive(env, record, fetchImpl, now);
  return applyDeliveryReport(sql, record, report, now);
}
