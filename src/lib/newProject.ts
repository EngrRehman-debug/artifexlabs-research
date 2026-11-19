/*
 * New Project – all fields from the reference "New project" wizard
 * (Charter → Organization → Delivery → Controls → Review), asked one at a time in chat.
 */

export type Workstream = {
  name: string;
  department: string;
  team: string;
  output: string;
  owner: string;
  reviewer: string;
  start: string;
  due: string;
  dependencies: string;
};

export type Gate = {
  name: string;
  /** decision owner (Figma "Decision Owner") */
  owner: string;
  approver: string;
  date: string;
  criteria: string;
  workstreams: string[];
  /** "Require all linked research packages to be accepted" */
  requireAll: boolean;
};

export type Risk = {
  risk: string;
  owner: string;
  severity: string;
  response: string;
};

export type Draft = {
  prompt: string;
  files: string[];
  /* 01 Charter */
  name: string;
  type: string;
  objective: string;
  governance: string;
  priority: string;
  programme: string;
  businessUnit: string;
  start: string;
  target: string;
  /** business case / background for the scope */
  background: string;
  inScope: string;
  outScope: string;
  deliverable: string;
  measures: string;
  assumptions: string;
  dependencies: string;
  /* 02 Organization */
  sponsor: string;
  lead: string;
  departments: string[];
  teamMode: string;
  teams: string[];
  steering: string[];
  stakeholders: string;
  /** Figma "Stakeholder And Decision Notes" */
  decisionNotes: string;
  /** Figma "External Organizations" (comma-separated) */
  externalOrgs: string;
  /* 03 Delivery */
  workstreams: Workstream[];
  gates: Gate[];
  risks: Risk[];
  noRiskReason: string;
  approach: string;
  reporting: string;
  budget: string;
  currency: string;
  costCentre: string;
  resources: string;
  /* 04 Controls */
  controlsMode: string;
  visibility: string;
  classification: string;
  planEditing: string;
  manageAccess: string;
  approvals: string;
  changeAuth: string;
  standards: string;
  qualityLead: string;
  /** Figma "Gate Approval Rule" */
  gateRule: string;
  regControls: string[];
  dataLocation: string;
  retention: string;
  externalAccess: string;
};

export const PEOPLE = [
  { name: "Ibrahim Ghatila", role: "Admin · Leadership" },
  { name: "Sarah Chen", role: "Member · Research" },
  { name: "Omar Patel", role: "Member · Engineering" },
];

export const PROJECT_TYPES = [
  "Research & Development",
  "Engineering & Validation",
  "Technology Evaluation",
  "Regulatory & Quality",
  "Operational Change",
  "Commercial Assessment",
  "Other",
];

export const GOVERNANCE = [
  { value: "Standard", desc: "Light oversight for low-risk, internal work" },
  { value: "Controlled", desc: "Formal decision gates and approvals (recommended)" },
  { value: "Regulated / safety-critical", desc: "Adds quality, records and regulatory controls" },
];

export const PRIORITIES = [
  { value: "Normal", desc: "Planned alongside other work" },
  { value: "High", desc: "Gets resources ahead of normal projects" },
  { value: "Critical", desc: "Business-critical, escalated reporting" },
];

export const DEPARTMENTS = [
  "Research & Development",
  "Engineering",
  "Quality & Regulatory Affairs",
  "Manufacturing",
  "Operations",
  "Commercial & Marketing",
  "Finance",
  "Human Resources",
  "Procurement & Supply Chain",
  "Legal",
  "Digital & Information Technology",
  "Project Management Office",
  "Health, Safety & Environment",
  "Strategy & Corporate Development",
];

