export type CapabilityStatus = "in-development" | "planned" | "needs-discussion" | "on-this-website";

export type Capability = {
  name: string;
  status: CapabilityStatus;
  publicMeaning: string;
  sourceNote: string;
};

export const SOURCE_REPO = "https://github.com/AaronStarrett/CPL-Command-Center-Public";
export const SOURCE_COMMIT = "25d294c8743a938466a6b8faf769f13f3c30a700";
export const SOURCE_REVIEWED = "2026-09-21";

export const capabilities: Capability[] = [
  {
    name: "Public website and sample walkthrough",
    status: "on-this-website",
    publicMeaning: "This site explains Command Center and runs a labeled sample. It is not the application.",
    sourceNote: "Built for this website. The walkthrough does not call the Command Center source.",
  },
  {
    name: "Hosted Command Center for customers",
    status: "in-development",
    publicMeaning: "Early access. Not generally available. The public source describes a development checkpoint whose production entry blocks customer operations.",
    sourceNote: "Public README and docs/PUBLIC_DEPLOYMENT.md. Deployment acceptance is not claimed.",
  },
  {
    name: "Lead intake and information check",
    status: "in-development",
    publicMeaning: "The development source includes these stages. They are not a live service on this website.",
    sourceNote: "Guided scenario marks lead intake and information check as runtime-backed. Production routes remain blocked.",
  },
  {
    name: "Proposal draft and human review",
    status: "in-development",
    publicMeaning: "Review can require a person. Sample proposals on this site are invented.",
    sourceNote: "Proposal statuses and approve or request-revision exist in the public domain model. The production catalog is unconfigured, and acceptance is not executable.",
  },
  {
    name: "Customer acceptance and e-signature",
    status: "planned",
    publicMeaning: "A person still owns acceptance. The website cannot record a real yes.",
    sourceNote: "Guided scenario marks customer decision as demonstration only. Acceptance is not connected.",
  },
  {
    name: "Project setup from an awarded job",
    status: "planned",
    publicMeaning: "Shown as a sample step. Not an automatic handoff you can buy today.",
    sourceNote: "Guided scenario marks project setup as deferred demonstration.",
  },
  {
    name: "Inspection record, validation, and report assembly",
    status: "in-development",
    publicMeaning: "The source includes these stages for a synthetic guided scenario. This website shows a separate sample.",
    sourceNote: "Inspection, data validation, report assembly, technical review, and executive approval are marked runtime-backed in the public guided scenario. Test mode and production gates still apply.",
  },
  {
    name: "Customer delivery of a report",
    status: "in-development",
    publicMeaning: "No message is sent from this website or from the sample.",
    sourceNote: "Client delivery in the public scenario uses a local test adapter and does not perform an external send.",
  },
  {
    name: "Invoice readiness and accounting handoff",
    status: "planned",
    publicMeaning: "The sample can show a handoff waiting on a person. It does not create an invoice.",
    sourceNote: "Billing and closeout are marked as demonstration. Accounting is not connected.",
  },
  {
    name: "Scheduling and field updates",
    status: "in-development",
    publicMeaning: "Scheduler and work screens exist in the source. This site does not treat them as verified production behavior.",
    sourceNote: "Routes such as the scheduler are present. Their hosted behavior was not exercised for this website.",
  },
  {
    name: "Workflow configuration per company",
    status: "in-development",
    publicMeaning: "The intended model is one platform configured per company, not a new app each time. Configuration is not a self-serve product yet.",
    sourceNote: "Tenant settings, catalogs, and templates exist in the public source. The foundation notes say this does not by itself adopt the commercial engine, and onboarding routes are blocked.",
  },
  {
    name: "Live connections to other systems",
    status: "needs-discussion",
    publicMeaning: "Integrations are chosen per company. Nothing on this site is a live connection, and Command Center does not replace your CRM, accounting, or field tools.",
    sourceNote: "Public integration defaults are mock or unavailable providers, including Entra ID, Graph, Outlook, Teams, SharePoint, and unresolved CRM, accounting, timekeeping, telephone, and e-signature slots.",
  },
  {
    name: "Product login",
    status: "planned",
    publicMeaning: "No public sign-in is offered. Hosted authentication is unfinished in the source.",
    sourceNote: "Public deployment notes: hosted identity adapter is a deployment blocker.",
  },
];

export const integrations = [
  { name: "Microsoft Entra ID", state: "In development", note: "Mock or unavailable provider in the public source." },
  { name: "Microsoft Graph", state: "In development", note: "Mock or unavailable provider in the public source." },
  { name: "Outlook email", state: "In development", note: "Not a live mailbox. This website does not send mail." },
  { name: "Outlook calendar", state: "In development", note: "Not connected. The demo does not book time." },
  { name: "Microsoft Teams", state: "In development", note: "Scope is unresolved in the public source." },
  { name: "SharePoint", state: "In development", note: "Not a live document store for this website." },
  { name: "CRM", state: "Needs a discussion", note: "Provider is unresolved. Command Center does not replace a CRM." },
  { name: "Accounting", state: "Needs a discussion", note: "Not connected. The sample does not create invoices." },
  { name: "Timekeeping", state: "Needs a discussion", note: "Provider is unresolved." },
  { name: "Telephone", state: "Needs a discussion", note: "Provider is unresolved." },
  { name: "E-signature", state: "Needs a discussion", note: "Acceptance is not executable in the public source." },
  { name: "AI, speech, and embeddings", state: "In development", note: "Not used by this website. Provider use in the app is separately gated." },
] as const;

export function statusLabel(status: CapabilityStatus): string {
  if (status === "in-development") return "In development";
  if (status === "planned") return "Planned";
  if (status === "needs-discussion") return "Needs a discussion";
  return "On this website";
}
