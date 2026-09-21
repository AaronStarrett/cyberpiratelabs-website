export const SERVICE_CATEGORIES = [
  "inspection-assessment",
  "field-service",
  "recurring-property",
  "other",
] as const;

export const TEAM_SIZES = ["1-5", "6-20", "21-50", "51+", "unspecified"] as const;

export const INTERESTS = [
  "demonstration",
  "early-access",
  "implementation",
  "partnership",
] as const;

export const SCENARIO_INTERESTS = ["inspection", "field-service", "recurring"] as const;

const SERVICE_LABELS: Record<(typeof SERVICE_CATEGORIES)[number], string> = {
  "inspection-assessment": "Inspection and assessment",
  "field-service": "Field service",
  "recurring-property": "Recurring property care",
  other: "Other service work",
};

const INTEREST_LABELS: Record<(typeof INTERESTS)[number], string> = {
  demonstration: "Demonstration",
  "early-access": "Early access",
  implementation: "Implementation discussion",
  partnership: "Partnership",
};

export const LIMITS = {
  name: 120,
  email: 254,
  company: 160,
  phone: 40,
  tools: 300,
  workflowMin: 20,
  workflowMax: 2000,
  sourcePath: 200,
  bodyBytes: 20_000,
} as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type TeamSize = (typeof TEAM_SIZES)[number];
export type Interest = (typeof INTERESTS)[number];
export type ScenarioInterest = (typeof SCENARIO_INTERESTS)[number];

export type InquiryInput = {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  serviceCategory: ServiceCategory | null;
  teamSize: TeamSize | null;
  currentTools: string | null;
  interest: Interest | null;
  workflowProblem: string;
  scenarioInterest: ScenarioInterest | null;
  marketingConsent: boolean;
  sourcePath: string | null;
  submissionId: string | null;
  honeypot: string;
};

export type FieldErrors = Partial<Record<keyof InquiryInput | "form" | "turnstile", string>>;

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function serviceLabel(value: ServiceCategory): string {
  return SERVICE_LABELS[value];
}

export function interestLabel(value: Interest): string {
  return INTEREST_LABELS[value];
}

export function scenarioLabel(value: ScenarioInterest): string {
  if (value === "inspection") return "Inspection and assessment sample";
  if (value === "field-service") return "Field service sample";
  return "Recurring property care sample";
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optional(value: string, max: number, field: string, errors: FieldErrors): string | null {
  if (!value) return null;
  if (CONTROL.test(value)) {
    errors[field as keyof InquiryInput] = "Remove hidden control characters.";
    return null;
  }
  if (value.length > max) {
    errors[field as keyof InquiryInput] = `Use ${max} characters or fewer.`;
    return null;
  }
  return value;
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function validateInquiry(raw: Record<string, unknown>): {
  ok: boolean;
  errors: FieldErrors;
  value: InquiryInput | null;
} {
  const errors: FieldErrors = {};
  const name = clean(raw.name);
  const email = clean(raw.email).toLowerCase();
  const company = optional(clean(raw.company), LIMITS.company, "company", errors);
  const phoneRaw = clean(raw.phone);
  const tools = optional(clean(raw.currentTools ?? raw.current_tools), LIMITS.tools, "currentTools", errors);
  const workflow = clean(raw.workflowProblem ?? raw.workflow_problem);
  const sourcePath = optional(clean(raw.sourcePath ?? raw.source_path), LIMITS.sourcePath, "sourcePath", errors);
  const honeypot = clean(raw.cpl_leave_blank ?? raw.honeypot);
  const submissionRaw = clean(raw.submissionId ?? raw.submission_id);
  const marketingRaw = raw.marketingConsent ?? raw.marketing_consent;
  const marketingConsent = marketingRaw === true || marketingRaw === "yes" || marketingRaw === "true" || marketingRaw === "on";

  if (!name) errors.name = "Enter your name.";
  else if (CONTROL.test(name)) errors.name = "Remove hidden control characters.";
  else if (name.length > LIMITS.name) errors.name = `Use ${LIMITS.name} characters or fewer.`;

  if (!email) errors.email = "Enter your email.";
  else if (email.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  let phone: string | null = null;
  if (phoneRaw) {
    if (CONTROL.test(phoneRaw) || phoneRaw.length > LIMITS.phone || !/^[0-9+().\-\s]{7,40}$/.test(phoneRaw)) {
      errors.phone = "Enter a phone number using digits and ordinary punctuation, or leave it blank.";
    } else {
      phone = phoneRaw;
    }
  }

  const serviceRaw = clean(raw.serviceCategory ?? raw.service_category);
  let serviceCategory: ServiceCategory | null = null;
  if (serviceRaw) {
    if ((SERVICE_CATEGORIES as readonly string[]).includes(serviceRaw)) {
      serviceCategory = serviceRaw as ServiceCategory;
    } else {
      errors.serviceCategory = "Choose a service category from the list.";
    }
  }

  const teamRaw = clean(raw.teamSize ?? raw.team_size);
  let teamSize: TeamSize | null = null;
  if (teamRaw) {
    if ((TEAM_SIZES as readonly string[]).includes(teamRaw)) teamSize = teamRaw as TeamSize;
    else errors.teamSize = "Choose a team size from the list.";
  }

  const interestRaw = clean(raw.interest);
  let interest: Interest | null = null;
  if (interestRaw) {
    if ((INTERESTS as readonly string[]).includes(interestRaw)) interest = interestRaw as Interest;
    else errors.interest = "Choose an interest from the list.";
  }

  const scenarioRaw = clean(raw.scenarioInterest ?? raw.scenario_interest);
  let scenarioInterest: ScenarioInterest | null = null;
  if (scenarioRaw) {
    if ((SCENARIO_INTERESTS as readonly string[]).includes(scenarioRaw)) {
      scenarioInterest = scenarioRaw as ScenarioInterest;
    } else {
      errors.scenarioInterest = "The sample workflow label is not recognized.";
    }
  }

  if (!workflow) errors.workflowProblem = "Describe where work gets stuck.";
  else if (CONTROL.test(workflow)) errors.workflowProblem = "Remove hidden control characters.";
  else if (workflow.length < LIMITS.workflowMin) {
    errors.workflowProblem = `Use at least ${LIMITS.workflowMin} characters so the workflow is clear.`;
  } else if (workflow.length > LIMITS.workflowMax) {
    errors.workflowProblem = `Use ${LIMITS.workflowMax} characters or fewer.`;
  }

  let submissionId: string | null = null;
  if (submissionRaw) {
    if (!isUuid(submissionRaw)) errors.submissionId = "Submission id must be a UUID.";
    else submissionId = submissionRaw.toLowerCase();
  }

  const value: InquiryInput = {
    name,
    email,
    company,
    phone,
    serviceCategory,
    teamSize,
    currentTools: tools,
    interest,
    workflowProblem: workflow,
    scenarioInterest,
    marketingConsent,
    sourcePath,
    submissionId,
    honeypot,
  };

  return { ok: Object.keys(errors).length === 0, errors, value: Object.keys(errors).length === 0 ? value : null };
}

export function canonicalPayload(value: InquiryInput): string {
  return JSON.stringify({
    name: value.name,
    email: value.email,
    company: value.company,
    phone: value.phone,
    serviceCategory: value.serviceCategory,
    teamSize: value.teamSize,
    currentTools: value.currentTools,
    interest: value.interest,
    workflowProblem: value.workflowProblem,
    scenarioInterest: value.scenarioInterest,
    marketingConsent: value.marketingConsent,
    sourcePath: value.sourcePath,
  });
}

export function neutralizeSpreadsheetFormula(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