/* Teams per department (Figma "Participating Teams": name, department lead, code · people). */
export type Team = { name: string; code: string; lead: string; people: number };
const TEAM_DATA: Record<string, Team[]> = {
  "Research & Development": [
    { name: "Discovery Research", code: "RND-DIS", lead: "Sarah Chen", people: 1 },
    { name: "Applied Research", code: "RND-APP", lead: "Sarah Chen", people: 3 },
  ],
  Engineering: [
    { name: "Systems Engineering", code: "ENG-SYS", lead: "Omar Patel", people: 2 },
    { name: "Process Engineering", code: "ENG-PRO", lead: "Omar Patel", people: 2 },
  ],
  "Quality & Regulatory Affairs": [
    { name: "Quality Assurance", code: "QRA-QA", lead: "Ibrahim Ghatila", people: 1 },
    { name: "Regulatory Affairs", code: "QRA-REG", lead: "Ibrahim Ghatila", people: 1 },
  ],
  "Commercial & Marketing": [{ name: "Market Insights", code: "COM-MKT", lead: "Omar Patel", people: 2 }],
  Finance: [{ name: "Financial Planning", code: "FIN-FPA", lead: "Ibrahim Ghatila", people: 1 }],
  Operations: [{ name: "Site Operations", code: "OPS-SITE", lead: "Omar Patel", people: 3 }],
};
const teamsOf = (dept: string): Team[] =>
  TEAM_DATA[dept] ?? [{ name: `${dept.split(/[ &,]/)[0]} Core Team`, code: dept.slice(0, 3).toUpperCase() + "-CORE", lead: "Ibrahim Ghatila", people: 1 }];
/** team ids are "Department · Team name" */
export const teamsFor = (dept: string) => teamsOf(dept).map((t) => `${dept} · ${t.name}`);
export function teamInfo(id: string): (Team & { department: string }) | null {
  const [department, name] = id.split(" · ");
  const t = teamsOf(department).find((x) => x.name === name);
  return t ? { ...t, department } : null;
}

export const GATE_RULES = ["Sponsor and accountable reviewers", "Project lead", "Steering group", "Quality and project lead"];

export const TEAM_MODES = [
  { value: "Assign participating teams now", desc: "Pick the teams that will do the work" },
  { value: "Department leads assign their teams later", desc: "Each department lead staffs their part" },
];

export const APPROACHES = ["Phased", "Iterative", "Hybrid"];
export const REPORTING = ["Weekly", "Fortnightly", "Monthly", "At decision gates"];
export const CURRENCIES = ["USD", "GBP", "EUR", "MYR", "PKR"];
export const SEVERITIES = ["Low", "Medium", "High"];

export const CONTROL_FIELDS = [
  { key: "visibility", label: "Project Visibility", options: ["Project members only", "Organization summary"] },
  { key: "classification", label: "Information Classification", options: ["Internal", "Confidential", "Restricted", "Public"] },
  { key: "planEditing", label: "Research Plan Editing", options: ["Project lead and admins", "Project members"] },
  { key: "manageAccess", label: "Manage Project Access", options: ["Project lead and admins", "Admins only"] },
  { key: "approvals", label: "Research Approvals", options: ["Project lead", "Department reviewers, then project lead"] },
  { key: "changeAuth", label: "Change Authorization", options: ["Project lead", "Sponsor and project lead", "Steering group", "Quality and project lead"] },
] as const;

export type ControlKey = (typeof CONTROL_FIELDS)[number]["key"];

/* Figma "Quality And Assurance" checkboxes */
export const REG_CONTROLS = ["Independent acceptance", "Evidence traceability", "Record decisions and changes"];

export const EXTERNAL_ACCESS = [
  { value: "No external access", desc: "Only people inside the organization" },
  { value: "Named external reviewers", desc: "Partners can review, not edit" },
  { value: "Named external contributors", desc: "Partners can contribute content" },
];

export function recommendedControls(governance: string): Record<ControlKey, string> {
  if (governance === "Standard")
    return {
      visibility: "Organization summary",
      classification: "Internal",
      planEditing: "Project members",
      manageAccess: "Project lead and admins",
      approvals: "Project lead",
      changeAuth: "Project lead",
    };
  if (governance.startsWith("Regulated"))
    return {
      visibility: "Project members only",
      classification: "Restricted",
      planEditing: "Project lead and admins",
      manageAccess: "Admins only",
      approvals: "Department reviewers, then project lead",
      changeAuth: "Quality and project lead",
    };
  return {
    visibility: "Project members only",
    classification: "Confidential",
    planEditing: "Project lead and admins",
    manageAccess: "Project lead and admins",
    approvals: "Department reviewers, then project lead",
    changeAuth: "Sponsor and project lead",
  };
}

export const emptyWorkstream = (department = DEPARTMENTS[0]): Workstream => ({
  name: "",
  department,
  team: "",
  output: "",
  owner: "",
  reviewer: "",
  start: "",
  due: "",
  dependencies: "",
});
export const emptyGate = (): Gate => ({ name: "", owner: "", approver: "", date: "", criteria: "", workstreams: [], requireAll: false });
export const emptyRisk = (): Risk => ({ risk: "", owner: "", severity: "Medium", response: "" });

