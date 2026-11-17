"use client";

import type { ReactNode } from "react";
import {
  APPROACHES,
  CONTROL_FIELDS,
  CURRENCIES,
  DEPARTMENTS,
  EXTERNAL_ACCESS,
  GOVERNANCE,
  PEOPLE,
  PRIORITIES,
  PROJECT_TYPES,
  REG_CONTROLS,
  REPORTING,
  SEVERITIES,
  TEAM_MODES,
  emptyGate,
  emptyRisk,
  emptyWorkstream,
  recommendedControls,
  suggestFromPrompt,
  teamsFor,
  WS_BY_DEPT,
  type Draft,
} from "@/lib/newProject";
import { Area, Chips, Field, Pills, RepeatList, Select, Text } from "./widgets";

export type Section = "Charter" | "Organization" | "Delivery" | "Controls" | "Review";
export const SECTIONS: Section[] = ["Charter", "Organization", "Delivery", "Controls", "Review"];

type Ctx = {
  d: Draft;
  set: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  /** set + move to the next question (single-choice answers) */
  pick: (patch: Partial<Draft>) => void;
  active: boolean;
};

type TextKey = {
  [K in keyof Draft]: Draft[K] extends string ? K : never;
}[keyof Draft];

export type Step = {
  id: string;
  section: Section;
  /** short label for the draft preview */
  label: string;
  ask: (d: Draft) => string;
  hint?: string;
  when?: (d: Draft) => boolean;
  /** answer is picked from options – no Continue button */
  choice?: boolean;
  optional?: boolean;
  /** the bottom chat composer types into this field */
  composer?: { key: TextKey; placeholder: string };
  validate?: (d: Draft) => string | null;
  summary: (d: Draft) => string;
  render?: (c: Ctx) => ReactNode;
};

const names = PEOPLE.map((p) => p.name);
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
const orDash = (s: string) => (s.trim() ? s.trim() : "—");
const isRegulated = (d: Draft) => d.governance.startsWith("Regulated");

