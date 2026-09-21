import type { InquiryInput } from "./validate";

export type GoogleStatus = "pending" | "pending_unconfigured" | "synced" | "failed";
export type NotifyStatus = "pending" | "pending_unconfigured" | "sent" | "failed";

export type InquiryRecord = {
  id: string;
  submissionId: string;
  publicReference: string;
  createdAt: string;
  payloadHash: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  serviceCategory: string | null;
  teamSize: string | null;
  currentTools: string | null;
  interest: string | null;
  workflowProblem: string;
  scenarioInterest: string | null;
  marketingConsent: boolean;
  sourcePath: string | null;
  googleStatus: GoogleStatus;
  notifyStatus: NotifyStatus;
  googleAttempts: number;
  notifyAttempts: number;
  googleNextAt: string | null;
  notifyNextAt: string | null;
  googleError: string | null;
  notifyError: string | null;
  googleConfirmedAt: string | null;
  notifyConfirmedAt: string | null;
};

export type InquiryDraft = InquiryInput & {
  id: string;
  submissionId: string;
  publicReference: string;
  createdAt: string;
  payloadHash: string;
  ipHash: string | null;
  userAgent: string | null;
};

export type SqlRow = Record<string, unknown>;

export interface Sql {
  get<T extends SqlRow>(query: string, ...params: unknown[]): Promise<T | null>;
  all<T extends SqlRow>(query: string, ...params: unknown[]): Promise<T[]>;
  run(query: string, ...params: unknown[]): Promise<void>;
}

export const MAX_DELIVERY_ATTEMPTS = 8;
export const BACKOFF_MS = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  6 * 60 * 60_000,
  24 * 60 * 60_000,
  24 * 60 * 60_000,
  24 * 60 * 60_000,
] as const;

export function backoffDelay(attemptsAfterFailure: number): number {
  const index = Math.min(Math.max(attemptsAfterFailure, 1), BACKOFF_MS.length) - 1;
  return BACKOFF_MS[index] ?? BACKOFF_MS[BACKOFF_MS.length - 1];
}