export const EMPTY_DRAFT: Draft = {
  prompt: "",
  files: [],
  name: "",
  type: "Research & Development",
  objective: "",
  governance: "Controlled",
  priority: "Normal",
  programme: "",
  businessUnit: "",
  start: "",
  target: "",
  background: "",
  inScope: "",
  outScope: "",
  deliverable: "",
  measures: "",
  assumptions: "",
  dependencies: "",
  sponsor: "Ibrahim Ghatila",
  lead: "Ibrahim Ghatila",
  departments: ["Research & Development"],
  teamMode: TEAM_MODES[0].value,
  teams: [],
  steering: [],
  stakeholders: "",
  decisionNotes: "",
  externalOrgs: "",
  workstreams: [],
  gates: [],
  risks: [],
  noRiskReason: "",
  approach: "Phased",
  reporting: "Monthly",
  budget: "",
  currency: "USD",
  costCentre: "",
  resources: "",
  controlsMode: "",
  ...recommendedControls("Controlled"),
  standards: "",
  qualityLead: "",
  gateRule: GATE_RULES[0],
  regControls: [],
  dataLocation: "",
  retention: "",
  externalAccess: "No external access",
};

/* ---------------- "AI" suggestions (deterministic templates, no model call) ---------------- */

const has = (t: string, ...words: string[]) => words.some((w) => t.includes(w));

export const WS_BY_DEPT: Record<string, { name: string; output: string }> = {
  "Research & Development": { name: "Research and experimental validation", output: "Validated research findings" },
  Engineering: { name: "Technology and systems engineering", output: "Technical option assessment" },
  "Commercial & Marketing": { name: "Commercial feasibility", output: "Market and demand assessment" },
  Finance: { name: "Financial scenario modelling", output: "Cost model and scenarios" },
  "Quality & Regulatory Affairs": { name: "Regulatory and quality review", output: "Compliance assessment" },
  Operations: { name: "Operational readiness", output: "Implementation readiness plan" },
};

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => (w.length > 3 || /^[A-Z]/.test(w) ? w[0].toUpperCase() + w.slice(1) : w));
}

export function suggestName(prompt: string) {
  const cleaned = prompt
    .replace(/[.?!][\s\S]*$/, "")
    .replace(/^(please\s+)?(investigate|assess|evaluate|explore|study|analy[sz]e|research|determine|review|understand)\s+/i, "")
    .replace(/^(the|a|an|whether|if|how)\s+/i, "")
    .trim();
  const STOP = /^(at|in|on|of|for|to|and|or|the|a|an|with|by|from|our|including|across)$/i;
  /* keep the subject only: "hydrogen energy feasibility for industrial operations" -> "Hydrogen Energy Feasibility" */
  const subject = cleaned.split(/,|;| - /)[0].split(/\s+(?:for|in|at|across|within|to)\s+/i)[0];
  const words = subject.split(/\s+/).slice(0, 7);
  while (words.length > 1 && STOP.test(words[words.length - 1])) words.pop();
  const out = words.join(" ");
  return out ? titleCase(out) : "";
}

