export type SolutionDelivery = "voice" | "chat";
export type SolutionGroup = "capture" | "guide" | "care" | "team";

export interface Solution {
  id: "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10";
  slug: string;
  name: string;
  delivery: SolutionDelivery;
  group: SolutionGroup;
  headline: string;
  problem: string;
  benefit: string;
  configuration: string;
  inclusions: string[];
  fit: string[];
  next: string;
  human: string;
  scope: string;
  bundleSlugs: string[];
  relatedSlugs: string[];
  demo: {
    title: string;
    turns: { speaker: "visitor" | "agent"; text: string }[];
    resultTitle: string;
    result: { label: string; value: string }[];
    next: string;
  };
}

export interface Bundle {
  slug: string;
  name: string;
  label: "A" | "B" | "C" | "D";
  delivery: SolutionDelivery;
  headline: string;
  summary: string;
  solutionSlugs: string[];
  steps: { title: string; description: string }[];
  branches: { title: string; description: string; recipient: string }[];
  fit: string;
  scope: string;
}

export const solutionGroups: { id: SolutionGroup; label: string; description: string }[] = [
  { id: "capture", label: "Capture inquiries", description: "Give missed calls and incomplete requests a useful next step." },
  { id: "guide", label: "Guide customers", description: "Help people find an answer, choose a service, or reach the right booking page." },
  { id: "care", label: "Care for customers", description: "Make getting started, asking for help, and leaving feedback clearer." },
  { id: "team", label: "Support your team", description: "Put approved procedures within reach of authorized staff." },
];

