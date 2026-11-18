"use client";

import type { ReactNode } from "react";
import {
  ArrowDown01Icon,
  BinocularsIcon,
  Building03Icon,
  Delete02Icon,
  File02Icon,
  Flag02Icon,
  HelpCircleIcon,
  Add01Icon,
  Route01Icon,
  Shield01Icon,
  SparklesIcon,
  TradeUpIcon,
  UserGroupIcon,
  Alert02Icon,
  Wallet01Icon,
  Database01Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";
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
  WS_BY_DEPT,
  emptyGate,
  emptyRisk,
  emptyWorkstream,
  recommendedControls,
  teamsFor,
  type Draft,
} from "@/lib/newProject";

export type Section =
  "Charter" | "Organization" | "Delivery" | "Controls" | "Review";
export const SECTIONS: Section[] = [
  "Charter",
  "Organization",
  "Delivery",
  "Controls",
  "Review",
];

type IconSvg = Parameters<typeof huge>[0];

export type Ctx = {
  d: Draft;
  set: (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => void;
  editing: boolean;
  /** field still holds the value the AI drafted (not changed by the user) */
  ai: (key: keyof Draft) => boolean;
};

export type CardDef = {
  id: string;
  section: Exclude<Section, "Review">;
  title: string;
  icon: IconSvg;
  /** rows inside the grey inner panel of the AI card */
  body: (c: Ctx) => ReactNode;
  /** optional full-width card under the AI card (Figma "Assumptions And Dependencies"); always editable */
  after?: { title: string; icon: IconSvg; body: (c: Ctx) => ReactNode };
  validate?: (d: Draft) => string | null;
  summary: (d: Draft) => string;
};

/* ---------------- primitives (Figma "Project Charter" card) ---------------- */

const LABEL =
  "text-base leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-lg";
const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
const orDash = (s: string) => (s.trim() ? s.trim() : "—");
const names = PEOPLE.map((p) => p.name);

/** 11/18/2026 like the design */
export const showDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${m}/${d}/${y}` : iso;
};

/** Figma "AI Suggested": 36 high, radius 8, border #EDEDF0, sparkle + Inter 500 14 #667085 */
export function AiChip() {
  return (
    <span
      title="Drafted by AI from your description"
      className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-[#EDEDF0] bg-white px-3 text-sm leading-[1.5] font-medium tracking-[-0.02em] whitespace-nowrap text-body"
    >
      <Icon icon={huge(SparklesIcon)} size={14} stroke={1.4} />
      <span className="hidden sm:inline">AI Suggested</span>
    </span>
  );
}

/** Label column 184 + gap 10; value box min 62 high, radius 12, padding 16 / 15. */
export function KvRow({
  label,
  ai,
  children,
  grey,
  top,
}: {
  label: ReactNode;
  ai?: boolean;
  children: ReactNode;
  /** value box on #FAFAFA (rows inside a white sub-card) */
  grey?: boolean;
  /** align label to the top (multi-line values) */
  top?: boolean;
}) {
  return (
    <div
      className={`grid gap-x-2.5 gap-y-1.5 sm:grid-cols-[184px_minmax(0,1fr)] ${top ? "items-start" : "items-center"}`}
    >
      <span className={`${LABEL} ${top ? "sm:pt-[17px]" : ""}`}>{label}</span>
      <div
        className={`flex min-h-[62px] items-center gap-3 rounded-xl border border-[#EDEDF0] py-2.5 pr-[15px] pl-4 transition-colors focus-within:border-blue ${
          grey ? "bg-[#FAFAFA]" : "bg-white"
        }`}
      >
        <div className="min-w-0 flex-1 text-base leading-[1.5] tracking-[-0.02em] text-[#101D37]">
          {children}
        </div>
        {ai && <AiChip />}
      </div>
    </div>
  );
}

const INPUT =
  "w-full min-w-0 bg-transparent text-base leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body";

/** One value: plain text when viewing, an input when "Edit Details" is on. */
export function Val({
  editing,
  value,
  onChange,
  kind = "text",
  options,
  placeholder,
  tone,
  label,
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  kind?: "text" | "date" | "area" | "select";
  options?: readonly string[];
  placeholder?: string;
  tone?: string;
  label: string;
}) {
  if (!editing) {
    if (!value.trim())
      return <span className="text-body">{placeholder ?? "Not set"}</span>;
    return (
      <span
        className={`block break-words ${kind === "area" ? "whitespace-pre-line" : ""} ${tone ?? ""}`}
      >
        {kind === "date" ? showDate(value) : value}
      </span>
    );
  }
  if (kind === "select")
    return (
      <span className="relative flex items-center">
        <select
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT} cursor-pointer appearance-none pr-6 ${tone ?? ""}`}
        >
          {!value && <option value="">{placeholder ?? "Choose"}</option>}
          {options?.map((o) => (
            <option key={o} value={o} className="text-[#101D37]">
              {o}
            </option>
          ))}
        </select>
        <Icon
          icon={huge(ArrowDown01Icon)}
          size={16}
          className="pointer-events-none absolute right-0 text-body"
        />
      </span>
    );
  if (kind === "area")
    return (
      <textarea
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`${INPUT} block resize-none [field-sizing:content]`}
      />
    );
  return (
    <input
      aria-label={label}
      type={kind === "date" ? "date" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={INPUT}
    />
  );
}

