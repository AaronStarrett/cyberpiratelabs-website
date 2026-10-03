export type AgentMode = "voice" | "chat";
export type ScenarioId = "remodeling" | "cleaning" | "home-service" | "billing";
export type Capture = { key: string; label: string; value: string };
export type AgentMessage = {
  speaker: "agent" | "visitor";
  text: string;
  capture?: Capture[];
};
export type AgentScenario = {
  id: ScenarioId;
  label: string;
  business: string;
  initials: string;
  setting: string;
  kind: "inquiry" | "handoff";
  approvedInformation: string;
  stories: Record<AgentMode, AgentMessage[]>;
};

const message = (
  speaker: AgentMessage["speaker"],
  text: string,
  capture: Capture[] = [],
): AgentMessage => ({ speaker, text, capture });
const field = (key: string, label: string, value: string): Capture => ({ key, label, value });
const remodelFinish = "Team review and follow-up requested.";
const cleaningFinish = "Team review and cleaning follow-up requested.";
const homeFinish = "Team review and maintenance follow-up requested.";
const billingFinish = "Human billing follow-up requested. This handoff is simulated.";

export const agentScenarios: AgentScenario[] = [
  {
    id: "remodeling",
    label: "Bathroom remodel",
    business: "Juniper Remodeling",
    initials: "JR",
    setting: "Illustrative after-hours inquiry · 7:42 PM",
    kind: "inquiry",
    approvedInformation: "Fictional remodeler offering bathroom and kitchen remodeling in Carmel.",
    stories: {
      voice: [
        message("agent", "Juniper Remodeling’s automated assistant. What are you planning?"),
        message("visitor", "A bathroom remodel at my home in Carmel.", [
          field("service", "Requested service", "bathroom remodel"),
          field("area", "Requested area", "Carmel"),
        ]),
        message("agent", "Is this a full remodel or a partial update?"),
        message("visitor", "A full remodel, including the shower and vanity.", [
          field("details", "Project details", "full remodel, including the shower and vanity"),
        ]),
        message("agent", "What timing do you have in mind?"),
        message("visitor", "I’m hoping to start this fall.", [field("timing", "Desired timing", "this fall")]),
        message("agent", "What name and email should the team use for follow-up?"),
        message("visitor", "Jamie Example. My email is jamie@example.com.", [
          field("name", "Sample contact", "Jamie Example"),
          field("email", "Sample email", "jamie@example.com"),
        ]),
        message("agent", remodelFinish + " Scope and availability need review. No appointment or quote is confirmed.", [
          field("next", "Next step", remodelFinish),
        ]),
      ],
      chat: [
        message("visitor", "Do you handle bathroom remodeling in Carmel?"),
        message("agent", "Yes—bathroom and kitchen remodeling in Carmel. A full remodel or partial update?"),
        message("visitor", "A full bathroom remodel, including the shower and vanity.", [
          field("service", "Requested service", "bathroom remodel"),
          field("details", "Project details", "shower and vanity"),
        ]),
        message("agent", "Where is the project, and what timing do you have in mind?"),
        message("visitor", "Carmel. I’m hoping to start this fall.", [
          field("area", "Requested area", "Carmel"),
          field("timing", "Desired timing", "this fall"),
        ]),
        message("agent", "May I have a name and email for the team to follow up?"),
        message("visitor", "Jamie Example, jamie@example.com.", [
          field("name", "Sample contact", "Jamie Example"),
          field("email", "Sample email", "jamie@example.com"),
        ]),
        message("agent", remodelFinish + " Scope and availability need review. This is not a confirmed booking.", [
          field("next", "Next step", remodelFinish),
        ]),
      ],
    },
  },
  {
    id: "cleaning",
    label: "Recurring cleaning",
    business: "Clearview Cleaning",
    initials: "CC",
    setting: "Illustrative evening inquiry · 6:18 PM",
    kind: "inquiry",
    approvedInformation: "Fictional cleaner offering recurring home cleaning in Fishers.",
    stories: {
      voice: [
        message("agent", "Clearview Cleaning’s automated assistant. How can I help?"),
        message("visitor", "I’m looking for recurring home cleaning in Fishers.", [
          field("service", "Requested service", "recurring home cleaning"),
          field("area", "Requested area", "Fishers"),
        ]),
        message("agent", "What size is the home, and how often would you like it cleaned?"),
        message("visitor", "Three bedrooms and two bathrooms, every two weeks.", [
          field("details", "Home details", "Three bedrooms and two bathrooms"),
          field("frequency", "Requested frequency", "every two weeks"),
        ]),
        message("agent", "When would you like to begin?"),
        message("visitor", "Next month, if possible.", [field("timing", "Desired timing", "Next month")]),
        message("agent", "What name and email should the team use to contact you?"),
        message("visitor", "Alex Example, alex@example.com.", [
          field("name", "Sample contact", "Alex Example"),
          field("email", "Sample email", "alex@example.com"),
        ]),
        message("agent", cleaningFinish + " Schedule and pricing need to be discussed with the team.", [
          field("next", "Next step", cleaningFinish),
        ]),
      ],
      chat: [
        message("visitor", "Do you offer recurring home cleaning in Fishers?"),
        message("agent", "Yes—recurring home cleaning in Fishers. How large is your home, and how often?"),
        message("visitor", "Three bedrooms and two bathrooms, every two weeks.", [
          field("details", "Home details", "Three bedrooms and two bathrooms"),
          field("frequency", "Requested frequency", "every two weeks"),
        ]),
        message("agent", "Please confirm your location, service, and preferred start time."),
        message("visitor", "Recurring home cleaning in Fishers. Next month, if possible.", [
          field("service", "Requested service", "Recurring home cleaning"),
          field("area", "Requested area", "Fishers"),
          field("timing", "Desired timing", "Next month"),
        ]),
        message("agent", "What name and email can the team use for follow-up?"),
        message("visitor", "Alex Example, alex@example.com.", [
          field("name", "Sample contact", "Alex Example"),
          field("email", "Sample email", "alex@example.com"),
        ]),
        message("agent", cleaningFinish + " Schedule and pricing still need team confirmation.", [
          field("next", "Next step", cleaningFinish),
        ]),
      ],
    },
  },
  {
    id: "home-service",
    label: "Home maintenance",
    business: "Oakline Home Services",
    initials: "OH",
    setting: "Illustrative after-hours inquiry · 8:06 PM",
    kind: "inquiry",
    approvedInformation: "Fictional home-service company offering routine gutter maintenance in Westfield.",
    stories: {
      voice: [
        message("agent", "Oakline Home Services’ automated assistant. What can I help with?"),
        message("visitor", "Routine gutter cleaning for my home in Westfield.", [
          field("service", "Requested service", "gutter cleaning"),
          field("area", "Requested area", "Westfield"),
        ]),
        message("agent", "How many stories is the home?"),
        message("visitor", "A two-story home. There’s no urgent problem.", [
          field("details", "Home details", "two-story home"),
        ]),
        message("agent", "What timing would you prefer?"),
        message("visitor", "Sometime next month.", [field("timing", "Desired timing", "next month")]),
        message("agent", "What name and email can the team use for follow-up?"),
        message("visitor", "Taylor Example, taylor@example.com.", [
          field("name", "Sample contact", "Taylor Example"),
          field("email", "Sample email", "taylor@example.com"),
        ]),
        message("agent", homeFinish + " The team needs to review access, scope, and scheduling.", [
          field("next", "Next step", homeFinish),
        ]),
      ],
      chat: [
        message("visitor", "Do you offer gutter cleaning in Westfield?"),
        message("agent", "Yes—routine gutter maintenance in Westfield. How many stories is your home?"),
        message("visitor", "It’s a two-story home, and I’d like gutter cleaning.", [
          field("service", "Requested service", "gutter cleaning"),
          field("details", "Home details", "two-story home"),
        ]),
        message("agent", "Where is the home, and what timing would you prefer?"),
        message("visitor", "Westfield. Sometime next month.", [
          field("area", "Requested area", "Westfield"),
          field("timing", "Desired timing", "next month"),
        ]),
        message("agent", "What name and email can the team use to follow up?"),
        message("visitor", "Taylor Example, taylor@example.com.", [
          field("name", "Sample contact", "Taylor Example"),
          field("email", "Sample email", "taylor@example.com"),
        ]),
        message("agent", homeFinish + " Access, scope, and scheduling require team review.", [
          field("next", "Next step", homeFinish),
        ]),
      ],
    },
  },
  {
    id: "billing",
    label: "Human billing handoff",
    business: "Juniper Remodeling",
    initials: "JR",
    setting: "Illustrative request outside agent scope",
    kind: "handoff",
    approvedInformation: "Billing and account decisions must go to the fictional business team.",
    stories: {
      voice: [
        message("agent", "Juniper Remodeling’s automated assistant. How can I help?"),
        message("visitor", "I have a billing question about my September invoice.", [
          field("service", "Request", "billing question"),
          field("details", "Question about", "September invoice"),
        ]),
        message("agent", "Billing needs a person. May I have your name and email? I can’t access or change your account."),
        message("visitor", "Morgan Example, morgan@example.com.", [
          field("name", "Sample contact", "Morgan Example"),
          field("email", "Sample email", "morgan@example.com"),
        ]),
        message("agent", billingFinish, [field("next", "Next step", billingFinish)]),
      ],
      chat: [
        message("visitor", "I have a billing question about my September invoice.", [
          field("service", "Request", "billing question"),
          field("details", "Question about", "September invoice"),
        ]),
        message("agent", "Billing needs a person. May I have your name and email? I can’t access or change your account."),
        message("visitor", "Morgan Example, morgan@example.com.", [
          field("name", "Sample contact", "Morgan Example"),
          field("email", "Sample email", "morgan@example.com"),
        ]),
        message("agent", billingFinish, [field("next", "Next step", billingFinish)]),
      ],
    },
  },
];