export const STEPS: Step[] = [
  /* ---------------- 01 Charter ---------------- */
  {
    id: "basics",
    section: "Charter",
    label: "Project basics",
    ask: () => "Here's what I picked up from your description. Check the basics and change anything that's off.",
    validate: (d) => (d.name.trim() ? null : "Please give the project a name."),
    summary: (d) => `${orDash(d.name)} · ${d.type} · ${d.governance} governance · ${d.priority} priority`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-4">
        <Field label="Project name">
          <Text value={d.name} onChange={(v) => set({ name: v })} placeholder="Full project title" />
        </Field>
        <Field label="Project type" group>
          <Pills options={PROJECT_TYPES.map((v) => ({ value: v }))} value={d.type} onChange={(v) => set({ type: v })} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Governance level" group>
            <Pills
              options={GOVERNANCE}
              value={d.governance}
              onChange={(v) => set((p) => ({ governance: v, ...(p.controlsMode !== "Customize" ? recommendedControls(v) : {}) }))}
            />
          </Field>
          <Field label="Priority" group>
            <Pills options={PRIORITIES} value={d.priority} onChange={(v) => set({ priority: v })} />
          </Field>
        </div>
      </div>
    ),
  },
  {
    id: "goal",
    section: "Charter",
    label: "Objective & outcomes",
    ask: () => "What should this project deliver, and how will we know it worked? I've used your description as a start.",
    validate: (d) => (d.objective.trim() ? null : "Please describe the business objective."),
    summary: (d) => `${orDash(d.objective)} · Deliverable: ${orDash(d.deliverable)} · ${lines(d.measures).length} success measures`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-3">
        <Field label="Business objective">
          <Area value={d.objective} onChange={(v) => set({ objective: v })} rows={2} placeholder="Decision, change or capability to deliver" />
        </Field>
        <Field label="Key deliverable">
          <Text value={d.deliverable} onChange={(v) => set({ deliverable: v })} placeholder="e.g. Validated technology option" />
        </Field>
        <Field label="Success measures" hint="one per line">
          <Area value={d.measures} onChange={(v) => set({ measures: v })} placeholder="Measurable indicators" rows={2} />
        </Field>
      </div>
    ),
  },
  {
    id: "scope",
    section: "Charter",
    label: "Scope & assumptions",
    ask: () => "Let's set boundaries. I drafted what's in and out of scope; adjust anything, one item per line.",
    summary: (d) =>
      `In: ${lines(d.inScope).length} items · Out: ${lines(d.outScope).length} items${d.assumptions.trim() ? ` · Assumptions: ${d.assumptions.trim()}` : ""}`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="In scope">
            <Area value={d.inScope} onChange={(v) => set({ inScope: v })} placeholder="Work this project covers" rows={3} />
          </Field>
          <Field label="Out of scope">
            <Area value={d.outScope} onChange={(v) => set({ outScope: v })} placeholder="Work explicitly excluded" rows={3} />
          </Field>
        </div>
        <Field label="Assumptions & dependencies" hint="optional">
          <Text value={d.assumptions} onChange={(v) => set({ assumptions: v })} placeholder="Anything that could affect delivery" />
        </Field>
      </div>
    ),
  },
  {
    id: "context",
    section: "Charter",
    label: "Timeline & portfolio",
    ask: () => "When does it run, and does it sit in a wider programme? All optional.",
    optional: true,
    validate: (d) =>
      d.start && d.target && d.target < d.start ? "Target completion can't be before the planned start." : null,
    summary: (d) =>
      [
        `${d.start || "Start TBD"} → ${d.target || "End TBD"}`,
        d.programme && `Programme: ${d.programme}`,
        d.businessUnit && `Unit / site: ${d.businessUnit}`,
      ]
        .filter(Boolean)
        .join(" · "),
    render: ({ d, set }) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Planned start">
          <Text type="date" value={d.start} onChange={(v) => set({ start: v })} />
        </Field>
        <Field label="Target completion">
          <Text type="date" value={d.target} onChange={(v) => set({ target: v })} />
        </Field>
        <Field label="Programme / portfolio">
          <Text value={d.programme} onChange={(v) => set({ programme: v })} placeholder="Optional parent programme" />
        </Field>
        <Field label="Business unit / site">
          <Text value={d.businessUnit} onChange={(v) => set({ businessUnit: v })} placeholder="Optional" />
        </Field>
      </div>
    ),
  },

  /* ---------------- 02 Organization ---------------- */
  {
    id: "people",
    section: "Organization",
    label: "People & oversight",
    ask: () => "Who's accountable? Pick the sponsor and lead, and anyone who provides oversight.",
    validate: (d) => (d.sponsor && d.lead ? null : "Choose an executive sponsor and a project lead."),
    summary: (d) =>
      `Sponsor: ${orDash(d.sponsor)} · Lead: ${orDash(d.lead)} · Steering: ${d.steering.length ? d.steering.join(", ") : "Not assigned"}${
        d.stakeholders.trim() ? ` · Stakeholders: ${d.stakeholders.trim()}` : ""
      }`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Executive sponsor">
            <Select value={d.sponsor} onChange={(v) => set({ sponsor: v })} options={names} placeholder="Choose person" />
          </Field>
          <Field label="Project lead">
            <Select value={d.lead} onChange={(v) => set({ lead: v })} options={names} placeholder="Choose person" />
          </Field>
        </div>
        <Field label="Steering group" hint="optional" group>
          <Chips options={names} values={d.steering} onChange={(fn) => set((p) => ({ steering: fn(p.steering) }))} />
        </Field>
        <Field label="Stakeholders and external parties" hint="optional">
          <Text value={d.stakeholders} onChange={(v) => set({ stakeholders: v })} placeholder="e.g. Plant operations board, technology partner" />
        </Field>
      </div>
    ),
  },
  {
    id: "team",
    section: "Organization",
    label: "Departments & teams",
    ask: () => "Which departments take part? I've pre-selected the ones your description points to.",
    validate: (d) => {
      if (!d.departments.length) return "Select at least one department.";
      if (d.teamMode !== TEAM_MODES[0].value) return null;
      const miss = d.departments.find((dep) => !d.teams.some((t) => t.startsWith(dep + " ·")));
      return miss ? `${miss} needs at least one team.` : null;
    },
    summary: (d) =>
      `${d.departments.join(", ")} · ${d.teamMode === TEAM_MODES[0].value ? `${d.teams.length} teams selected` : "Leads assign teams later"}`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-4">
        <Field label="Participating departments" hint="select all that apply" group>
          <Chips
            options={DEPARTMENTS}
            values={d.departments}
            onChange={(fn) =>
              set((p) => {
                const v = fn(p.departments);
                /* drop workstreams of removed departments; if none is left, propose one */
                const kept = p.workstreams.filter((w) => v.includes(w.department));
                const first = DEPARTMENTS.find((x) => v.includes(x));
                const added =
                  kept.length || !first ? [] : [{ ...emptyWorkstream(first), ...(WS_BY_DEPT[first] ?? {}) }];
                return {
                  departments: DEPARTMENTS.filter((x) => v.includes(x)),
                  teams: p.teams.filter((t) => v.some((dep) => t.startsWith(dep + " ·"))),
                  workstreams: [...kept, ...added],
                };
              })
            }
          />
        </Field>
        <Field label="Team assignment" group>
          <Pills options={TEAM_MODES} value={d.teamMode} onChange={(v) => set({ teamMode: v })} />
        </Field>
        {d.teamMode === TEAM_MODES[0].value && d.departments.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#EDEDF0] bg-[#FAFAFA] p-3">
            {d.departments.map((dep) => (
              <Field key={dep} label={dep} group>
                <Chips options={teamsFor(dep)} values={d.teams} onChange={(fn) => set((p) => ({ teams: fn(p.teams) }))} />
              </Field>
            ))}
          </div>
        )}
      </div>
    ),
  },

  /* ---------------- 03 Delivery ---------------- */
  {
    id: "workstreams",
    section: "Delivery",
    label: "Workstreams",
    ask: (d) =>
      d.workstreams.length
        ? d.workstreams.length === 1
          ? "I've proposed a first workstream. Give it an owner and check what it must produce; add more if you need them."
          : `You have ${d.workstreams.length} workstreams. Give each an owner and check what it must produce.`
        : "Workstreams organize responsibilities. Add at least one with an owner and expected output.",
    validate: (d) =>
      d.workstreams.some((w) => w.name.trim() && w.owner && w.output.trim())
        ? null
        : "Add at least one workstream with a name, owner and expected output.",
    summary: (d) => d.workstreams.map((w) => w.name || "Untitled").join(" · ") || "None",
    render: ({ d, set }) => (
      <RepeatList
        label="Workstream"
        items={d.workstreams}
        onChange={(workstreams) => set({ workstreams })}
        make={() => emptyWorkstream(d.departments[0])}
        render={(w, up) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Workstream">
              <Text value={w.name} onChange={(v) => up({ name: v })} placeholder="e.g. Technology validation" />
            </Field>
            <Field label="Department">
              <Select value={w.department} onChange={(v) => up({ department: v, team: "" })} options={d.departments.length ? d.departments : DEPARTMENTS} />
            </Field>
            <Field label="Responsible team">
              <Select value={w.team} onChange={(v) => up({ team: v })} options={teamsFor(w.department)} placeholder="Choose team" />
            </Field>
            <Field label="Expected output">
              <Text value={w.output} onChange={(v) => up({ output: v })} placeholder="What must this stream produce?" />
            </Field>
            <Field label="Accountable owner">
              <Select value={w.owner} onChange={(v) => up({ owner: v })} options={names} placeholder="Choose person" />
            </Field>
            <Field label="Independent reviewer">
              <Select value={w.reviewer} onChange={(v) => up({ reviewer: v })} options={names.filter((n) => n !== w.owner)} placeholder="Choose person" />
            </Field>
            <Field label="Start">
              <Text type="date" value={w.start} onChange={(v) => up({ start: v })} />
            </Field>
            <Field label="Due">
              <Text type="date" value={w.due} onChange={(v) => up({ due: v })} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Dependencies and required plans" hint="only where applicable">
                <Text value={w.dependencies} onChange={(v) => up({ dependencies: v })} placeholder="e.g. Needs supplier data from Procurement" />
              </Field>
            </div>
          </div>
        )}
      />
    ),
  },
  {
    id: "gates",
    section: "Delivery",
    label: "Decision gates",
    ask: () => "Which approvals are needed before work can progress or close? Add at least one decision gate.",
    validate: (d) => {
      if (!d.gates.some((g) => g.name.trim() && g.criteria.trim())) return "Add at least one gate with acceptance criteria.";
      const i = d.gates.findIndex((g) => !g.approver || !g.workstreams.length);
      return i >= 0 ? `Gate ${i + 1} needs an approver and the workstreams it covers.` : null;
    },
    summary: (d) => d.gates.map((g) => `${g.name || "Untitled"} → ${g.approver || "No approver"}`).join(" · ") || "None",
    render: ({ d, set }) => (
      <RepeatList
        label="Gate"
        items={d.gates}
        onChange={(gates) => set({ gates })}
        make={() => ({ ...emptyGate(), name: d.gates.length ? "" : "Feasibility decision" })}
        render={(g, up) => (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Gate">
              <Text value={g.name} onChange={(v) => up({ name: v })} placeholder="e.g. Go / no-go for pilot" />
            </Field>
            <Field label="Independent approver">
              <Select value={g.approver} onChange={(v) => up({ approver: v })} options={names} placeholder="Choose person" />
            </Field>
            <Field label="Planned date">
              <Text type="date" value={g.date} onChange={(v) => up({ date: v })} />
            </Field>
            <Field label="Workstreams covered" group>
              <Chips
                options={d.workstreams.map((w, i) => w.name || `Workstream ${i + 1}`)}
                values={g.workstreams}
                onChange={(fn) => up({ workstreams: fn(g.workstreams) })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Acceptance criteria">
                <Area value={g.criteria} onChange={(v) => up({ criteria: v })} placeholder="What must be true to pass this gate?" rows={2} />
              </Field>
            </div>
          </div>
        )}
      />
    ),
  },
  {
    id: "risks",
    section: "Delivery",
    label: "Risk register",
    ask: () => "Any known risks? Record the owner, severity and response — or tell me why there are none yet.",
    validate: (d) =>
      d.risks.some((r) => r.risk.trim()) || d.noRiskReason.trim()
        ? null
        : "Add a risk, or explain why no material risks are identified.",
    summary: (d) =>
      d.risks.filter((r) => r.risk.trim()).length
        ? `${d.risks.filter((r) => r.risk.trim()).length} risks recorded`
        : `No risks: ${d.noRiskReason.trim()}`,
    render: ({ d, set }) => (
      <div className="flex flex-col gap-3">
        <RepeatList
          label="Risk"
          items={d.risks}
          onChange={(risks) => set({ risks })}
          make={emptyRisk}
          render={(r, up) => (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Risk">
                  <Text value={r.risk} onChange={(v) => up({ risk: v })} placeholder="What could go wrong?" />
                </Field>
              </div>
              <Field label="Owner">
                <Select value={r.owner} onChange={(v) => up({ owner: v })} options={names} placeholder="Choose person" />
              </Field>
              <Field label="Severity">
                <Select value={r.severity} onChange={(v) => up({ severity: v })} options={SEVERITIES} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Response / mitigation">
                  <Text value={r.response} onChange={(v) => up({ response: v })} placeholder="How will it be reduced or handled?" />
                </Field>
              </div>
            </div>
          )}
        />
        {!d.risks.length && (
          <Field label="Assessment if no risks are recorded">
            <Area value={d.noRiskReason} onChange={(v) => set({ noRiskReason: v })} placeholder="Why no material risks are currently identified" rows={2} />
          </Field>
        )}
      </div>
    ),
  },
  {
    id: "planning",
    section: "Delivery",
    label: "Budget, capacity & reporting",
    ask: () => "A few planning assumptions: delivery approach, reporting rhythm, budget and capacity.",
    hint: "Budget and capacity are optional.",
    summary: (d) =>
      [
        d.approach,
        `${d.reporting} reporting`,
        d.budget.trim() && `${d.currency} ${d.budget.trim()}`,
        d.resources.trim(),
      ]
        .filter(Boolean)
        .join(" · "),
    render: ({ d, set }) => (
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Delivery approach">
          <Select value={d.approach} onChange={(v) => set({ approach: v })} options={APPROACHES} />
        </Field>
        <Field label="Governance reporting">
          <Select value={d.reporting} onChange={(v) => set({ reporting: v })} options={REPORTING} />
        </Field>
        <Field label="Indicative budget" hint="optional">
          <div className="flex gap-2">
            <Text value={d.budget} onChange={(v) => set({ budget: v })} placeholder="Amount" />
            <div className="w-24 shrink-0">
              <Select value={d.currency} onChange={(v) => set({ currency: v })} options={CURRENCIES} />
            </div>
          </div>
        </Field>
        <Field label="Cost centre / funding reference" hint="optional">
          <Text value={d.costCentre} onChange={(v) => set({ costCentre: v })} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Resource allocation" hint="optional">
            <Text value={d.resources} onChange={(v) => set({ resources: v })} placeholder="e.g. 4 FTE across 3 functions" />
          </Field>
        </div>
      </div>
    ),
  },

  /* ---------------- 04 Controls ---------------- */
  {
    id: "controls",
    section: "Controls",
    label: "Access & controls",
    ask: (d) => {
      const r = recommendedControls(d.governance);
      return `For a ${d.governance.toLowerCase()} project I recommend: ${r.visibility.toLowerCase()}, ${r.classification.toLowerCase()} classification, approvals by ${r.approvals.toLowerCase()}. Keep these or customize.`;
    },
    summary: (d) =>
      [
        d.controlsMode === "Customize" ? `${d.visibility} · ${d.classification} · Changes: ${d.changeAuth}` : "Recommended controls",
        isRegulated(d) && `${d.regControls.length} regulated controls · Quality lead: ${d.qualityLead || "Not assigned"}`,
      ]
        .filter(Boolean)
        .join(" · "),
    render: ({ d, set }) => (
      <div className="flex flex-col gap-4">
        <Field label="Controls" group>
          <Pills
            options={[
              { value: "Use recommended", desc: "Sensible defaults for this governance level" },
              { value: "Customize", desc: "Choose visibility, editing, approvals and change authority" },
            ]}
            value={d.controlsMode}
            onChange={(v) =>
              set((p) => (v === "Use recommended" ? { controlsMode: v, ...recommendedControls(p.governance) } : { controlsMode: v }))
            }
          />
        </Field>
        {d.controlsMode === "Customize" && (
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTROL_FIELDS.map((f) => (
              <Field key={f.key} label={f.label}>
                <Select value={d[f.key]} onChange={(v) => set({ [f.key]: v } as Partial<Draft>)} options={[...f.options]} />
              </Field>
            ))}
          </div>
        )}
        {isRegulated(d) && (
          <div className="flex flex-col gap-3 rounded-xl border border-[#EDEDF0] bg-[#FAFAFA] p-3">
            <span className="text-xs font-semibold text-[#101D37]">Regulated work: extra controls</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Applicable standards" hint="confirmed by quality / regulatory">
                <Text value={d.standards} onChange={(v) => set({ standards: v })} placeholder="e.g. ISO 9001" />
              </Field>
              <Field label="Quality lead">
                <Select value={d.qualityLead} onChange={(v) => set({ qualityLead: v })} options={names} placeholder="Not assigned" />
              </Field>
            </div>
            <Field label="Required controls" group>
              <Chips options={REG_CONTROLS} values={d.regControls} onChange={(fn) => set((p) => ({ regControls: fn(p.regControls) }))} />
            </Field>
          </div>
        )}
      </div>
    ),
  },
  {
    id: "records",
    section: "Controls",
    label: "Records & external access",
    ask: () => "Last one: where records live, how long they're kept, and whether outside partners get access.",
    summary: (d) =>
      [d.externalAccess, d.dataLocation && `Location: ${d.dataLocation}`, d.retention && `Retention: ${d.retention}`]
        .filter(Boolean)
        .join(" · "),
    render: ({ d, set }) => (
      <div className="flex flex-col gap-3">
        <Field label="External access" group>
          <Pills options={EXTERNAL_ACCESS} value={d.externalAccess} onChange={(v) => set({ externalAccess: v })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data location" hint="optional">
            <Text value={d.dataLocation} onChange={(v) => set({ dataLocation: v })} placeholder="e.g. EU, UK, US" />
          </Field>
          <Field label="Record retention" hint="optional">
            <Text value={d.retention} onChange={(v) => set({ retention: v })} placeholder="e.g. 10 years; subject to policy" />
          </Field>
        </div>
      </div>
    ),
  },
];

/** Apply prompt-based suggestions to a draft (keeps anything the user already changed). */
export function seedDraft(d: Draft, prompt: string, files: string[]): Draft {
  const s = suggestFromPrompt(prompt);
  return { ...d, ...s, prompt, files } as Draft;
}