/** Multi-select as pills; viewing shows only the selected ones. */
function PillSet({
  editing,
  options,
  values,
  onChange,
  empty = "None selected",
}: {
  editing: boolean;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  empty?: string;
}) {
  if (!editing)
    return values.length ? (
      <span className="flex flex-wrap gap-1.5 py-0.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-lg bg-blue/[0.08] px-2.5 py-1 text-sm font-medium text-blue"
          >
            {v}
          </span>
        ))}
      </span>
    ) : (
      <span className="text-body">{empty}</span>
    );
  return (
    <span className="flex flex-wrap gap-1.5 py-0.5">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? values.filter((x) => x !== o) : [...values, o])
            }
            className={`rounded-lg border px-2.5 py-1 text-sm font-medium transition-colors ${
              on
                ? "border-blue bg-blue/[0.08] text-blue"
                : "border-[#EDEDF0] bg-white text-body hover:text-[#101D37]"
            }`}
          >
            {o}
          </button>
        );
      })}
    </span>
  );
}

/** White sub-card inside the grey panel (Figma "Business Objective"). */
export function SubCard({
  icon,
  title,
  children,
  action,
}: {
  icon: IconSvg;
  title: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#EDEDF0] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-2 text-base leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-lg">
          <Icon icon={huge(icon)} size={18} stroke={1.6} />
          {title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}

/** Grey text block inside a sub-card: radius 12, padding 20, Inter 16/24. */
function Block({
  editing,
  value,
  onChange,
  placeholder,
  label,
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="rounded-xl border border-[#EDEDF0] bg-[#FAFAFA] px-5 py-4 transition-colors focus-within:border-blue">
      {editing ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${INPUT} block resize-none leading-6 [field-sizing:content]`}
        />
      ) : (
        <p
          className={`text-base leading-6 tracking-[-0.02em] whitespace-pre-line ${value.trim() ? "text-[#101D37]" : "text-body"}`}
        >
          {value.trim() || placeholder}
        </p>
      )}
    </div>
  );
}

/** Always-editable text area of the "Assumptions And Dependencies" card. */
function OpenArea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      aria-label={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="min-h-[100px] w-full resize-none rounded-xl border border-[#EDEDF0] bg-[#FAFAFA] px-5 py-4 text-base leading-6 tracking-[-0.02em] text-[#101D37] outline-none [field-sizing:content] placeholder:text-body focus:border-blue"
    />
  );
}

function SmallButton({
  onClick,
  children,
  danger,
}: {
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 items-center gap-1 rounded-lg border border-[#EDEDF0] bg-white px-2.5 text-sm font-medium ${
        danger
          ? "text-[#D92D20] hover:bg-[#FEF3F2]"
          : "text-blue hover:bg-blue/[0.05]"
      }`}
    >
      {children}
    </button>
  );
}

/** List of sub-cards (workstreams, gates, risks). */
function ItemList<T>({
  c,
  items,
  label,
  icon,
  make,
  onChange,
  row,
  empty,
}: {
  c: Ctx;
  items: T[];
  label: string;
  icon: IconSvg;
  make: () => T;
  onChange: (next: T[]) => void;
  row: (item: T, up: (p: Partial<T>) => void) => ReactNode;
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      {items.length === 0 && <p className="text-sm text-body">{empty}</p>}
      {items.map((item, i) => (
        <SubCard
          key={i}
          icon={icon}
          title={`${label} ${i + 1}`}
          action={
            c.editing && (
              <SmallButton
                danger
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Icon icon={huge(Delete02Icon)} size={14} stroke={1.5} />
                Remove
              </SmallButton>
            )
          }
        >
          <div className="flex flex-col gap-2.5">
            {row(item, (p) =>
              onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x))),
            )}
          </div>
        </SubCard>
      ))}
      {c.editing && (
        <div>
          <SmallButton onClick={() => onChange([...items, make()])}>
            <Icon icon={huge(Add01Icon)} size={14} stroke={1.5} />
            Add {label.toLowerCase()}
          </SmallButton>
        </div>
      )}
    </div>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  High: "text-[#F04438]",
  Critical: "text-[#D92D20] font-medium",
};

