import "server-only";
import {
  APPROACHES,
  CURRENCIES,
  DEPARTMENTS,
  EMPTY_DRAFT,
  EXTERNAL_ACCESS,
  GOVERNANCE,
  PEOPLE,
  PRIORITIES,
  PROJECT_TYPES,
  REPORTING,
  SEVERITIES,
  emptyWorkstream,
  recommendedControls,
  teamsFor,
  type Draft,
  type Gate,
  type Risk,
  type Workstream,
} from "../newProject";
import type { ProjectInsights, RiskLevel } from "./types";

/* ---------------- what the model may fill ---------------- */

const people = PEOPLE.map((p) => `${p.name} (${p.role})`).join(", ");

/** Field guide given to the model: key → meaning and allowed values. */
export const FIELD_GUIDE = `
Charter
- name: short project name, Title Case, max 7 words
- type: one of ${JSON.stringify(PROJECT_TYPES)}
- objective: the business objective / research question, 1-3 sentences
- governance: one of ${JSON.stringify(GOVERNANCE.map((g) => g.value))}
- priority: one of ${JSON.stringify(PRIORITIES.map((p) => p.value))}
- programme: programme or portfolio it belongs to
- businessUnit: business unit that owns it
- start, target: planned start and target completion dates, YYYY-MM-DD
- background: business case / background, 1-3 sentences
- inScope, outScope, measures, assumptions, dependencies: arrays of short lines
- deliverable: main deliverable
Organization
- sponsor, lead: one of the people [${people}]
- departments: array, each one of ${JSON.stringify(DEPARTMENTS)}
- steering: array of people from the list above
- stakeholders: other stakeholders, free text
- decisionNotes: stakeholder and decision notes
- externalOrgs: external organizations, comma-separated
Delivery
- workstreams: array of {name, department (from departments), output, owner (person), reviewer (person), start, due (YYYY-MM-DD), dependencies}
- gates: array of decision gates {name, owner (person), approver (person), date (YYYY-MM-DD), criteria, workstreams (array of workstream names)}
- risks: array of {risk, owner (person), severity ("Low"|"Medium"|"High"), response}
- approach: one of ${JSON.stringify(APPROACHES)}
- reporting: one of ${JSON.stringify(REPORTING)}
- budget: number only, no currency sign
- currency: one of ${JSON.stringify(CURRENCIES)}
- costCentre, resources: free text
Controls
- standards: applicable standards or regulations
- dataLocation, retention: free text
- externalAccess: one of ${JSON.stringify(EXTERNAL_ACCESS.map((e) => e.value))}
`.trim();

/** Fields worth asking the user about when they are still empty (key → label). */
export const ASKABLE: [keyof Draft, string][] = [
  ["name", "Project name"],
  ["objective", "Business objective"],
  ["background", "Background"],
  ["start", "Planned start"],
  ["target", "Target completion"],
  ["inScope", "In scope"],
  ["outScope", "Out of scope"],
  ["deliverable", "Main deliverable"],
  ["measures", "Success measures"],
  ["stakeholders", "Stakeholders"],
  ["budget", "Budget"],
  ["workstreams", "Workstreams"],
  ["gates", "Decision gates"],
  ["risks", "Risks"],
];

export const LABELS: Record<string, string> = {
  ...Object.fromEntries(ASKABLE),
  type: "Project type",
  governance: "Governance",
  priority: "Priority",
  programme: "Programme",
  businessUnit: "Business unit",
  assumptions: "Assumptions",
  dependencies: "Dependencies",
  sponsor: "Sponsor",
  lead: "Project lead",
  departments: "Departments",
  steering: "Steering group",
  decisionNotes: "Decision notes",
  externalOrgs: "External organizations",
  approach: "Delivery approach",
  reporting: "Reporting",
  currency: "Currency",
  costCentre: "Cost centre",
  resources: "Resources",
  standards: "Standards",
  dataLocation: "Data location",
  retention: "Retention",
  externalAccess: "External access",
};

const filledValue = (v: unknown) =>
  Array.isArray(v)
    ? v.length > 0
    : typeof v === "string"
      ? v.trim().length > 0
      : v != null;