export function suggestFromPrompt(prompt: string): Partial<Draft> {
  const t = prompt.toLowerCase();
  const type = has(t, "commercial", "market", "viabil", "pricing", "demand")
    ? "Commercial Assessment"
    : has(t, "regulat", "complian", "certif")
      ? "Regulatory & Quality"
      : has(t, "compare", "comparison", "technology", "option")
        ? "Technology Evaluation"
        : has(t, "validat", "prototype", "test", "engineer")
          ? "Engineering & Validation"
          : has(t, "rollout", "process change", "adoption")
            ? "Operational Change"
            : "Research & Development";

  const departments = new Set(["Research & Development"]);
  if (has(t, "technolog", "engineer", "heat", "energy", "hydrogen", "system", "design")) departments.add("Engineering");
  if (has(t, "commercial", "market", "viabil", "customer", "demand")) departments.add("Commercial & Marketing");
  if (has(t, "cost", "financ", "budget", "viabil", "invest", "roi")) departments.add("Finance");
  if (has(t, "regulat", "safety", "quality", "complian")) departments.add("Quality & Regulatory Affairs");
  if (has(t, "operation", "plant", "site", "manufactur")) departments.add("Operations");
  const deps = DEPARTMENTS.filter((d) => departments.has(d));

  /* propose just one workstream; the user adds more in the Workstreams step */
  const workstreams = deps
    .filter((d) => WS_BY_DEPT[d])
    .slice(0, 1)
    .map((d) => ({
      ...emptyWorkstream(d),
      ...WS_BY_DEPT[d],
      team: teamsFor(d)[0],
      owner: PEOPLE[1].name,
      reviewer: PEOPLE[2].name,
    }));

  const regulated = has(t, "regulat", "safety", "complian", "certif");
  const today = new Date();
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const target = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate() + 14);
  const name = suggestName(prompt);
  for (const w of workstreams) {
    w.start = iso(today);
    w.due = iso(target);
  }

  return {
    name,
    type,
    governance: regulated ? "Regulated / safety-critical" : has(t, "invest", "pilot", "budget") ? "Controlled" : "Standard",
    priority: has(t, "urgent", "critical", "asap") ? "Critical" : "High",
    start: iso(today),
    target: iso(target),
    background: `Build an evidence-based case for ${name ? name.toLowerCase() : "this work"} to support a go / no-go decision.`,
    objective: prompt.trim(),
    sponsor: PEOPLE[0].name,
    lead: PEOPLE[2].name,
    steering: [PEOPLE[0].name],
    departments: deps,
    teams: deps.map((d) => teamsFor(d)[0]),
    workstreams,
    gates: [
      {
        name: "Feasibility decision",
        owner: PEOPLE[2].name,
        approver: PEOPLE[0].name,
        date: iso(target),
        criteria: "Recommendation is backed by reviewed evidence and an agreed cost range",
        workstreams: workstreams.map((w) => w.name),
        requireAll: false,
      },
    ],
    risks: [
      {
        risk: "Key evidence or supplier data is unavailable in time",
        owner: PEOPLE[2].name,
        severity: "Medium",
        response: "Agree data requests early and track them weekly",
      },
    ],
    inScope: [
      "Assess the available options against the stated requirements",
      "Gather and review evidence from internal and external sources",
      "Model costs, benefits and key risks",
    ].join("\n"),
    outScope: ["Full-scale implementation", "Procurement of equipment or services"].join("\n"),
    deliverable: "Decision recommendation with supporting evidence",
    measures: [
      "Recommendation approved by the sponsor",
      "Each option backed by reviewed evidence",
      "Cost estimate within an agreed confidence range",
    ].join("\n"),
  };
}

/* ---------------- completeness ---------------- */

export type Missing = { step: string; text: string };

export function missingItems(d: Draft): Missing[] {
  const m: Missing[] = [];
  if (!d.name.trim()) m.push({ step: "charter", text: "Charter: Add a project name." });
  if (!d.objective.trim()) m.push({ step: "charter", text: "Charter: Describe the business objective." });
  if (d.start && d.target && d.target < d.start)
    m.push({ step: "scope", text: "Scope: Target completion is before the planned start." });
  if (!d.departments.length) m.push({ step: "org", text: "Organization: Select at least one participating department." });
  if (d.teamMode === TEAM_MODES[0].value) {
    for (const dep of d.departments)
      if (!d.teams.some((t) => t.startsWith(dep + " ·")))
        m.push({ step: "org", text: `${dep}: Select a participating team.` });
  }
  if (!d.workstreams.some((w) => w.name.trim() && w.owner && w.output.trim()))
    m.push({ step: "delivery", text: "Workstreams: Add one with an owner and expected output." });
  if (!d.gates.some((g) => g.name.trim() && g.criteria.trim()))
    m.push({ step: "delivery", text: "Decision Gates: Add one with acceptance criteria." });
  d.gates.forEach((g, i) => {
    if (!g.approver) m.push({ step: "delivery", text: `Decision Gate ${i + 1}: Assign an approver.` });
    if (!g.workstreams.length) m.push({ step: "delivery", text: `Decision Gate ${i + 1}: Select the workstreams it covers.` });
  });
  if (!d.risks.some((r) => r.risk.trim()) && !d.noRiskReason.trim())
    m.push({ step: "delivery2", text: "Risk Register: Add a risk, or explain why there are none." });
  return m;
}