/* ---------------- cards ---------------- */

export const CARDS: CardDef[] = [
  /* ---------- 1 Charter ---------- */
  {
    id: "charter",
    section: "Charter",
    title: "Project Charter",
    icon: File02Icon,
    validate: (d) =>
      !d.name.trim()
        ? "Please give the project a name."
        : !d.objective.trim()
          ? "Please describe the business objective."
          : null,
    summary: (d) =>
      `${orDash(d.name)} · ${d.type} · ${d.governance} governance · ${d.priority} priority`,
    body: (c) => {
      const { d, set, editing, ai } = c;
      return (
        <>
          <KvRow label="Project name" ai={ai("name")}>
            <Val
              label="Project name"
              editing={editing}
              value={d.name}
              onChange={(v) => set({ name: v })}
              placeholder="Full project title"
            />
          </KvRow>
          <KvRow label="Project type" ai={ai("type")}>
            <Val
              label="Project type"
              editing={editing}
              kind="select"
              options={PROJECT_TYPES}
              value={d.type}
              onChange={(v) => set({ type: v })}
            />
          </KvRow>
          <KvRow label="Governance level" ai={ai("governance")}>
            <Val
              label="Governance level"
              editing={editing}
              kind="select"
              options={GOVERNANCE.map((g) => g.value)}
              value={d.governance}
              onChange={(v) =>
                set((p) => ({
                  governance: v,
                  ...(p.controlsMode !== "Customize"
                    ? recommendedControls(v)
                    : {}),
                }))
              }
            />
          </KvRow>
          <KvRow label="Priority" ai={ai("priority")}>
            <Val
              label="Priority"
              editing={editing}
              kind="select"
              options={PRIORITIES.map((p) => p.value)}
              value={d.priority}
              tone={PRIORITY_TONE[d.priority]}
              onChange={(v) => set({ priority: v })}
            />
          </KvRow>
          <KvRow label="Programme / portfolio" ai={ai("programme")}>
            <Val
              label="Programme / portfolio"
              editing={editing}
              value={d.programme}
              onChange={(v) => set({ programme: v })}
              placeholder="Optional parent programme"
            />
          </KvRow>
          <KvRow label="Business unit / site" ai={ai("businessUnit")}>
            <Val
              label="Business unit / site"
              editing={editing}
              value={d.businessUnit}
              onChange={(v) => set({ businessUnit: v })}
              placeholder="Optional"
            />
          </KvRow>
          <SubCard icon={TradeUpIcon} title="Business Objective">
            <Block
              label="Business objective"
              editing={editing}
              value={d.objective}
              onChange={(v) => set({ objective: v })}
              placeholder="Decision, change or capability to deliver"
            />
          </SubCard>
        </>
      );
    },
  },
  {
    id: "scope",
    section: "Charter",
    title: "Scope And Measures",
    icon: BinocularsIcon,
    validate: (d) =>
      d.start && d.target && d.target < d.start
        ? "Target completion can't be before the planned start."
        : null,
    summary: (d) =>
      `${d.start ? showDate(d.start) : "Start TBD"} → ${d.target ? showDate(d.target) : "End TBD"} · In: ${lines(d.inScope).length} · Out: ${lines(d.outScope).length} · ${lines(d.measures).length} success measures`,
    body: ({ d, set, editing, ai }) => (
      <>
        <KvRow label="Planned start" ai={ai("start")}>
          <Val
            label="Planned start"
            editing={editing}
            kind="date"
            value={d.start}
            onChange={(v) => set({ start: v })}
            placeholder="mm/dd/yyyy"
          />
        </KvRow>
        <KvRow label="Target completion" ai={ai("target")}>
          <Val
            label="Target completion"
            editing={editing}
            kind="date"
            value={d.target}
            onChange={(v) => set({ target: v })}
            placeholder="mm/dd/yyyy"
          />
        </KvRow>
        <KvRow
          label="Scope and measures"
          ai={ai("background")}
          top={!!d.background && editing}
        >
          <Val
            label="Scope and measures"
            editing={editing}
            kind="area"
            value={d.background}
            onChange={(v) => set({ background: v })}
            placeholder="Business case / background"
          />
        </KvRow>
        <KvRow label="In scope" ai={ai("inScope")} top>
          <Val
            label="In scope"
            editing={editing}
            kind="area"
            value={d.inScope}
            onChange={(v) => set({ inScope: v })}
            placeholder="Work this project covers"
          />
        </KvRow>
        <KvRow label="Out of scope" ai={ai("outScope")} top>
          <Val
            label="Out of scope"
            editing={editing}
            kind="area"
            value={d.outScope}
            onChange={(v) => set({ outScope: v })}
            placeholder="Work explicitly excluded"
          />
        </KvRow>
        <KvRow label="Expected outcome" ai={ai("deliverable")}>
          <Val
            label="Expected outcome"
            editing={editing}
            value={d.deliverable}
            onChange={(v) => set({ deliverable: v })}
            placeholder="e.g. Validated technology option"
          />
        </KvRow>
        <KvRow label="Success measures" ai={ai("measures")} top>
          <Val
            label="Success measures"
            editing={editing}
            kind="area"
            value={d.measures}
            onChange={(v) => set({ measures: v })}
            placeholder="Measurable indicators, one per line"
          />
        </KvRow>
      </>
    ),
    after: {
      title: "Assumptions And Dependencies",
      icon: HelpCircleIcon,
      body: ({ d, set }) => (
        <div className="flex flex-col gap-2.5">
          <OpenArea
            value={d.assumptions}
            onChange={(v) => set({ assumptions: v })}
            placeholder="Assumptions and constraints"
          />
          <OpenArea
            value={d.dependencies}
            onChange={(v) => set({ dependencies: v })}
            placeholder="External dependencies"
          />
        </div>
      ),
    },
  },

  /* ---------- 2 Organization ---------- */
  {
    id: "people",
    section: "Organization",
    title: "People And Oversight",
    icon: UserGroupIcon,
    validate: (d) =>
      d.sponsor && d.lead
        ? null
        : "Choose an executive sponsor and a project lead.",
    summary: (d) =>
      `Sponsor: ${orDash(d.sponsor)} · Lead: ${orDash(d.lead)} · Steering: ${d.steering.length ? d.steering.join(", ") : "Not assigned"}`,
    body: ({ d, set, editing, ai }) => (
      <>
        <KvRow label="Executive sponsor" ai={ai("sponsor")}>
          <Val
            label="Executive sponsor"
            editing={editing}
            kind="select"
            options={names}
            value={d.sponsor}
            onChange={(v) => set({ sponsor: v })}
            placeholder="Choose person"
          />
        </KvRow>
        <KvRow label="Project lead" ai={ai("lead")}>
          <Val
            label="Project lead"
            editing={editing}
            kind="select"
            options={names}
            value={d.lead}
            onChange={(v) => set({ lead: v })}
            placeholder="Choose person"
          />
        </KvRow>
        <KvRow label="Steering group" top={editing}>
          <PillSet
            editing={editing}
            options={names}
            values={d.steering}
            onChange={(v) => set({ steering: v })}
            empty="Not assigned (optional)"
          />
        </KvRow>
        <KvRow label="Stakeholders" ai={ai("stakeholders")}>
          <Val
            label="Stakeholders"
            editing={editing}
            value={d.stakeholders}
            onChange={(v) => set({ stakeholders: v })}
            placeholder="e.g. Plant operations board, technology partner"
          />
        </KvRow>
      </>
    ),
  },
  {
    id: "team",
    section: "Organization",
    title: "Departments And Teams",
    icon: Building03Icon,
    validate: (d) => {
      if (!d.departments.length) return "Select at least one department.";
      if (d.teamMode !== TEAM_MODES[0].value) return null;
      const miss = d.departments.find(
        (dep) => !d.teams.some((t) => t.startsWith(dep + " ·")),
      );
      return miss
        ? `${miss} needs at least one team. Use Edit Details to pick one.`
        : null;
    },
    summary: (d) =>
      `${d.departments.join(", ")} · ${d.teamMode === TEAM_MODES[0].value ? `${d.teams.length} teams selected` : "Leads assign teams later"}`,
    body: ({ d, set, editing, ai }) => (
      <>
        <KvRow label="Departments" ai={ai("departments")} top={editing}>
          <PillSet
            editing={editing}
            options={DEPARTMENTS}
            values={d.departments}
            onChange={(v) =>
              set((p) => {
                const kept = p.workstreams.filter((w) =>
                  v.includes(w.department),
                );
                const first = DEPARTMENTS.find((x) => v.includes(x));
                const added =
                  kept.length || !first
                    ? []
                    : [
                        {
                          ...emptyWorkstream(first),
                          ...(WS_BY_DEPT[first] ?? {}),
                        },
                      ];
                return {
                  departments: DEPARTMENTS.filter((x) => v.includes(x)),
                  teams: p.teams.filter((t) =>
                    v.some((dep) => t.startsWith(dep + " ·")),
                  ),
                  workstreams: [...kept, ...added],
                };
              })
            }
          />
        </KvRow>
        <KvRow label="Team assignment">
          <Val
            label="Team assignment"
            editing={editing}
            kind="select"
            options={TEAM_MODES.map((m) => m.value)}
            value={d.teamMode}
            onChange={(v) => set({ teamMode: v })}
          />
        </KvRow>
        {d.teamMode === TEAM_MODES[0].value &&
          d.departments.map((dep) => (
            <KvRow
              key={dep}
              label={<span className="text-base">{dep}</span>}
              top={editing}
            >
              <PillSet
                editing={editing}
                options={teamsFor(dep)}
                values={d.teams.filter((t) => t.startsWith(dep + " ·"))}
                onChange={(v) =>
                  set((p) => ({
                    teams: [
                      ...p.teams.filter((t) => !t.startsWith(dep + " ·")),
                      ...v,
                    ],
                  }))
                }
                empty="No team yet: Edit Details to choose"
              />
            </KvRow>
          ))}
      </>
    ),
  },

  /* ---------- 3 Delivery ---------- */
  {
    id: "workstreams",
    section: "Delivery",
    title: "Workstreams",
    icon: Route01Icon,
    validate: (d) =>
      d.workstreams.some((w) => w.name.trim() && w.owner && w.output.trim())
        ? null
        : "Add at least one workstream with a name, owner and expected output (Edit Details).",
    summary: (d) =>
      d.workstreams.map((w) => w.name || "Untitled").join(" · ") || "None",
    body: (c) => (
      <ItemList
        c={c}
        items={c.d.workstreams}
        label="Workstream"
        icon={Route01Icon}
        empty="No workstreams yet."
        make={() => emptyWorkstream(c.d.departments[0])}
        onChange={(workstreams) => c.set({ workstreams })}
        row={(w, up) => {
          const ai = c.ai("workstreams");
          const e = c.editing;
          return (
            <>
              <KvRow grey label="Workstream" ai={ai && !!w.name}>
                <Val
                  label="Workstream"
                  editing={e}
                  value={w.name}
                  onChange={(v) => up({ name: v })}
                  placeholder="e.g. Technology validation"
                />
              </KvRow>
              <KvRow grey label="Department">
                <Val
                  label="Department"
                  editing={e}
                  kind="select"
                  options={
                    c.d.departments.length ? c.d.departments : DEPARTMENTS
                  }
                  value={w.department}
                  onChange={(v) => up({ department: v, team: "" })}
                />
              </KvRow>
              <KvRow grey label="Expected output" ai={ai && !!w.output}>
                <Val
                  label="Expected output"
                  editing={e}
                  value={w.output}
                  onChange={(v) => up({ output: v })}
                  placeholder="What must this stream produce?"
                />
              </KvRow>
              <KvRow grey label="Owner">
                <Val
                  label="Owner"
                  editing={e}
                  kind="select"
                  options={names}
                  value={w.owner}
                  onChange={(v) => up({ owner: v })}
                  placeholder="Choose person"
                />
              </KvRow>
              <KvRow grey label="Reviewer">
                <Val
                  label="Reviewer"
                  editing={e}
                  kind="select"
                  options={names.filter((n) => n !== w.owner)}
                  value={w.reviewer}
                  onChange={(v) => up({ reviewer: v })}
                  placeholder="Choose person"
                />
              </KvRow>
              <KvRow grey label="Start / due">
                {e ? (
                  <span className="flex gap-3">
                    <Val
                      label="Start"
                      editing
                      kind="date"
                      value={w.start}
                      onChange={(v) => up({ start: v })}
                    />
                    <Val
                      label="Due"
                      editing
                      kind="date"
                      value={w.due}
                      onChange={(v) => up({ due: v })}
                    />
                  </span>
                ) : (
                  <span className={w.start || w.due ? "" : "text-body"}>
                    {w.start || w.due
                      ? `${w.start ? showDate(w.start) : "TBD"} → ${w.due ? showDate(w.due) : "TBD"}`
                      : "Not scheduled"}
                  </span>
                )}
              </KvRow>
            </>
          );
        }}
      />
    ),
  },
  {
    id: "gates",
    section: "Delivery",
    title: "Decision Gates",
    icon: Flag02Icon,
    validate: (d) => {
      if (!d.gates.some((g) => g.name.trim() && g.criteria.trim()))
        return "Add at least one gate with acceptance criteria (Edit Details).";
      const i = d.gates.findIndex((g) => !g.approver || !g.workstreams.length);
      return i >= 0
        ? `Gate ${i + 1} needs an approver and the workstreams it covers.`
        : null;
    },
    summary: (d) =>
      d.gates
        .map((g) => `${g.name || "Untitled"} → ${g.approver || "No approver"}`)
        .join(" · ") || "None",
    body: (c) => (
      <ItemList
        c={c}
        items={c.d.gates}
        label="Gate"
        icon={Flag02Icon}
        empty="No decision gates yet. Use Edit Details to add one."
        make={() => ({
          ...emptyGate(),
          name: c.d.gates.length ? "" : "Feasibility decision",
        })}
        onChange={(gates) => c.set({ gates })}
        row={(g, up) => {
          const e = c.editing;
          const wsNames = c.d.workstreams.map(
            (w, i) => w.name || `Workstream ${i + 1}`,
          );
          return (
            <>
              <KvRow grey label="Gate">
                <Val
                  label="Gate"
                  editing={e}
                  value={g.name}
                  onChange={(v) => up({ name: v })}
                  placeholder="e.g. Go / no-go for pilot"
                />
              </KvRow>
              <KvRow grey label="Approver">
                <Val
                  label="Approver"
                  editing={e}
                  kind="select"
                  options={names}
                  value={g.approver}
                  onChange={(v) => up({ approver: v })}
                  placeholder="Choose person"
                />
              </KvRow>
              <KvRow grey label="Planned date">
                <Val
                  label="Planned date"
                  editing={e}
                  kind="date"
                  value={g.date}
                  onChange={(v) => up({ date: v })}
                  placeholder="Not set"
                />
              </KvRow>
              <KvRow grey label="Covers" top={e}>
                <PillSet
                  editing={e}
                  options={wsNames}
                  values={g.workstreams}
                  onChange={(v) => up({ workstreams: v })}
                />
              </KvRow>
              <KvRow grey label="Acceptance criteria" top>
                <Val
                  label="Acceptance criteria"
                  editing={e}
                  kind="area"
                  value={g.criteria}
                  onChange={(v) => up({ criteria: v })}
                  placeholder="What must be true to pass this gate?"
                />
              </KvRow>
            </>
          );
        }}
      />
    ),
  },
  {
    id: "risks",
    section: "Delivery",
    title: "Risk Register",
    icon: Alert02Icon,
    validate: (d) =>
      d.risks.some((r) => r.risk.trim()) || d.noRiskReason.trim()
        ? null
        : "Add a risk, or explain why no material risks are identified.",
    summary: (d) => {
      const n = d.risks.filter((r) => r.risk.trim()).length;
      return n
        ? `${n} risk${n === 1 ? "" : "s"} recorded`
        : `No risks: ${d.noRiskReason.trim()}`;
    },
    body: (c) => (
      <>
        <ItemList
          c={c}
          items={c.d.risks}
          label="Risk"
          icon={Alert02Icon}
          empty="No risks recorded yet."
          make={emptyRisk}
          onChange={(risks) => c.set({ risks })}
          row={(r, up) => {
            const e = c.editing;
            return (
              <>
                <KvRow grey label="Risk">
                  <Val
                    label="Risk"
                    editing={e}
                    value={r.risk}
                    onChange={(v) => up({ risk: v })}
                    placeholder="What could go wrong?"
                  />
                </KvRow>
                <KvRow grey label="Owner">
                  <Val
                    label="Owner"
                    editing={e}
                    kind="select"
                    options={names}
                    value={r.owner}
                    onChange={(v) => up({ owner: v })}
                    placeholder="Choose person"
                  />
                </KvRow>
                <KvRow grey label="Severity">
                  <Val
                    label="Severity"
                    editing={e}
                    kind="select"
                    options={SEVERITIES}
                    value={r.severity}
                    onChange={(v) => up({ severity: v })}
                    tone={r.severity === "High" ? "text-[#F04438]" : undefined}
                  />
                </KvRow>
                <KvRow grey label="Response">
                  <Val
                    label="Response"
                    editing={e}
                    value={r.response}
                    onChange={(v) => up({ response: v })}
                    placeholder="How will it be reduced or handled?"
                  />
                </KvRow>
              </>
            );
          }}
        />
        {!c.d.risks.length && (
          <SubCard icon={HelpCircleIcon} title="No Material Risks?">
            <Block
              label="Why no material risks are identified"
              editing
              value={c.d.noRiskReason}
              onChange={(v) => c.set({ noRiskReason: v })}
              placeholder="Explain why no material risks are currently identified"
            />
          </SubCard>
        )}
      </>
    ),
  },
  {
    id: "planning",
    section: "Delivery",
    title: "Budget, Capacity And Reporting",
    icon: Wallet01Icon,
    summary: (d) =>
      [
        d.approach,
        `${d.reporting} reporting`,
        d.budget.trim() && `${d.currency} ${d.budget.trim()}`,
        d.resources.trim(),
      ]
        .filter(Boolean)
        .join(" · "),
    body: ({ d, set, editing }) => (
      <>
        <KvRow label="Delivery approach">
          <Val
            label="Delivery approach"
            editing={editing}
            kind="select"
            options={APPROACHES}
            value={d.approach}
            onChange={(v) => set({ approach: v })}
          />
        </KvRow>
        <KvRow label="Reporting">
          <Val
            label="Reporting"
            editing={editing}
            kind="select"
            options={REPORTING}
            value={d.reporting}
            onChange={(v) => set({ reporting: v })}
          />
        </KvRow>
        <KvRow label="Indicative budget">
          {editing ? (
            <span className="flex items-center gap-3">
              <Val
                label="Budget amount"
                editing
                value={d.budget}
                onChange={(v) => set({ budget: v })}
                placeholder="Amount (optional)"
              />
              <span className="w-20 shrink-0">
                <Val
                  label="Currency"
                  editing
                  kind="select"
                  options={CURRENCIES}
                  value={d.currency}
                  onChange={(v) => set({ currency: v })}
                />
              </span>
            </span>
          ) : (
            <Val
              label="Budget"
              editing={false}
              value={d.budget.trim() ? `${d.currency} ${d.budget.trim()}` : ""}
              onChange={() => {}}
              placeholder="Optional"
            />
          )}
        </KvRow>
        <KvRow label="Cost centre">
          <Val
            label="Cost centre"
            editing={editing}
            value={d.costCentre}
            onChange={(v) => set({ costCentre: v })}
            placeholder="Optional funding reference"
          />
        </KvRow>
        <KvRow label="Resources">
          <Val
            label="Resources"
            editing={editing}
            value={d.resources}
            onChange={(v) => set({ resources: v })}
            placeholder="e.g. 4 FTE across 3 functions"
          />
        </KvRow>
      </>
    ),
  },

  /* ---------- 4 Controls ---------- */
  {
    id: "controls",
    section: "Controls",
    title: "Access And Controls",
    icon: Shield01Icon,
    summary: (d) =>
      [
        d.controlsMode === "Customize"
          ? `${d.visibility} · ${d.classification} · Changes: ${d.changeAuth}`
          : "Recommended controls",
        d.governance.startsWith("Regulated") &&
          `${d.regControls.length} regulated controls · Quality lead: ${d.qualityLead || "Not assigned"}`,
      ]
        .filter(Boolean)
        .join(" · "),
    body: ({ d, set, editing }) => {
      const recommended = d.controlsMode !== "Customize";
      return (
        <>
          <KvRow label="Controls" ai={recommended}>
            <Val
              label="Controls"
              editing={editing}
              kind="select"
              options={["Use recommended", "Customize"]}
              value={recommended ? "Use recommended" : "Customize"}
              onChange={(v) =>
                set((p) =>
                  v === "Use recommended"
                    ? { controlsMode: v, ...recommendedControls(p.governance) }
                    : { controlsMode: v },
                )
              }
            />
          </KvRow>
          {CONTROL_FIELDS.map((f) => (
            <KvRow key={f.key} label={f.label} ai={recommended}>
              <Val
                label={f.label}
                editing={editing}
                kind="select"
                options={f.options}
                value={d[f.key]}
                onChange={(v) =>
                  set({
                    [f.key]: v,
                    controlsMode: "Customize",
                  } as Partial<Draft>)
                }
              />
            </KvRow>
          ))}
          {d.governance.startsWith("Regulated") && (
            <SubCard icon={Shield01Icon} title="Regulated Work">
              <div className="flex flex-col gap-2.5">
                <KvRow grey label="Standards">
                  <Val
                    label="Standards"
                    editing={editing}
                    value={d.standards}
                    onChange={(v) => set({ standards: v })}
                    placeholder="e.g. ISO 9001"
                  />
                </KvRow>
                <KvRow grey label="Quality lead">
                  <Val
                    label="Quality lead"
                    editing={editing}
                    kind="select"
                    options={names}
                    value={d.qualityLead}
                    onChange={(v) => set({ qualityLead: v })}
                    placeholder="Not assigned"
                  />
                </KvRow>
                <KvRow grey label="Required controls" top={editing}>
                  <PillSet
                    editing={editing}
                    options={REG_CONTROLS}
                    values={d.regControls}
                    onChange={(v) => set({ regControls: v })}
                  />
                </KvRow>
              </div>
            </SubCard>
          )}
        </>
      );
    },
  },
  {
    id: "records",
    section: "Controls",
    title: "Records And External Access",
    icon: Database01Icon,
    summary: (d) =>
      [
        d.externalAccess,
        d.dataLocation && `Location: ${d.dataLocation}`,
        d.retention && `Retention: ${d.retention}`,
      ]
        .filter(Boolean)
        .join(" · "),
    body: ({ d, set, editing }) => (
      <>
        <KvRow label="External access">
          <Val
            label="External access"
            editing={editing}
            kind="select"
            options={EXTERNAL_ACCESS.map((x) => x.value)}
            value={d.externalAccess}
            onChange={(v) => set({ externalAccess: v })}
          />
        </KvRow>
        <KvRow label="Data location">
          <Val
            label="Data location"
            editing={editing}
            value={d.dataLocation}
            onChange={(v) => set({ dataLocation: v })}
            placeholder="e.g. EU, UK, US (optional)"
          />
        </KvRow>
        <KvRow label="Record retention">
          <Val
            label="Record retention"
            editing={editing}
            value={d.retention}
            onChange={(v) => set({ retention: v })}
            placeholder="e.g. 10 years; subject to policy"
          />
        </KvRow>
      </>
    ),
  },
];