export const emptyAskable = (d: Partial<Draft>) =>
  ASKABLE.filter(([k]) => !filledValue(d[k])).map(([k, label]) => ({
    key: k,
    label,
  }));

/** Compact view of the draft for the prompt: only fields that have a value. */
export function draftSummary(d: Partial<Draft>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(LABELS) as (keyof Draft)[]) {
    const v = d[k];
    if (filledValue(v)) out[k] = v;
  }
  return JSON.stringify(out);
}

/* ---------------- cleaning what the model returns ---------------- */

const str = (v: unknown, max = 1500) =>
  typeof v === "string"
    ? v.trim().slice(0, max)
    : typeof v === "number"
      ? String(v)
      : "";
const lines = (v: unknown) =>
  (Array.isArray(v) ? v.map((x) => str(x, 300)) : str(v).split(/\n+/))
    .map((s) => s.replace(/^[-•*\d.)\s]+/, "").trim())
    .filter(Boolean)
    .slice(0, 10)
    .join("\n");
const date = (v: unknown) => {
  const s = str(v, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : "";
};
function oneOf<T extends string>(v: unknown, options: readonly T[]): T | "" {
  const s = str(v, 200).toLowerCase();
  if (!s) return "";
  return (
    options.find((o) => o.toLowerCase() === s) ??
    options.find(
      (o) => o.toLowerCase().startsWith(s) || s.startsWith(o.toLowerCase()),
    ) ??
    ""
  );
}
function person(v: unknown): string {
  const s = str(v, 120).toLowerCase();
  if (!s) return "";
  const p = PEOPLE.find(
    (x) =>
      x.name.toLowerCase() === s ||
      s.includes(x.name.toLowerCase()) ||
      x.name.toLowerCase().split(" ")[0] === s.split(" ")[0],
  );
  return p?.name ?? "";
}
function department(v: unknown): string {
  const s = str(v, 120).toLowerCase();
  if (!s) return "";
  return (
    DEPARTMENTS.find((d) => d.toLowerCase() === s) ??
    DEPARTMENTS.find(
      (d) =>
        d.toLowerCase().includes(s) ||
        s.includes(d.toLowerCase().split(" ")[0]),
    ) ??
    ""
  );
}
const capital = (s: string) =>
  s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** Turn the model's "fields" object into a safe Partial<Draft>. Unknown values are dropped. */
export function sanitize(raw: unknown, base: Partial<Draft>): Partial<Draft> {
  if (!raw || typeof raw !== "object") return {};
  const f = raw as Record<string, unknown>;
  const p: Partial<Draft> = {};
  const setStr = (k: keyof Draft, v: string) => {
    if (v) (p as Record<string, unknown>)[k] = v;
  };

  setStr("name", str(f.name, 80));
  setStr("objective", str(f.objective));
  setStr("programme", str(f.programme, 200));
  setStr("businessUnit", str(f.businessUnit, 200));
  setStr("background", str(f.background));
  setStr("deliverable", str(f.deliverable, 400));
  setStr("stakeholders", str(f.stakeholders, 600));
  setStr("decisionNotes", str(f.decisionNotes, 600));
  setStr(
    "externalOrgs",
    Array.isArray(f.externalOrgs)
      ? f.externalOrgs
          .map((x) => str(x, 80))
          .filter(Boolean)
          .join(", ")
      : str(f.externalOrgs, 300),
  );
  setStr("costCentre", str(f.costCentre, 80));
  setStr(
    "resources",
    Array.isArray(f.resources) ? lines(f.resources) : str(f.resources, 600),
  );
  setStr("standards", str(f.standards, 400));
  setStr("dataLocation", str(f.dataLocation, 200));
  setStr("retention", str(f.retention, 200));
  for (const k of [
    "inScope",
    "outScope",
    "measures",
    "assumptions",
    "dependencies",
  ] as const)
    setStr(k, lines(f[k]));
  setStr("start", date(f.start));
  setStr("target", date(f.target));
  setStr("type", oneOf(f.type, PROJECT_TYPES));
  setStr(
    "priority",
    oneOf(
      f.priority,
      PRIORITIES.map((x) => x.value),
    ),
  );
  setStr("approach", oneOf(f.approach, APPROACHES));
  setStr("reporting", oneOf(f.reporting, REPORTING));
  setStr("currency", oneOf(f.currency, CURRENCIES));
  setStr(
    "externalAccess",
    oneOf(
      f.externalAccess,
      EXTERNAL_ACCESS.map((x) => x.value),
    ),
  );
  const budget = str(f.budget, 40).replace(/[^\d.]/g, "");
  if (budget && Number(budget) > 0)
    p.budget = String(Math.round(Number(budget)));
  setStr("sponsor", person(f.sponsor));
  setStr("lead", person(f.lead));

  const gov = oneOf(
    f.governance,
    GOVERNANCE.map((x) => x.value),
  );
  if (gov) Object.assign(p, { governance: gov, ...recommendedControls(gov) });

  if (Array.isArray(f.steering)) {
    const s = [...new Set(f.steering.map(person).filter(Boolean))];
    if (s.length) p.steering = s;
  }
  if (Array.isArray(f.departments)) {
    const deps = [...new Set(f.departments.map(department).filter(Boolean))];
    if (deps.length) {
      p.departments = DEPARTMENTS.filter((d) => deps.includes(d));
      p.teams = p.departments.map((d) => teamsFor(d)[0]);
    }
  }

  const depts = p.departments ?? base.departments ?? EMPTY_DRAFT.departments;
  if (Array.isArray(f.workstreams)) {
    const ws: Workstream[] = f.workstreams
      .filter((w): w is Record<string, unknown> => !!w && typeof w === "object")
      .slice(0, 8)
      .map((w) => {
        const dept = department(w.department) || depts[0] || DEPARTMENTS[0];
        return {
          ...emptyWorkstream(dept),
          name: str(w.name, 120),
          output: str(w.output, 300),
          team: teamsFor(dept)[0],
          owner: person(w.owner),
          reviewer: person(w.reviewer),
          start: date(w.start),
          due: date(w.due),
          dependencies: str(w.dependencies, 300),
        };
      })
      .filter((w) => w.name);
    if (ws.length) {
      p.workstreams = ws;
      /* every workstream's department takes part in the project */
      const all = [...new Set([...depts, ...ws.map((w) => w.department)])];
      p.departments = DEPARTMENTS.filter((d) => all.includes(d));
      p.teams = p.departments.map((d) => teamsFor(d)[0]);
    }
  }

  const wsNames = (p.workstreams ?? base.workstreams ?? []).map((w) => w.name);
  if (Array.isArray(f.gates)) {
    const gates: Gate[] = f.gates
      .filter((g): g is Record<string, unknown> => !!g && typeof g === "object")
      .slice(0, 6)
      .map((g) => {
        const linked = Array.isArray(g.workstreams)
          ? g.workstreams
              .map((x) => str(x, 120))
              .filter((n) => wsNames.includes(n))
          : [];
        return {
          name: str(g.name, 120),
          owner: person(g.owner),
          approver: person(g.approver),
          date: date(g.date),
          criteria: str(g.criteria, 400),
          workstreams: linked.length ? linked : wsNames,
          requireAll: false,
        };
      })
      .filter((g) => g.name);
    if (gates.length) p.gates = gates;
  }

  if (Array.isArray(f.risks)) {
    const risks: Risk[] = f.risks
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .slice(0, 10)
      .map((r) => ({
        risk: str(r.risk, 300),
        owner: person(r.owner),
        severity: oneOf(capital(str(r.severity, 20)), SEVERITIES) || "Medium",
        response: str(r.response, 300),
      }))
      .filter((r) => r.risk);
    if (risks.length) p.risks = risks;
  }
  return p;
}

/* ---------------- workstream / gate / risk details ---------------- */

/** Missing details inside workstreams, gates and risks, e.g. "workstreams[0].output". */
export function detailGaps(d: Partial<Draft>): string[] {
  const out: string[] = [];
  (d.workstreams ?? []).forEach((w, i) => {
    for (const k of ["output", "owner", "reviewer", "start", "due"] as const)
      if (!w[k]) out.push(`workstreams[${i}].${k}`);
  });
  (d.gates ?? []).forEach((g, i) => {
    for (const k of ["owner", "approver", "date", "criteria"] as const)
      if (!g[k]) out.push(`gates[${i}].${k}`);
  });
  (d.risks ?? []).forEach((r, i) => {
    for (const k of ["owner", "response"] as const)
      if (!r[k]) out.push(`risks[${i}].${k}`);
  });
  return out;
}

/** Fill only the empty details of each item (matched by position); names stay the user's. */
export function mergeDetails(
  cur: Partial<Draft>,
  proposed: Partial<Draft>,
): Partial<Draft> {
  const fill = <T extends object>(
    a: T[] | undefined,
    b: T[] | undefined,
  ): T[] | undefined => {
    if (!a?.length || !b?.length) return undefined;
    let changedAny = false;
    const next = a.map((x, i) => {
      const y = b[i];
      if (!y) return x;
      const o = { ...x } as Record<string, unknown>;
      for (const [k, v] of Object.entries(y)) {
        const now = o[k];
        const empty = Array.isArray(now) ? now.length === 0 : !now;
        if (empty && (Array.isArray(v) ? v.length : v)) {
          o[k] = v;
          changedAny = true;
        }
      }
      return o as T;
    });
    return changedAny ? next : undefined;
  };
  const p: Partial<Draft> = {};
  const ws = fill(cur.workstreams, proposed.workstreams);
  const gates = fill(cur.gates, proposed.gates);
  const risks = fill(cur.risks, proposed.risks);
  if (ws) p.workstreams = ws;
  if (gates) p.gates = gates;
  if (risks) p.risks = risks;
  return p;
}

export const DETAILS_SYSTEM = `You are the project set-up assistant in Artifex Labs, an R&D research workspace.
Some workstreams, decision gates and risks are missing details. Complete them so the user can review and edit.
Rules:
- Keep every item, in the same order, with the same names. Return the complete arrays.
- Fill every missing detail: workstream output (what it must produce), owner and reviewer (different people from the list), start and due dates; gate owner, approver, date and evidence / acceptance criteria (specific and checkable); risk owner and response.
- Dates are YYYY-MM-DD between the project start and target dates.
- Be specific to this project. Answer with JSON only.`;

/* ---------------- prompts ---------------- */

export const INTAKE_SYSTEM = `You are the project set-up assistant in Artifex Labs, an R&D research workspace.
You turn what the user says into fields of a new research project, and ask follow-up questions for what is missing.
Rules for fields:
- Fill a field ONLY with information the user actually gave. Do not add your own ideas, examples or typical values.
- Allowed: the objective (the user's question, tidied), a short name built from their words (always fill name), the project type, and anything they stated (dates, budget, people, departments, scope, deliverable...).
- Risks the user mentions are filled as risks (severity "Medium" unless they say otherwise; owner only if they name one).
- Not allowed: inventing scope items, success measures, stakeholders, workstreams, gates, risks, dates, budgets or names the user did not mention. If in doubt, leave the field out and ask about it.
- Resolve relative dates ("next month", "in 6 months", "Q3") against today's date.
- Keep the user's meaning; tidy the wording. Use British English.
Rules for questions (asked once, as a short multiple-choice form):
- 3 or 4 questions, in this order of importance, skipping any topic already answered: Timeline (start and decision date in ONE question), Budget, Scope (what is included), Deliverable / success, Team (who does which part), Risks.
- Each question: "header" (1-2 words, max 12 characters, e.g. "Timeline"), "question" (one short, friendly sentence), "multiSelect" (true when several answers can apply, e.g. scope items, risks), and 3-4 "options".
- Options are concrete, realistic answers specific to THIS project, each with a short human-readable "label" (max 6 words) and an optional "description" (max 12 words). Timeline labels look like "Jan – Jun 2027 (6 months)"; budget labels look like "$50k – $100k". Never use ISO dates or bare numbers in labels. The user can always type their own answer, so do not add an "Other" option.
- Never list field names, JSON keys or brackets.
- Never ask for the project name, type, governance or priority (you set or default them). Skip minor fields too (programme, cost centre, approach, reporting, external organisations); they are drafted later.
- Do not ask about anything already answered. If the important fields are all filled, ask nothing.
- When the user answers the form, use their choices to fill fields; you may build workstreams, gates and risks from what they chose.
- Whenever you create a workstream, gate or risk, give it all its details (workstream output, owner, reviewer, dates; gate owner, approver, date, acceptance criteria; risk owner, response).
- reply: one or two friendly sentences that say what you took from the text. Do not repeat the questions in the reply.
- Answer with JSON only.`;

export const COMPLETE_SYSTEM = `You are the project set-up assistant in Artifex Labs, an R&D research workspace.
The user has finished answering questions. Propose sensible, realistic values for the project fields that are still empty, based on everything known about the project, so the user can review and edit them.
Rules:
- Do not change fields that already have values.
- Workstreams: 2-4, each with an owner and reviewer from the people list. Decision gates: 1-2, linked to the workstream names. Risks: 2-4 specific to this project.
- Dates must fall between the project start and target dates (YYYY-MM-DD). If those are empty, start today and target about 4 months later.
- Answer with JSON only.`;

export const INSIGHTS_SYSTEM = `You are a senior R&D research analyst in Artifex Labs.
From a new project's set-up details, write the first assessment shown on the project page and in the research case slides.
Be specific to this project, concise and realistic. You have no evidence yet, so say what must be established rather than claiming findings. Do not invent facts or figures (baselines, test results, costs) that are not in the project details.
Answer with JSON only.`;

/* ---------------- insights cleaning ---------------- */

const level = (v: unknown): RiskLevel =>
  (oneOf(capital(str(v, 10)), ["Low", "Medium", "High"] as const) ||
    "Medium") as RiskLevel;

export function cleanInsights(raw: unknown, model: string): ProjectInsights {
  const f = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const arr = (v: unknown, n: number, max = 300) =>
    (Array.isArray(v) ? v : [])
      .map((x) => str(x, max))
      .filter(Boolean)
      .slice(0, n);
  const feas = Number(f.feasibility);
  return {
    summary: str(f.summary, 1200),
    recommendation: str(f.recommendation, 600),
    feasibility: Number.isFinite(feas)
      ? Math.max(0, Math.min(100, Math.round(feas)))
      : 50,
    stats: (Array.isArray(f.stats) ? f.stats : [])
      .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
      .map((s) => ({ label: str(s.label, 40), value: str(s.value, 24) }))
      .filter((s) => s.label && s.value)
      .slice(0, 4),
    risks: (Array.isArray(f.risks) ? f.risks : [])
      .filter((r): r is Record<string, unknown> => !!r && typeof r === "object")
      .map((r) => ({
        risk: str(r.risk, 300),
        likelihood: level(r.likelihood),
        impact: level(r.impact),
        mitigation: str(r.mitigation, 300),
        owner: person(r.owner) || str(r.owner, 60),
      }))
      .filter((r) => r.risk)
      .slice(0, 6),
    questions: arr(f.questions, 5),
    nextSteps: arr(f.nextSteps, 5),
    model,
    generatedAt: new Date().toISOString(),
  };
}

export const INSIGHTS_SHAPE = `{
  "summary": "executive summary, 3-4 sentences",
  "recommendation": "one or two sentences: what to do next and on what condition",
  "feasibility": 0-100 number, how feasible and well-defined the project looks today,
  "stats": [4 items {"label": "2-3 words", "value": "short, e.g. 68%, $250k, 16 wks, 3 High"}] – e.g. Feasibility Score, Budget, Weeks To Decision, High Risks,
  "risks": [3-5 items {"risk", "likelihood": "Low|Medium|High", "impact": "Low|Medium|High", "mitigation", "owner": person}],
  "questions": [3-5 open research questions the project must answer],
  "nextSteps": [3-5 concrete next steps]
}`;
