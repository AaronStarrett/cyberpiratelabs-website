import type { InquiryDraft, InquiryRecord, Sql, SqlRow } from "./types";

function text(row: SqlRow, key: string): string | null {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? null : String(value);
}

function required(row: SqlRow, key: string): string {
  return text(row, key) ?? "";
}

function num(row: SqlRow, key: string): number {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

export function mapInquiry(row: SqlRow): InquiryRecord {
  return {
    id: required(row, "id"),
    submissionId: required(row, "submission_id"),
    publicReference: required(row, "public_reference"),
    createdAt: required(row, "created_at"),
    payloadHash: required(row, "payload_hash"),
    name: required(row, "name"),
    email: required(row, "email"),
    company: text(row, "company"),
    phone: text(row, "phone"),
    serviceCategory: text(row, "service_category"),
    teamSize: text(row, "team_size"),
    currentTools: text(row, "current_tools"),
    interest: text(row, "interest"),
    workflowProblem: required(row, "workflow_problem"),
    scenarioInterest: text(row, "scenario_interest"),
    marketingConsent: num(row, "marketing_consent") === 1,
    sourcePath: text(row, "source_path"),
    googleStatus: required(row, "google_status") as InquiryRecord["googleStatus"],
    notifyStatus: required(row, "notify_status") as InquiryRecord["notifyStatus"],
    googleAttempts: num(row, "google_attempts"),
    notifyAttempts: num(row, "notify_attempts"),
    googleNextAt: text(row, "google_next_at"),
    notifyNextAt: text(row, "notify_next_at"),
    googleError: text(row, "google_error"),
    notifyError: text(row, "notify_error"),
    googleConfirmedAt: text(row, "google_confirmed_at"),
    notifyConfirmedAt: text(row, "notify_confirmed_at"),
  };
}

export async function insertInquiry(sql: Sql, draft: InquiryDraft): Promise<void> {
  await sql.run(
    `INSERT INTO inquiries (
      id, submission_id, public_reference, created_at, payload_hash,
      name, email, company, phone, service_category, team_size, current_tools,
      interest, workflow_problem, scenario_interest, marketing_consent, source_path,
      ip_hash, user_agent, google_status, notify_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
    draft.id,
    draft.submissionId,
    draft.publicReference,
    draft.createdAt,
    draft.payloadHash,
    draft.name,
    draft.email,
    draft.company,
    draft.phone,
    draft.serviceCategory,
    draft.teamSize,
    draft.currentTools,
    draft.interest,
    draft.workflowProblem,
    draft.scenarioInterest,
    draft.marketingConsent ? 1 : 0,
    draft.sourcePath,
    draft.ipHash,
    draft.userAgent,
  );
}

export async function findBySubmissionId(sql: Sql, submissionId: string): Promise<InquiryRecord | null> {
  const row = await sql.get<SqlRow>("SELECT * FROM inquiries WHERE submission_id = ?", submissionId);
  return row ? mapInquiry(row) : null;
}

export async function findInquiry(sql: Sql, idOrReference: string): Promise<InquiryRecord | null> {
  const row = await sql.get<SqlRow>(
    "SELECT * FROM inquiries WHERE id = ? OR public_reference = ?",
    idOrReference,
    idOrReference.toUpperCase(),
  );
  return row ? mapInquiry(row) : null;
}

export async function updateDelivery(
  sql: Sql,
  id: string,
  patch: Partial<Pick<InquiryRecord,
    "googleStatus" | "notifyStatus" | "googleAttempts" | "notifyAttempts" | "googleNextAt" | "notifyNextAt" | "googleError" | "notifyError" | "googleConfirmedAt" | "notifyConfirmedAt">>,
): Promise<void> {
  const current = await sql.get<SqlRow>("SELECT * FROM inquiries WHERE id = ?", id);
  if (!current) return;
  const record = mapInquiry(current);
  const next = { ...record, ...patch };
  await sql.run(
    `UPDATE inquiries SET
      google_status = ?, notify_status = ?, google_attempts = ?, notify_attempts = ?,
      google_next_at = ?, notify_next_at = ?, google_error = ?, notify_error = ?,
      google_confirmed_at = ?, notify_confirmed_at = ?
    WHERE id = ?`,
    next.googleStatus,
    next.notifyStatus,
    next.googleAttempts,
    next.notifyAttempts,
    next.googleNextAt,
    next.notifyNextAt,
    next.googleError,
    next.notifyError,
    next.googleConfirmedAt,
    next.notifyConfirmedAt,
    id,
  );
}

export async function listInquiries(sql: Sql, pendingOnly: boolean): Promise<InquiryRecord[]> {
  const rows = pendingOnly
    ? await sql.all<SqlRow>(
        `SELECT * FROM inquiries
         WHERE google_status != 'synced' OR notify_status != 'sent'
         ORDER BY created_at ASC LIMIT 200`,
      )
    : await sql.all<SqlRow>("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 200");
  return rows.map(mapInquiry);
}

export async function listDueInquiries(sql: Sql, nowIso: string): Promise<InquiryRecord[]> {
  const rows = await sql.all<SqlRow>(
    `SELECT * FROM inquiries
     WHERE google_status IN ('pending', 'pending_unconfigured')
        OR notify_status IN ('pending', 'pending_unconfigured')
        OR (google_status = 'failed' AND google_attempts < 8 AND (google_next_at IS NULL OR google_next_at <= ?))
        OR (notify_status = 'failed' AND notify_attempts < 8 AND (notify_next_at IS NULL OR notify_next_at <= ?))
     ORDER BY created_at ASC
     LIMIT 25`,
    nowIso,
    nowIso,
  );
  return rows.map(mapInquiry);
}

export async function deleteInquiry(sql: Sql, idOrReference: string, deletedAt: string): Promise<InquiryRecord | null> {
  const existing = await findInquiry(sql, idOrReference);
  if (!existing) return null;
  await sql.run(
    "INSERT INTO deletion_log (id, inquiry_id, public_reference, deleted_at) VALUES (?, ?, ?, ?)",
    crypto.randomUUID(),
    existing.id,
    existing.publicReference,
    deletedAt,
  );
  await sql.run("DELETE FROM inquiries WHERE id = ?", existing.id);
  return existing;
}

export async function bumpRateLimit(sql: Sql, bucket: string, windowStart: number, limit: number): Promise<boolean> {
  await sql.run(
    `INSERT INTO rate_limits (bucket_key, window_start, count) VALUES (?, ?, 1)
     ON CONFLICT(bucket_key, window_start) DO UPDATE SET count = count + 1`,
    bucket,
    windowStart,
  );
  const row = await sql.get<SqlRow>(
    "SELECT count FROM rate_limits WHERE bucket_key = ? AND window_start = ?",
    bucket,
    windowStart,
  );
  return num(row ?? {}, "count") <= limit;
}