export const solutions: Solution[] = [
  {
    id: "01",
    slug: "after-hours-inquiry-capture",
    name: "After-Hours Inquiry Capture",
    delivery: "voice",
    group: "capture",
    headline: "Give after-hours callers a way to leave a useful request.",
    problem: "Callers reach your business while the team is busy or closed, leaving little context for a callback.",
    benefit: "Start the follow-up with the caller's needs and contact details together.",
    configuration: "CPL configures and manages a voice assistant with your approved service answers, intake questions, and team email recipient.",
    inclusions: [
      "A greeting that sets expectations when the team cannot answer.",
      "Answers to approved service questions.",
      "Caller needs, location, and callback information.",
      "A structured summary emailed to the business for follow-up.",
    ],
    fit: ["Flooring and home-service businesses", "Teams that receive inquiries outside staffed hours"],
    next: "The request goes to your configured team email so a person can review it and decide how to follow up.",
    human: "Your team checks the request, confirms service fit, and arranges any callback or appointment.",
    scope: "Inquiry capture only. No dispatch, guaranteed callback, or confirmed appointment is included.",
    bundleSlugs: ["phone-front-desk"],
    relatedSlugs: ["sales-call-screening-and-transfer", "ready-to-review-quote-requests"],
    demo: {
      title: "Fictional demo · an after-hours flooring request",
      turns: [
        { speaker: "visitor", text: "I'd like an estimate to replace the flooring in two bedrooms." },
        { speaker: "agent", text: "The team is closed. What size is the area, where is the property, and how can they reach you?" },
        { speaker: "visitor", text: "About 320 square feet in Brookside. I'm Casey; call +1 202-555-0147. I'm hoping for next month." },
        { speaker: "agent", text: "Here's the request for staff review. A person would confirm the work and any next steps." },
      ],
      resultTitle: "Sample callback brief",
      result: [
        { label: "Request", value: "Replace flooring in two bedrooms" },
        { label: "Size / location", value: "About 320 sq ft · Brookside" },
        { label: "Timing", value: "Hoping for next month" },
        { label: "Callback", value: "Casey · +1 202-555-0147" },
      ],
      next: "Example email summary for staff review. Nothing is sent and no appointment is confirmed in this demo.",
    },
  },
  {
    id: "02",
    slug: "sales-call-screening-and-transfer",
    name: "Sales Call Screening and Transfer",
    delivery: "voice",
    group: "capture",
    headline: "Give your team context before a sales call reaches them.",
    problem: "Staff interrupt their work to find out what each caller needs and whether the inquiry fits.",
    benefit: "Use approved questions to identify suitable callers before offering a transfer.",
    configuration: "CPL configures and manages a voice assistant with qualification questions, transfer criteria, one configured human number, and an unanswered-call fallback.",
    inclusions: [
      "Approved questions about the requested service and location.",
      "Business-defined criteria for offering a transfer.",
      "Transfer to one configured human number.",
      "If unanswered, capture a message and callback details, then email the team.",
    ],
    fit: ["Service businesses that screen new sales inquiries", "Small teams with one designated call recipient"],
    next: "Suitable callers are offered a transfer to the configured number. An unanswered call follows the agreed message-capture and email fallback.",
    human: "The person who answers takes over the conversation. Staff review fallback messages and decide when to respond.",
    scope: "Inbound screening with one configured human number, not complex multi-department routing. Transfer does not guarantee a person will answer.",
    bundleSlugs: ["phone-front-desk"],
    relatedSlugs: ["after-hours-inquiry-capture", "website-front-desk"],
    demo: {
      title: "Fictional demo · screen a service inquiry",
      turns: [
        { speaker: "visitor", text: "Can I speak with someone about replacing flooring in two bedrooms in Brookside?" },
        { speaker: "agent", text: "That fits this example's criteria. Simulated transfer to one configured human number: no answer. What callback details should the team review?" },
        { speaker: "visitor", text: "I'm Casey. My callback number is +1 202-555-0147." },
        { speaker: "agent", text: "The sample fallback captures your flooring request and callback details in an email summary for the team. This is a preview; nothing is sent." },
      ],
      resultTitle: "Sample transfer decision",
      result: [
        { label: "Service", value: "Bedroom flooring replacement" },
        { label: "Location", value: "Brookside · approved example area" },
        { label: "Transfer step", value: "Simulated attempt · one configured human number · unanswered" },
        { label: "If unanswered", value: "Capture callback details and email the team" },
        { label: "Callback", value: "Casey · +1 202-555-0147" },
      ],
      next: "Transfer preview only. No call is placed or connected and no message is sent in this demo.",
    },
  },
  {
    id: "03",
    slug: "ready-to-review-quote-requests",
    name: "Ready-to-Review Quote Requests",
    delivery: "chat",
    group: "capture",
    headline: "Turn a vague price question into a request your team can review.",
    problem: "Quote inquiries arrive without the project details needed for a useful response.",
    benefit: "Collect the essentials in one structured brief before your team follows up.",
    configuration: "CPL configures and manages a chat assistant that asks for project type, approximate size, location, timing, budget, and contact information, then emails the structured request to your team.",
    inclusions: [
      "Project type and approximate size questions.",
      "Location and preferred timing.",
      "Budget context, including when the customer has not set one.",
      "Contact information and a readable project brief.",
      "A structured request email for staff review.",
    ],
    fit: ["Remodelers and project-based service businesses", "Teams that need scope details before preparing a quote"],
    next: "Your configured recipient receives the request email. Staff review the scope, ask follow-up questions, and prepare any quote separately.",
    human: "A person assesses the work, decides what else is needed, and calculates or issues the quote.",
    scope: "Collects a quote request; it does not calculate prices, issue a quote, or commit the business to work.",
    bundleSlugs: ["lead-to-next-step"],
    relatedSlugs: ["service-selection-assistant", "booking-assistance"],
    demo: {
      title: "Fictional demo · a bathroom-remodel brief",
      turns: [
        { speaker: "visitor", text: "How much for a bathroom remodel?" },
        { speaker: "agent", text: "I can gather details for the team. What work, approximate size, location, timing, budget, and contact details should they review?" },
        { speaker: "visitor", text: "Replace the shower and vanity in a 60 sq ft bathroom in Brookside. This fall, budget not set. Casey at casey@example.com." },
        { speaker: "agent", text: "Here's your example project brief. A person would review it before discussing any quote." },
      ],
      resultTitle: "Sample project brief",
      result: [
        { label: "Project type", value: "Bathroom remodel · shower and vanity" },
        { label: "Approximate size", value: "60 sq ft" },
        { label: "Location", value: "Brookside" },
        { label: "Timing", value: "This fall" },
        { label: "Budget", value: "Not set · discuss options" },
        { label: "Contact information", value: "Casey · casey@example.com" },
      ],
      next: "Example request for staff review. Nothing is emailed and no quote is calculated or issued in this demo.",
    },
  },
  {
    id: "04",
    slug: "website-front-desk",
    name: "Website Front Desk",
    delivery: "chat",
    group: "guide",
    headline: "Give routine questions a clear answer on your website.",
    problem: "Visitors wait for basic answers while your team repeats the same information.",
    benefit: "Make approved service, hours, area, and policy information easy to find.",
    configuration: "CPL configures and manages a chat assistant using the services, opening hours, service areas, and policies your business approves.",
    inclusions: [
      "Answers grounded in your approved business information.",
      "Service-area and opening-hours guidance.",
      "Links to relevant service and policy pages.",
      "A clear contact path for questions outside the approved material.",
    ],
    fit: ["Businesses with repeated pre-sale questions", "Websites with useful information spread across several pages"],
    next: "Visitors can open the relevant page or use your approved contact path when they need a person.",
    human: "Your team approves the information and handles questions the assistant cannot answer from it.",
    scope: "Answers from approved content. No live account, inventory, availability, or operational lookup is implied.",
    bundleSlugs: ["lead-to-next-step"],
    relatedSlugs: ["service-selection-assistant", "booking-assistance"],
    demo: {
      title: "Fictional demo · area and opening-hours questions",
      turns: [
        { speaker: "visitor", text: "Do you serve Brookside, and when is the office open?" },
        { speaker: "agent", text: "In this example, Brookside is in the approved service area. Office hours are Monday to Friday, 9 am to 5 pm." },
        { speaker: "visitor", text: "Can I check what services you offer?" },
        { speaker: "agent", text: "The approved services page would be your next step. For a question outside that information, contact the team." },
      ],
      resultTitle: "Sample approved answers",
      result: [
        { label: "Service area", value: "Brookside · fictional approved area" },
        { label: "Office hours", value: "Mon–Fri · 9 am–5 pm · example hours" },
        { label: "Next page", value: "Business's approved services page" },
      ],
      next: "Illustrative answers from fictional business information. No live business lookup occurs.",
    },
  },
  {
    id: "05",
    slug: "service-selection-assistant",
    name: "Service Selection Assistant",
    delivery: "chat",
    group: "guide",
    headline: "Help visitors choose a service that fits what they need.",
    problem: "Visitors are unsure which service or package applies to their situation.",
    benefit: "Explain the relevant options and give the visitor a useful page to explore.",
    configuration: "CPL configures and manages a chat assistant with approved service comparisons, needs-based questions, and links to your existing service pages.",
    inclusions: [
      "Questions about the visitor's needs and situation.",
      "Clear comparisons using your approved service descriptions.",
      "Links to the relevant existing service page.",
      "A human contact path when the options need personal advice.",
    ],
    fit: ["Cleaning and other businesses with distinct service levels", "Teams explaining similar packages repeatedly"],
    next: "The visitor opens the suggested service page and chooses whether to inquire or use your existing next step.",
    human: "Your team defines the options and handles unusual requirements, eligibility, and any pricing discussion.",
    scope: "Guidance and links only. No checkout, live inventory, or invented personalized pricing.",
    bundleSlugs: ["lead-to-next-step"],
    relatedSlugs: ["website-front-desk", "ready-to-review-quote-requests", "booking-assistance"],
    demo: {
      title: "Fictional demo · compare cleaning options",
      turns: [
        { speaker: "visitor", text: "Should I choose regular, deep, or move-out cleaning?" },
        { speaker: "agent", text: "Are you maintaining an occupied home, looking for a more thorough clean, or moving out?" },
        { speaker: "visitor", text: "We're leaving the property empty at the end of our lease." },
        { speaker: "agent", text: "The example move-out service is intended for an empty property. Its service page explains what is included before you decide." },
      ],
      resultTitle: "Sample service comparison",
      result: [
        { label: "Regular", value: "Routine care for an occupied home" },
        { label: "Deep", value: "A more detailed clean" },
        { label: "Move-out", value: "An empty property at the end of a tenancy" },
        { label: "Suggested next page", value: "Move-out cleaning details" },
      ],
      next: "Example guidance only. The visitor would open the service page; no purchase or booking occurs.",
    },
  },
  {
    id: "06",
    slug: "new-customer-welcome-guide",
    name: "New-Customer Welcome Guide",
    delivery: "chat",
    group: "care",
    headline: "Help new customers arrive prepared for the next step.",
    problem: "New customers are unsure what to prepare, which resources to read, or what happens next.",
    benefit: "Put your approved preparation checklist and onboarding guidance in one conversation.",
    configuration: "CPL configures and manages a chat assistant with your onboarding steps, preparation checklists, approved resources, and contact instructions.",
    inclusions: [
      "An explanation of the first steps and what to expect.",
      "Preparation checklists for your service.",
      "Links to approved forms and resources.",
      "Instructions for reaching your team about exceptions.",
    ],
    fit: ["Consultation-based businesses", "Teams with a repeatable new-customer preparation process"],
    next: "The customer follows the checklist or opens the linked resources, then asks your team about anything specific to their situation.",
    human: "Your team answers individual questions and checks any required information or completed steps.",
    scope: "Preparation guidance only. It does not create accounts or verify that a customer completed a task.",
    bundleSlugs: ["customer-care"],
    relatedSlugs: ["booking-assistance", "first-line-troubleshooting", "complaint-and-feedback-intake"],
    demo: {
      title: "Fictional demo · prepare for a first consultation",
      turns: [
        { speaker: "visitor", text: "What should I prepare for my first consultation?" },
        { speaker: "agent", text: "For this example, bring your goals, a few reference photos, and approximate room measurements if available." },
        { speaker: "visitor", text: "I don't have exact measurements yet." },
        { speaker: "agent", text: "The example checklist allows estimates. Note what is uncertain and ask the consultant what they need next." },
      ],
      resultTitle: "Sample preparation checklist",
      result: [
        { label: "Bring", value: "Goals and reference photos" },
        { label: "Prepare if available", value: "Approximate measurements" },
        { label: "Ask a person", value: "Clarify missing details with the consultant" },
      ],
      next: "Example checklist only. No account is created and no preparation task is marked complete.",
    },
  },
  {
    id: "07",
    slug: "booking-assistance",
    name: "Booking Assistance",
    delivery: "chat",
    group: "guide",
    headline: "Help customers reach the right booking page with confidence.",
    problem: "Customers hesitate because they do not know which appointment to choose or what it involves.",
    benefit: "Explain the appointment options and point customers to your existing booking link.",
    configuration: "CPL configures and manages a chat assistant with approved appointment descriptions, preparation answers, and the correct existing booking links.",
    inclusions: [
      "Questions that clarify the type of appointment needed.",
      "Approved explanations of appointment options.",
      "Answers about preparation and what to expect.",
      "The existing booking link for the customer to use.",
    ],
    fit: ["Businesses with an existing online booking system", "Teams offering more than one appointment type"],
    next: "The customer opens the existing booking link, chooses an available time, and completes the booking in that system.",
    human: "Your team handles special requests and any appointment changes through its established process.",
    scope: "The customer completes booking in the linked system. This service does not book, reschedule, or cancel appointments autonomously.",
    bundleSlugs: ["lead-to-next-step"],
    relatedSlugs: ["service-selection-assistant", "website-front-desk", "new-customer-welcome-guide"],
    demo: {
      title: "Fictional demo · find the right appointment page",
      turns: [
        { speaker: "visitor", text: "I want to discuss a project, but I'm not ready to choose a service." },
        { speaker: "agent", text: "The example introductory consultation explains the options. Is this your first conversation with the team?" },
        { speaker: "visitor", text: "Yes, it is." },
        { speaker: "agent", text: "The existing introductory-consultation booking page would be the next step. You choose a time and complete booking there." },
      ],
      resultTitle: "Sample booking guidance",
      result: [
        { label: "Appointment type", value: "Introductory consultation" },
        { label: "Destination", value: "Business's existing booking page" },
        { label: "Who completes it", value: "The customer, in the linked booking system" },
      ],
      next: "Booking-link preview only. No time is selected and no appointment is booked, rescheduled, or cancelled.",
    },
  },
  {
    id: "08",
    slug: "first-line-troubleshooting",
    name: "First-Line Troubleshooting",
    delivery: "chat",
    group: "care",
    headline: "Give routine support questions a clear starting point.",
    problem: "Repeated basic setup questions delay customers and take time from your support team.",
    benefit: "Guide people through approved safe steps and show a human path when those steps do not resolve the issue.",
    configuration: "CPL configures and manages a chat assistant with your approved safe troubleshooting steps, stop conditions, and accurate human-contact instructions.",
    inclusions: [
      "Questions that identify a supported setup issue.",
      "Approved, safe steps in an understandable order.",
      "A clear stop when the steps do not resolve the problem.",
      "The agreed human-contact path and stated support hours or response expectations.",
    ],
    fit: ["Businesses with documented basic setup guidance", "Teams that regularly answer the same non-critical support questions"],
    next: "If the approved steps do not help, the customer is shown the agreed human-contact path. Availability and response expectations follow your actual support process.",
    human: "A person handles unresolved issues, checks the customer's situation, and decides whether further action is appropriate.",
    scope: "No password resets, remote repairs, or unsupported safety-critical advice. Human support is not presented as immediately available unless your configuration supports it.",
    bundleSlugs: ["customer-care"],
    relatedSlugs: ["new-customer-welcome-guide", "complaint-and-feedback-intake", "employee-procedure-help-desk"],
    demo: {
      title: "Fictional demo · a setup check and human next step",
      turns: [
        { speaker: "visitor", text: "The setup guide will not open in my browser." },
        { speaker: "agent", text: "Try the approved guide link, reload the page, then check that your browser is supported by the example instructions." },
        { speaker: "visitor", text: "I've tried those steps and still see an error." },
        { speaker: "agent", text: "Stop here and use the team's support contact with the error and steps tried. A person would review it during the stated support hours." },
      ],
      resultTitle: "Sample support handoff notes",
      result: [
        { label: "Issue", value: "Setup guide will not open" },
        { label: "Steps tried", value: "Approved link, reload, supported-browser check" },
        { label: "Status", value: "Unresolved · human review needed" },
        { label: "Next step", value: "Customer uses the approved support contact" },
      ],
      next: "Example guidance only. No repair, support ticket, or live human connection is created.",
    },
  },
  {
    id: "09",
    slug: "complaint-and-feedback-intake",
    name: "Complaint and Feedback Intake",
    delivery: "chat",
    group: "care",
    headline: "Give feedback a clear path to the person who can review it.",
    problem: "Complaints arrive in scattered messages without enough detail for staff to understand the issue.",
    benefit: "Collect the issue, contact details, and requested resolution in a concise review brief.",
    configuration: "CPL configures and manages a chat assistant that collects feedback, emails a summary to the responsible person, and offers your approved human-contact path.",
    inclusions: [
      "A calm prompt for what happened and relevant context.",
      "Contact information and the customer's desired resolution.",
      "A concise summary emailed to the responsible person.",
      "A human-contact option with accurate response expectations.",
    ],
    fit: ["Service businesses that need organized feedback", "Teams with a named person responsible for reviewing complaints"],
    next: "The configured responsible person receives the summary email. Customers also see the approved human-contact path.",
    human: "A person reviews the complaint, contacts the customer when appropriate, and decides on any resolution.",
    scope: "Feedback intake and notification only. No automatic refunds, support-system tickets, or guaranteed resolution.",
    bundleSlugs: ["customer-care"],
    relatedSlugs: ["first-line-troubleshooting", "new-customer-welcome-guide"],
    demo: {
      title: "Fictional demo · feedback ready for review",
      turns: [
        { speaker: "visitor", text: "The cleanup after our service visit was incomplete." },
        { speaker: "agent", text: "What was left unfinished, how can the team reach you, and what would you like them to review?" },
        { speaker: "visitor", text: "Packaging is still in the entryway. I'm Casey at casey@example.com. I'd like to discuss a return visit." },
        { speaker: "agent", text: "Here is the feedback brief. The responsible person would review your request and decide how to respond." },
      ],
      resultTitle: "Sample feedback brief",
      result: [
        { label: "Issue", value: "Packaging left in entryway after service" },
        { label: "Contact", value: "Casey · casey@example.com" },
        { label: "Desired resolution", value: "Discuss a return visit" },
        { label: "Recipient", value: "Business's designated feedback reviewer" },
      ],
      next: "Example notification summary. Nothing is sent; no refund, ticket, or resolution is issued.",
    },
  },
  {
    id: "10",
    slug: "employee-procedure-help-desk",
    name: "Employee Procedure Help Desk",
    delivery: "chat",
    group: "team",
    headline: "Help authorized staff find the approved way to do the work.",
    problem: "Staff repeatedly interrupt the owner to locate a documented procedure or training answer.",
    benefit: "Make approved SOPs and training guidance easier to use at the point of need.",
    configuration: "CPL configures and manages a staff-facing chat experience using approved SOPs and training material. Private material requires verified controlled access before it is made available.",
    inclusions: [
      "Answers drawn from approved procedures and training material.",
      "Clear steps and links to the relevant approved source.",
      "A manager path for missing, unclear, or exceptional situations.",
      "An access review and verified controlled access for private material.",
    ],
    fit: ["Teams with maintained SOPs and training material", "Businesses that can define and verify authorized staff access"],
    next: "An authorized staff member reads the relevant procedure and carries out the work, or asks the designated manager when judgment is needed.",
    human: "Your business approves the source material and staff access. Managers handle exceptions and approve procedure changes.",
    scope: "Private material requires verified controlled access; an ordinary public widget is not suitable for confidential staff information. No automatic synchronization with public agents or unrestricted customer-conversation access is included.",
    bundleSlugs: ["team-knowledge"],
    relatedSlugs: ["new-customer-welcome-guide", "first-line-troubleshooting"],
    demo: {
      title: "Fictional demo · find an opening procedure",
      turns: [
        { speaker: "visitor", text: "Where is the opening checklist for the front desk?" },
        { speaker: "agent", text: "This public example uses invented material only. The sample checklist is: check the work area, review the day plan, then prepare the welcome materials." },
        { speaker: "visitor", text: "What if something in the work area needs attention?" },
        { speaker: "agent", text: "Follow the approved exception process and ask the designated manager before continuing." },
      ],
      resultTitle: "Sample staff procedure",
      result: [
        { label: "Source", value: "Fictional opening checklist" },
        { label: "Steps", value: "Check work area → review day plan → prepare materials" },
        { label: "Exception", value: "Ask the designated manager" },
        { label: "Private deployment", value: "Verified controlled staff access required" },
      ],
      next: "Invented public example only. No private SOPs or customer conversations are accessed.",
    },
  },
];