export function getAgentScenario(id: ScenarioId): AgentScenario {
  return agentScenarios.find((scenario) => scenario.id === id) ?? agentScenarios[0]!;
}
export type AgentBeat = { through: number; duration: number; label: string };
export const RESULT_HOLD_MS = 2500;

const routineVoice: AgentBeat[] = [
  { through: 1, duration: 2500, label: "An inquiry arrives" },
  { through: 3, duration: 4000, label: "The project becomes clearer" },
  { through: 5, duration: 3500, label: "Useful details take shape" },
  { through: 7, duration: 3500, label: "Contact details are organized" },
  { through: 8, duration: 4000, label: "The next step becomes clear" },
];
const routineChat: AgentBeat[] = [
  { through: 1, duration: 2500, label: "A question gets an approved answer" },
  { through: 2, duration: 4000, label: "The request becomes clearer" },
  { through: 4, duration: 3500, label: "Useful details take shape" },
  { through: 6, duration: 3500, label: "Contact details are organized" },
  { through: 7, duration: 4000, label: "The next step becomes clear" },
];
const billingVoice: AgentBeat[] = [
  { through: 1, duration: 2500, label: "A billing question arrives" },
  { through: 2, duration: 4500, label: "The agent recognizes its boundary" },
  { through: 3, duration: 5500, label: "Follow-up details are gathered" },
  { through: 4, duration: 5000, label: "A human follow-up is requested" },
];
const billingChat: AgentBeat[] = [
  { through: 0, duration: 2500, label: "A billing question arrives" },
  { through: 1, duration: 4500, label: "The agent recognizes its boundary" },
  { through: 2, duration: 5500, label: "Follow-up details are gathered" },
  { through: 3, duration: 5000, label: "A human follow-up is requested" },
];

/** Message groups are meaningful beats; the complete transcript remains available. */
export function getAgentBeats(scenario: ScenarioId, mode: AgentMode): AgentBeat[] {
  return scenario === "billing"
    ? mode === "voice" ? billingVoice : billingChat
    : mode === "voice" ? routineVoice : routineChat;
}