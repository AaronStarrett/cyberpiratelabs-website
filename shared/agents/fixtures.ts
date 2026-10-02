export type AgentMode = "voice" | "chat";
export type ScenarioId = "remodeling" | "cleaning" | "home-service" | "billing";
export type Capture = { key: string; label: string; value: string };
export type AgentMessage = {
  speaker: "agent" | "visitor";
  text: string;
  duration: number;
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
  duration = 3100,
): AgentMessage => ({ speaker, text, duration, capture });
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
        message("agent", "Thank you for calling Juniper Remodeling. I’m the automated assistant. What are you planning?"),
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
        message("agent", remodelFinish + " The team can discuss scope and availability; no appointment or quote is confirmed.", [
          field("next", "Next step", remodelFinish),
        ], 4000),
      ],
      chat: [
        message("visitor", "Do you handle bathroom remodeling in Carmel?"),
        message("agent", "Yes. Juniper Remodeling offers bathroom and kitchen remodeling in Carmel. Are you considering a full remodel or a partial update?"),
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
        message("agent", remodelFinish + " The team will need to discuss scope and availability; this is not a confirmed booking.", [
          field("next", "Next step", remodelFinish),
        ], 4000),
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
        message("agent", "Thanks for calling Clearview Cleaning. I’m the automated assistant. How can I help?"),
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
        ], 4000),
      ],
      chat: [
        message("visitor", "Do you offer recurring home cleaning in Fishers?"),
        message("agent", "Yes. Clearview Cleaning offers recurring home cleaning in Fishers. How large is your home, and how often would you like cleaning?"),
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
        ], 4000),
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
        message("agent", "You’ve reached Oakline Home Services. I’m the automated assistant. What can I help you with?"),
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
        ], 4000),
      ],
      chat: [
        message("visitor", "Do you offer gutter cleaning in Westfield?"),
        message("agent", "Yes. Oakline Home Services offers routine gutter maintenance in Westfield. How many stories is your home?"),
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
        ], 4000),
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
        message("agent", "Thank you for calling Juniper Remodeling. I’m the automated assistant. How can I help?"),
        message("visitor", "I have a billing question about my September invoice.", [
          field("service", "Request", "billing question"),
          field("details", "Question about", "September invoice"),
        ]),
        message("agent", "A person needs to review billing questions. I can collect a name and email for follow-up; I can’t access or change your account."),
        message("visitor", "Morgan Example, morgan@example.com.", [
          field("name", "Sample contact", "Morgan Example"),
          field("email", "Sample email", "morgan@example.com"),
        ]),
        message("agent", billingFinish, [field("next", "Next step", billingFinish)], 4000),
      ],
      chat: [
        message("visitor", "I have a billing question about my September invoice.", [
          field("service", "Request", "billing question"),
          field("details", "Question about", "September invoice"),
        ]),
        message("agent", "Billing questions need a person. I can collect a name and email for follow-up, but I can’t access or change your account."),
        message("visitor", "Morgan Example, morgan@example.com.", [
          field("name", "Sample contact", "Morgan Example"),
          field("email", "Sample email", "morgan@example.com"),
        ]),
        message("agent", billingFinish, [field("next", "Next step", billingFinish)], 4000),
      ],
    },
  },
];

export function getAgentScenario(id: ScenarioId): AgentScenario {
  return agentScenarios.find((scenario) => scenario.id === id) ?? agentScenarios[0]!;
}