export const bundles: Bundle[] = [
  {
    slug: "lead-to-next-step",
    name: "Lead to Next Step",
    label: "A",
    delivery: "chat",
    headline: "From the first question to the right next step.",
    summary: "One configured chat experience can answer routine questions, help visitors choose a service, then offer either a quote request or an existing booking link.",
    solutionSlugs: ["website-front-desk", "service-selection-assistant", "ready-to-review-quote-requests", "booking-assistance"],
    steps: [
      { title: "Answer the question", description: "Use approved services, hours, areas, and policies to orient the visitor." },
      { title: "Help choose a service", description: "Ask what the visitor needs and explain the relevant approved options." },
      { title: "Offer the appropriate next step", description: "Branch to a quote request OR a booking link; visitors do not have to complete both." },
    ],
    branches: [
      { title: "Request a quote", description: "Collect the six project and contact fields, then email a structured request for staff review. Staff prepare any quote separately.", recipient: "Configured staff email recipient" },
      { title: "Open a booking link", description: "Provide the existing appointment page. The customer chooses a time and completes booking in that system.", recipient: "Customer, using the existing booking system" },
    ],
    fit: "Businesses whose visitors need help choosing between requesting a project quote and booking an appointment.",
    scope: "One configured chat entry point. The quote email and customer-clicked booking link are alternative paths; no autonomous booking, CRM synchronization, or shared memory with a voice agent is implied.",
  },
  {
    slug: "phone-front-desk",
    name: "Phone Front Desk",
    label: "B",
    delivery: "voice",
    headline: "Give inbound callers a person or a clear message path.",
    summary: "Combine approved screening with a transfer to one configured number, or capture an inquiry for the team when a transfer is unsuitable or unanswered.",
    solutionSlugs: ["after-hours-inquiry-capture", "sales-call-screening-and-transfer"],
    steps: [
      { title: "Receive an inbound inquiry", description: "Greet the caller and explain the available next steps." },
      { title: "Ask approved screening questions", description: "Identify the requested service, location, and other agreed qualification details." },
      { title: "Transfer or capture", description: "Use the configured criteria and unanswered-call fallback to choose the appropriate path." },
    ],
    branches: [
      { title: "Offer a transfer", description: "Transfer a suitable caller to one configured human number. The person who answers takes over.", recipient: "Designated person at the configured number" },
      { title: "Capture a message", description: "If a transfer is unsuitable or unanswered, collect the caller's needs and callback details and email the summary.", recipient: "Configured team email recipient" },
    ],
    fit: "Small teams that want an organized response to inbound calls while preserving a clear role for a person.",
    scope: "Inbound calls only, not an outbound calling campaign. One configured human number, not complex departmental routing. No guaranteed answer, dispatch, or callback; voice and chat remain separate entry points.",
  },
  {
    slug: "customer-care",
    name: "Customer Care",
    label: "C",
    delivery: "chat",
    headline: "Meet customers at the point where they need help.",
    summary: "One configured chat experience may support three different needs: getting started, working through approved support steps, or leaving feedback for a person.",
    solutionSlugs: ["new-customer-welcome-guide", "first-line-troubleshooting", "complaint-and-feedback-intake"],
    steps: [
      { title: "Identify the need", description: "Ask whether the customer needs preparation guidance, basic support, or feedback intake." },
      { title: "Follow the relevant route", description: "Offer one appropriate path rather than making every customer complete all three." },
      { title: "Keep a human path visible", description: "Use approved contact instructions and describe actual support hours or response expectations." },
    ],
    branches: [
      { title: "Get started", description: "Explain the preparation checklist and link approved resources. The customer carries out the steps.", recipient: "Customer preparing for the service" },
      { title: "Ask for support", description: "Guide approved safe checks, then offer the human-contact path if unresolved.", recipient: "Customer, then the designated support person when contacted" },
      { title: "Leave feedback", description: "Collect the issue, contact details, and desired resolution; email the brief to the responsible person.", recipient: "Designated feedback reviewer by email" },
    ],
    fit: "Businesses with repeatable onboarding, documented basic support, and an identified feedback owner.",
    scope: "Three possible needs in one configured chat experience. No ticketing-system integration, automatic refunds, remote repair, guaranteed resolution, or immediate human availability is included by implication.",
  },
  {
    slug: "team-knowledge",
    name: "Team Knowledge",
    label: "D",
    delivery: "chat",
    headline: "Give the person helping a customer the procedure they need.",
    summary: "A staff-facing companion to the other bundles, using approved SOPs and training material behind verified controlled access when the material is private.",
    solutionSlugs: ["employee-procedure-help-desk"],
    steps: [
      { title: "Verify staff access", description: "Private material is available only through a deployment with verified controlled access." },
      { title: "Find the approved procedure", description: "An authorized employee asks a question and reads the relevant approved guidance." },
      { title: "Let the person act", description: "The employee uses the procedure to help the customer, or asks a manager when the situation is outside it." },
    ],
    branches: [
      { title: "Use the documented steps", description: "The employee applies the approved procedure in the business's existing process.", recipient: "Authorized employee" },
      { title: "Ask about an exception", description: "The employee contacts the designated manager when the procedure is missing, unclear, or does not cover the situation.", recipient: "Designated manager, contacted by the employee" },
    ],
    fit: "Businesses with approved internal procedures and a way to verify access for authorized staff.",
    scope: "A separate staff-facing companion, not an ordinary public widget for confidential material. No automatic synchronization with public agents, unrestricted access to customer conversations, or agent-to-agent handoff is implied.",
  },
];

export function getSolution(slug: string | null | undefined): Solution | undefined {
  return solutions.find((solution) => solution.slug === slug);
}

export function getBundle(slug: string | null | undefined): Bundle | undefined {
  return bundles.find((bundle) => bundle.slug === slug);
}

/** Resolve only catalog entries; keep the inquiry interest within its existing voice/chat contract. */
export function demoRequestHref(selection: { solution?: string; bundle?: string } = {}): string {
  const solution = getSolution(selection.solution);
  if (solution) {
    const query = new URLSearchParams({ solution: solution.slug, interest: solution.delivery });
    return `/demo/?${query.toString()}`;
  }
  const bundle = getBundle(selection.bundle);
  if (bundle) {
    const query = new URLSearchParams({ bundle: bundle.slug, interest: bundle.delivery });
    return `/demo/?${query.toString()}`;
  }
  return "/demo/";
}
