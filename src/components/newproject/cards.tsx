"use client";

import { useState, type ReactNode } from "react";
import {
  Add01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BinocularsIcon,
  Calendar03Icon,
  Cancel01Icon,
  File02Icon,
  HelpCircleIcon,
  PencilEdit02Icon,
  Settings02Icon,
  SparklesIcon,
  Tick02Icon,
  TradeUpIcon,
} from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";
import {
  APPROACHES,
  CONTROL_FIELDS,
  CURRENCIES,
  DEPARTMENTS,
  EXTERNAL_ACCESS,
  GATE_RULES,
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
  missingItems,
  recommendedControls,
  teamInfo,
  teamsFor,
  type Draft,
  type Gate,
  type Risk,
  type Workstream,
} from "@/lib/newProject";

/*
 * Figma "New Projects Generating Process 1 … 5": one screen per step.
 * 1 Charter · 1.5 Scope · 2 Organization · 3 Delivery · 3.5 Delivery (risks, planning) · 4 Controls · 5 Review
 */

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

export type StepCtx = Ctx & {
  toggleEdit: () => void;
  back?: () => void;
  confirm: () => void;
  jump: (id: string) => void;
  create: () => void;
  saveDraft: () => void;
  saved: boolean;
  error: string | null;
};

export type StepDef = {
  id: string;
  section: Exclude<Section, "Review">;
  /** fields are inputs from the start (Figma shows no "Edit Details" on these screens) */
  alwaysEdit?: boolean;
  validate?: (d: Draft) => string | null;
  render: (c: StepCtx) => ReactNode;
};

/* ---------------- primitives ---------------- */

const LABEL =
  "text-base leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-lg";
const H3 =
  "text-lg leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]";
const names = PEOPLE.map((p) => p.name);

/** 11/18/2026 like the design */
export const showDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${m}/${d}/${y}` : iso;
};

/** Blue 40px AI avatar with the sparkle */
export function AiAvatar() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue text-white">
      <Icon icon={huge(SparklesIcon)} size={20} stroke={1.5} />
    </span>
  );
}

/** Figma "AI Suggested": 36 high, radius 8, border #EDEDF0, sparkle + Inter 500 14 #667085 */
export function AiChip() {
  return (
    <span
      title="Drafted by AI from your description"
      className="flex h-9 shrink-0 items-center gap-1 rounded-[10px] border border-[#EDEDF0] bg-white px-3 py-2 text-sm leading-[1.5] font-medium tracking-[-0.02em] whitespace-nowrap text-body"
    >
      <Icon icon={huge(SparklesIcon)} size={14} stroke={1.4} />
      <span className="hidden sm:inline">AI Suggested</span>
    </span>
  );
}

/** Avatar column + content (all AI answers) */
function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="hidden sm:block">
        <AiAvatar />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-5">{children}</div>
    </div>
  );
}

/** White card: radius 20, padding 16, gap 20; header with icon + title (Inter 600 18) and an optional action. */
function Card({
  icon,
  title,
  action,
  children,
}: {
  icon?: IconSvg;
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-[20px] border border-[#EDEDF0] bg-white p-4">
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h3 className={`flex items-center gap-2 ${H3}`}>
            {icon && <Icon icon={huge(icon)} size={20} stroke={1.6} />}
            {title}
          </h3>
          {action}
        </header>
      )}
      {children}
    </article>
  );
}

/** Grey inner panel: #FAFAFA, border, radius 16, padding 20, rows 10 apart */
function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-2xl border border-[#EDEDF0] bg-[#FAFAFA] p-3 shadow-[0_14px_30px_0_rgba(40,92,224,0.02)] sm:p-5">
      {children}
    </div>
  );
}

const BLUE_BTN =
  "flex h-9 items-center gap-1.5 rounded-[10px] bg-blue px-3 py-2 text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-white disabled:opacity-40";

function EditButton({
  editing,
  onClick,
}: {
  editing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={editing}
      className={
        editing
          ? "flex h-9 items-center gap-1.5 rounded-[10px] border border-blue bg-white px-3 text-sm font-semibold text-blue hover:bg-blue/[0.04]"
          : BLUE_BTN
      }
    >
      <Icon
        icon={huge(editing ? Tick02Icon : PencilEdit02Icon)}
        size={16}
        stroke={1.6}
      />
      {editing ? "Done Editing" : "Edit Details"}
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={BLUE_BTN}>
      <Icon icon={huge(Add01Icon)} size={16} stroke={1.8} />
      {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#EDEDF0] bg-white px-3 py-2 text-sm font-medium text-[#101D37] hover:border-[#F04438]/40 hover:text-[#F04438]"
    >
      <Icon icon={huge(Cancel01Icon)} size={14} stroke={1.6} />
      Remove
    </button>
  );
}

function ErrorLine({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-sm text-[#F04438]"
    >
      <Icon icon={huge(Alert02Icon)} size={15} stroke={1.5} />
      {text}
    </p>
  );
}

/** "← Back" (outlined) + "Confirm & Continue →" (blue), both 36 high */
function Footer({
  c,
  confirmLabel = "Confirm & Continue",
}: {
  c: StepCtx;
  confirmLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <ErrorLine text={c.error} />
      <div className="flex items-center gap-2.5">
        {c.back && (
          <button
            type="button"
            onClick={c.back}
            className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#EDEDF0] bg-white px-3 py-2 text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]"
          >
            <Icon icon={huge(ArrowLeft01Icon)} size={16} stroke={1.8} />
            Back
          </button>
        )}
        <button type="button" onClick={c.confirm} className={BLUE_BTN}>
          {confirmLabel}
          <Icon icon={huge(ArrowRight01Icon)} size={16} stroke={1.8} />
        </button>
      </div>
    </div>
  );
}

/** Label column + value box (min 62 high, radius 12, padding 16 / 15). */
export function KvRow({
  label,
  ai,
  children,
  top,
  wide,
}: {
  label: ReactNode;
  ai?: boolean;
  children: ReactNode;
  /** align label to the top (multi-line values) */
  top?: boolean;
  /** Figma item rows (workstreams, gates, risks) use a 222px label column */
  wide?: boolean;
}) {
  return (
    <div
      className={`grid gap-x-2.5 gap-y-1.5 ${wide ? "sm:grid-cols-[minmax(0,222px)_minmax(0,1fr)]" : "sm:grid-cols-[184px_minmax(0,1fr)]"} ${top ? "items-start" : "items-center"}`}
    >
      <span className={`${LABEL} ${top ? "sm:pt-[17px]" : ""}`}>{label}</span>
      <div className="flex min-h-[62px] items-center gap-2 rounded-[14px] border border-[#EDEDF0] bg-white px-4 py-3 transition-colors focus-within:border-blue">
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

/** One value: plain text when viewing, an input when editing. */
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
          className={`${INPUT} cursor-pointer appearance-none pr-6 ${value ? (tone ?? "") : "text-body"}`}
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
        rows={1}
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
  show = (v: string) => v,
}: {
  editing: boolean;
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
  empty?: string;
  show?: (v: string) => string;
}) {
  if (!editing)
    return values.length ? (
      <span className="block break-words">{values.map(show).join(", ")}</span>
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
            {show(o)}
          </button>
        );
      })}
    </span>
  );
}

/** White sub-card inside the grey panel (Figma "Business Objective", "Steering Group And Stakeholders"). */
function SubCard({
  icon,
  title,
  desc,
  children,
}: {
  icon?: IconSvg;
  title: ReactNode;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-[20px] border border-[#EDEDF0] bg-white p-4">
      <div className="flex flex-col gap-1">
        <h4 className={`flex items-center gap-2 ${H3}`}>
          {icon && <Icon icon={huge(icon)} size={18} stroke={1.6} />}
          {title}
        </h4>
        {desc && (
          <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
            {desc}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

/** Grey text area: radius 12, padding 20 / 16, Inter 16/24; text when viewing. */
function Block({
  editing,
  value,
  onChange,
  placeholder,
  label,
  white,
  rows = 3,
}: {
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  label: string;
  white?: boolean;
  rows?: number;
}) {
  return (
    <div
      className={`min-h-[102px] rounded-2xl border border-[#EDEDF0] p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.02)] transition-colors focus-within:border-blue ${white ? "bg-white" : "bg-[#FAFAFA]"}`}
    >
      {editing ? (
        <textarea
          aria-label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
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

/** Label above a full-width white input (Figma "External Organizations", "Evidence And Acceptance Criteria"). */
function Stacked({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}

function TextBox({
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
    <div className="flex min-h-[46px] items-center rounded-[14px] border border-[#EDEDF0] bg-white px-4 py-3 focus-within:border-blue">
      <Val
        label={label}
        editing={editing}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Checkbox tile: white, border, radius 12 */
function Check({
  checked,
  onChange,
  label,
  desc,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex min-h-[62px] items-center gap-2 rounded-[14px] border border-[#EDEDF0] bg-white px-4 py-3 ${disabled ? "cursor-default" : "cursor-pointer hover:border-[#D0D5DD]"}`}
    >
      <span className="relative flex size-5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="peer size-5 shrink-0 cursor-pointer appearance-none rounded-[5px] border border-[#667085] bg-white transition-colors checked:border-blue checked:bg-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue disabled:cursor-default"
        />
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute inset-0 hidden size-5 text-white peer-checked:block"
        >
          <path
            d="M5.5 10.2l3 3 6-6.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col">
        <span
          className={`text-sm leading-[1.5] tracking-[-0.02em] ${desc ? "font-semibold text-[#101D37]" : checked ? "text-[#101D37]" : "text-body"}`}
        >
          {label}
        </span>
        {desc && (
          <span className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
            {desc}
          </span>
        )}
      </span>
    </label>
  );
}

/** Item block inside a section (Figma "Workstream 1" + Remove). */
function Item({
  title,
  onRemove,
  children,
}: {
  title: string;
  onRemove?: () => void;
  children: ReactNode;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-2">
        <span className={H3}>{title}</span>
        {onRemove && <RemoveButton onClick={onRemove} />}
      </div>
      {children}
    </Panel>
  );
}

const PRIORITY_TONE: Record<string, string> = {
  High: "text-[#F04438]",
  Critical: "text-[#D92D20] font-medium",
};
const upd = <T,>(list: T[], i: number, p: Partial<T>) =>
  list.map((x, j) => (j === i ? { ...x, ...p } : x));
const wsName = (w: Workstream, i: number) =>
  w.name.trim() || (i === 0 ? "Unnamed workstream" : `Workstream ${i + 1}`);

/* ---------------- steps ---------------- */

/** Figma 1 – Project Charter */
function CharterStep(c: StepCtx) {
  const { d, set, editing, ai } = c;
  return (
    <Shell>
      <Card
        icon={File02Icon}
        title="Project Charter"
        action={<EditButton editing={editing} onClick={c.toggleEdit} />}
      >
        <Panel>
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
        </Panel>
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

/** Figma 1.5 – Scope And Measures + Assumptions And Dependencies */
function ScopeStep(c: StepCtx) {
  const { d, set, editing, ai } = c;
  return (
    <Shell>
      <Card
        icon={BinocularsIcon}
        title="Scope And Measures"
        action={<EditButton editing={editing} onClick={c.toggleEdit} />}
      >
        <Panel>
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
            label="Business case / background"
            ai={ai("background")}
            top={editing && !!d.background}
          >
            <Val
              label="Business case / background"
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
              placeholder="Measurable indicators, one per line"
            />
          </KvRow>
          <KvRow label="Success measures" ai={ai("measures")} top>
            <Val
              label="Success measures"
              editing={editing}
              kind="area"
              value={d.measures}
              onChange={(v) => set({ measures: v })}
              placeholder="e.g. Validated technology option"
            />
          </KvRow>
        </Panel>
      </Card>
      <Card icon={HelpCircleIcon} title="Assumptions And Dependencies">
        <div className="flex flex-col gap-2.5">
          <Block
            label="Assumptions and constraints"
            editing
            value={d.assumptions}
            onChange={(v) => set({ assumptions: v })}
            placeholder="Assumptions and constraints"
            rows={2}
          />
          <Block
            label="External dependencies"
            editing
            value={d.dependencies}
            onChange={(v) => set({ dependencies: v })}
            placeholder="External dependencies"
            rows={2}
          />
        </div>
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

/** Two-line team cell: "Discovery Research / Department lead: Sarah Chen" + "RND-DIS · 1 people" */
function TeamLine({ id }: { id: string }) {
  const t = teamInfo(id);
  if (!t) return <span>{id}</span>;
  return (
    <span className="flex min-w-0 items-center gap-4">
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm leading-[1.5] font-semibold">
          {t.name}
        </span>
        <span className="truncate text-xs leading-[1.5] text-body">
          Department lead: {t.lead}
        </span>
      </span>
      <span className="shrink-0 text-xs text-[#101D37]">
        {t.code} · {t.people} people
      </span>
    </span>
  );
}

/** Select box with the label above (Figma "Executive Sponsor" / "Project Lead") */
function PersonSelect({
  label,
  value,
  onChange,
  editing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <span className={LABEL}>{label}</span>
      <div className="flex min-h-[62px] items-center rounded-[14px] border border-[#EDEDF0] bg-white px-4 py-3 focus-within:border-blue">
        {editing ? (
          <Val
            label={label}
            editing
            kind="select"
            options={names}
            value={value}
            onChange={onChange}
            placeholder="Choose person"
          />
        ) : (
          <span className="flex w-full items-center justify-between gap-2 text-base text-[#101D37]">
            {value || <span className="text-body">Choose person</span>}
            <Icon
              icon={huge(ArrowDown01Icon)}
              size={16}
              className="text-body"
            />
          </span>
        )}
      </div>
    </div>
  );
}

/** Figma 2 – Accountability And Organization */
function OrganizationStep(c: StepCtx) {
  const { d, set, editing, ai } = c;
  const assignNow = d.teamMode === TEAM_MODES[0].value;
  return (
    <Shell>
      <Card
        icon={BinocularsIcon}
        title="Accountability And Organization"
        action={<EditButton editing={editing} onClick={c.toggleEdit} />}
      >
        <Panel>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <PersonSelect
              label="Executive Sponsor"
              value={d.sponsor}
              editing={editing}
              onChange={(v) => set({ sponsor: v })}
            />
            <PersonSelect
              label="Project Lead"
              value={d.lead}
              editing={editing}
              onChange={(v) => set({ lead: v })}
            />
          </div>
          <KvRow
            wide
            label="Participating Departments"
            ai={ai("departments")}
            top={editing}
          >
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
          <KvRow wide label="Team Assignment" ai={ai("teamMode")}>
            <Val
              label="Team Assignment"
              editing={editing}
              kind="select"
              options={TEAM_MODES.map((m) => m.value)}
              value={d.teamMode}
              onChange={(v) => set({ teamMode: v })}
            />
          </KvRow>
          {assignNow && (
            <KvRow
              wide
              label="Participating Teams"
              ai={ai("teams")}
              top={editing || d.teams.length > 1}
            >
              {editing ? (
                <span className="flex flex-col gap-2 py-0.5">
                  {d.departments.map((dep) => (
                    <span key={dep} className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-body">
                        {dep}
                      </span>
                      <PillSet
                        editing
                        options={teamsFor(dep)}
                        values={d.teams.filter((t) => t.startsWith(dep + " ·"))}
                        show={(v) => v.split(" · ")[1]}
                        onChange={(v) =>
                          set((p) => ({
                            teams: [
                              ...p.teams.filter(
                                (t) => !t.startsWith(dep + " ·"),
                              ),
                              ...v,
                            ],
                          }))
                        }
                      />
                    </span>
                  ))}
                </span>
              ) : d.teams.length ? (
                <span className="flex flex-col gap-2">
                  {d.teams.map((t) => (
                    <TeamLine key={t} id={t} />
                  ))}
                </span>
              ) : (
                <span className="text-body">No team selected yet</span>
              )}
            </KvRow>
          )}
          <SubCard
            title="Steering Group And Stakeholders"
            desc="People who receive governance updates and participate in programme decisions."
          >
            {editing ? (
              <PillSet
                editing
                options={names}
                values={d.steering}
                onChange={(v) => set({ steering: v })}
              />
            ) : d.steering.length ? (
              d.steering.map((n) => (
                <div
                  key={n}
                  className="flex min-h-[46px] items-center justify-between gap-2 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] py-1.5 pr-1.5 pl-4 text-base text-[#101D37]"
                >
                  {n}
                  {ai("steering") && <AiChip />}
                </div>
              ))
            ) : (
              <p className="text-sm text-body">No one added yet.</p>
            )}
          </SubCard>
          <SubCard title="Stakeholder And Decision Notes">
            <Block
              label="Stakeholder and decision notes"
              editing={editing}
              value={d.decisionNotes}
              onChange={(v) => set({ decisionNotes: v })}
              placeholder="Write here"
              rows={2}
            />
          </SubCard>
          <Stacked label="External Organizations">
            <TextBox
              label="External organizations"
              editing={editing}
              value={d.externalOrgs}
              onChange={(v) => set({ externalOrgs: v })}
              placeholder="Comma-separated; access is assigned separately"
            />
          </Stacked>
        </Panel>
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

/** Figma 3 – Workstreams + Decision Gates */
function DeliveryStep(c: StepCtx) {
  const { d, set, ai } = c;
  const aiWs = ai("workstreams");
  const aiGates = ai("gates");
  const setWs = (i: number, p: Partial<Workstream>) =>
    set((x) => ({ workstreams: upd(x.workstreams, i, p) }));
  const setGate = (i: number, p: Partial<Gate>) =>
    set((x) => ({ gates: upd(x.gates, i, p) }));
  return (
    <Shell>
      <Card
        icon={BinocularsIcon}
        title="Workstreams"
        action={
          <AddButton
            label="Add Workstream"
            onClick={() =>
              set((x) => ({
                workstreams: [
                  ...x.workstreams,
                  emptyWorkstream(x.departments[0]),
                ],
              }))
            }
          />
        }
      >
        {d.workstreams.length === 0 && (
          <p className="text-sm text-body">
            No workstreams yet. Add one to continue.
          </p>
        )}
        {d.workstreams.map((w, i) => (
          <WorkstreamItem
            key={i}
            i={i}
            w={w}
            d={d}
            ai={aiWs}
            up={(p) => setWs(i, p)}
            remove={() =>
              set((x) => ({
                workstreams: x.workstreams.filter((_, j) => j !== i),
              }))
            }
          />
        ))}
      </Card>
      <Card
        icon={BinocularsIcon}
        title="Decision Gates"
        action={
          <AddButton
            label="Add Gate"
            onClick={() => set((x) => ({ gates: [...x.gates, emptyGate()] }))}
          />
        }
      >
        {d.gates.length === 0 && (
          <p className="text-sm text-body">
            No decision gates yet. Add one to continue.
          </p>
        )}
        {d.gates.map((g, i) => (
          <Item
            key={i}
            title={`Decision Gate ${i + 1}`}
            onRemove={() =>
              set((x) => ({ gates: x.gates.filter((_, j) => j !== i) }))
            }
          >
            <KvRow wide label="Decision Gate" ai={aiGates && !!g.name}>
              <Val
                label="Decision Gate"
                editing
                value={g.name}
                onChange={(v) => setGate(i, { name: v })}
                placeholder="e.g. Design Approval"
              />
            </KvRow>
            <KvRow wide label="Target Date" ai={aiGates && !!g.date}>
              <Val
                label="Target Date"
                editing
                kind="date"
                value={g.date}
                onChange={(v) => setGate(i, { date: v })}
              />
            </KvRow>
            <KvRow wide label="Decision Owner" ai={aiGates && !!g.owner}>
              <Val
                label="Decision Owner"
                editing
                kind="select"
                options={names}
                value={g.owner}
                onChange={(v) => setGate(i, { owner: v })}
                placeholder="Choose person"
              />
            </KvRow>
            <KvRow wide label="Approver" ai={aiGates && !!g.approver}>
              <Val
                label="Approver"
                editing
                kind="select"
                options={names}
                value={g.approver}
                onChange={(v) => setGate(i, { approver: v })}
                placeholder="Choose person"
              />
            </KvRow>
            <Stacked label="Evidence And Acceptance Criteria">
              <TextBox
                label="Evidence and acceptance criteria"
                editing
                value={g.criteria}
                onChange={(v) => setGate(i, { criteria: v })}
                placeholder="Write here"
              />
            </Stacked>
            <Stacked label="Gate Scope">
              {(d.workstreams.length ? d.workstreams : [emptyWorkstream()]).map(
                (w, j) => {
                  const n = wsName(w, j);
                  return (
                    <Check
                      key={j}
                      label={n}
                      disabled={!d.workstreams.length}
                      checked={g.workstreams.includes(n)}
                      onChange={(on) =>
                        setGate(i, {
                          workstreams: on
                            ? [...g.workstreams, n]
                            : g.workstreams.filter((x) => x !== n),
                        })
                      }
                    />
                  );
                },
              )}
              <Check
                label="Require all linked research packages to be accepted"
                desc="Enable for completion gates; leave off for earlier design or feasibility decisions."
                checked={g.requireAll}
                onChange={(on) => setGate(i, { requireAll: on })}
              />
            </Stacked>
          </Item>
        ))}
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

function WorkstreamItem({
  i,
  w,
  d,
  ai,
  up,
  remove,
}: {
  i: number;
  w: Workstream;
  d: Draft;
  ai: boolean;
  up: (p: Partial<Workstream>) => void;
  remove: () => void;
}) {
  const [open, setOpen] = useState(!!w.dependencies);
  return (
    <Item title={`Workstream ${i + 1}`} onRemove={remove}>
      <KvRow wide label="Workstream" ai={ai && !!w.name}>
        <Val
          label="Workstream"
          editing
          value={w.name}
          onChange={(v) => up({ name: v })}
          placeholder="e.g. Technology validation"
        />
      </KvRow>
      <KvRow wide label="Department" ai={ai && !!w.department}>
        <Val
          label="Department"
          editing
          kind="select"
          options={d.departments.length ? d.departments : DEPARTMENTS}
          value={w.department}
          onChange={(v) => up({ department: v, team: "" })}
        />
      </KvRow>
      <KvRow wide label="Responsible Team" ai={ai && !!w.team}>
        <Val
          label="Responsible Team"
          editing
          kind="select"
          options={teamsFor(w.department).map((t) => t.split(" · ")[1])}
          value={w.team.split(" · ")[1] ?? ""}
          onChange={(v) => up({ team: `${w.department} · ${v}` })}
          placeholder="Choose Team"
        />
      </KvRow>
      <KvRow wide label="Expected Output" ai={ai && !!w.output}>
        <Val
          label="Expected Output"
          editing
          value={w.output}
          onChange={(v) => up({ output: v })}
          placeholder="What must this stream produce?"
        />
      </KvRow>
      <KvRow wide label="Accountable Owner · Team Member" ai={ai && !!w.owner}>
        <Val
          label="Accountable Owner"
          editing
          kind="select"
          options={names}
          value={w.owner}
          onChange={(v) => up({ owner: v })}
          placeholder="Choose person"
        />
      </KvRow>
      <KvRow wide label="Independent Reviewer" ai={ai && !!w.reviewer}>
        <Val
          label="Independent Reviewer"
          editing
          kind="select"
          options={names.filter((n) => n !== w.owner)}
          value={w.reviewer}
          onChange={(v) => up({ reviewer: v })}
          placeholder="Choose person"
        />
      </KvRow>
      <KvRow wide label="Start Date" ai={ai && !!w.start}>
        <Val
          label="Start Date"
          editing
          kind="date"
          value={w.start}
          onChange={(v) => up({ start: v })}
        />
      </KvRow>
      <KvRow wide label="Due Date" ai={ai && !!w.due}>
        <Val
          label="Due Date"
          editing
          kind="date"
          value={w.due}
          onChange={(v) => up({ due: v })}
        />
      </KvRow>
      <div className="rounded-[14px] border border-[#EDEDF0] bg-white">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[62px] w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm leading-[1.5] tracking-[-0.02em] text-[#101D37]"
        >
          Dependencies and required plans
          <Icon
            icon={huge(ArrowDown01Icon)}
            size={16}
            className={`text-body transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div className="border-t border-[#EDEDF0] px-4 py-3">
            <Val
              label="Dependencies and required plans"
              editing
              kind="area"
              value={w.dependencies}
              onChange={(v) => up({ dependencies: v })}
              placeholder="One per line, e.g. Needs supplier data from Procurement"
            />
          </div>
        )}
      </div>
    </Item>
  );
}

/** Figma 3.5 – Decision Gates (scope + evidence), Risk Register, Assessment, Planning Assumptions */
function Delivery2Step(c: StepCtx) {
  const { d, set, ai } = c;
  const g = d.gates[0];
  const aiRisk = ai("risks");
  const setRisk = (i: number, p: Partial<Risk>) =>
    set((x) => ({ risks: upd(x.risks, i, p) }));
  return (
    <Shell>
      <Card
        icon={BinocularsIcon}
        title="Decision Gates"
        action={
          <AddButton
            label="Add Gate"
            onClick={() => set((x) => ({ gates: [...x.gates, emptyGate()] }))}
          />
        }
      >
        <Panel>
          {g ? (
            <>
              <KvRow
                wide
                label="Gate Scope"
                ai={ai("gates") && g.workstreams.length > 0}
              >
                <span className={g.workstreams.length ? "" : "text-body"}>
                  {g.workstreams.length
                    ? g.workstreams.join(", ")
                    : "Unnamed workstream"}
                </span>
              </KvRow>
              <Stacked label="Evidence And Acceptance Criteria">
                <TextBox
                  label="Evidence and acceptance criteria"
                  editing
                  value={g.criteria}
                  onChange={(v) =>
                    set((x) => ({ gates: upd(x.gates, 0, { criteria: v }) }))
                  }
                  placeholder="Write here"
                />
              </Stacked>
            </>
          ) : (
            <p className="text-sm text-body">
              No decision gates yet. Go back to add one.
            </p>
          )}
        </Panel>
      </Card>
      <Card
        icon={BinocularsIcon}
        title="Risk Register"
        action={
          <AddButton
            label="Add Risk"
            onClick={() => set((x) => ({ risks: [...x.risks, emptyRisk()] }))}
          />
        }
      >
        {d.risks.length === 0 && (
          <p className="text-sm text-body">No risks recorded yet.</p>
        )}
        {d.risks.map((r, i) => (
          <Item
            key={i}
            title={`Risk ${i + 1}`}
            onRemove={() =>
              set((x) => ({ risks: x.risks.filter((_, j) => j !== i) }))
            }
          >
            <KvRow wide label="Risk Or Issue" ai={aiRisk && !!r.risk}>
              <Val
                label="Risk Or Issue"
                editing
                value={r.risk}
                onChange={(v) => setRisk(i, { risk: v })}
                placeholder="e.g. Supplier data arrives late"
              />
            </KvRow>
            <KvRow wide label="Initial Rating" ai={aiRisk && !!r.severity}>
              <Val
                label="Initial Rating"
                editing
                kind="select"
                options={SEVERITIES}
                value={r.severity}
                tone={r.severity === "High" ? "text-[#F04438]" : undefined}
                onChange={(v) => setRisk(i, { severity: v })}
              />
            </KvRow>
            <KvRow wide label="Risk Owner" ai={aiRisk && !!r.owner}>
              <Val
                label="Risk Owner"
                editing
                kind="select"
                options={names}
                value={r.owner}
                onChange={(v) => setRisk(i, { owner: v })}
                placeholder="Choose person"
              />
            </KvRow>
            <KvRow
              wide
              label="Response / Mitigation"
              ai={aiRisk && !!r.response}
            >
              <Val
                label="Response / Mitigation"
                editing
                value={r.response}
                onChange={(v) => setRisk(i, { response: v })}
                placeholder="How will it be reduced or handled?"
              />
            </KvRow>
          </Item>
        ))}
      </Card>
      <Card icon={HelpCircleIcon} title="Assessment If No Risks Are Recorded">
        <Block
          label="Why no material risks are currently identified"
          editing
          value={d.noRiskReason}
          onChange={(v) => set({ noRiskReason: v })}
          placeholder="Why no material risks are currently identified"
          rows={2}
        />
      </Card>
      <Card icon={BinocularsIcon} title="Planning Assumptions">
        <Panel>
          <KvRow wide label="Delivery Approach" ai={ai("approach")}>
            <Val
              label="Delivery Approach"
              editing
              kind="select"
              options={APPROACHES}
              value={d.approach}
              onChange={(v) => set({ approach: v })}
            />
          </KvRow>
          <KvRow wide label="Governance Reporting" ai={ai("reporting")}>
            <Val
              label="Governance Reporting"
              editing
              kind="select"
              options={REPORTING}
              value={d.reporting}
              onChange={(v) => set({ reporting: v })}
            />
          </KvRow>
          <KvRow wide label="Indicative Budget" ai={ai("budget")}>
            <Val
              label="Indicative Budget"
              editing
              value={d.budget}
              onChange={(v) => set({ budget: v })}
              placeholder="Amount"
            />
          </KvRow>
          <KvRow wide label="Currency" ai={ai("currency")}>
            <Val
              label="Currency"
              editing
              kind="select"
              options={CURRENCIES}
              value={d.currency}
              onChange={(v) => set({ currency: v })}
            />
          </KvRow>
          <KvRow
            wide
            label="Cost Centre / Funding Reference"
            ai={ai("costCentre")}
          >
            <Val
              label="Cost Centre / Funding Reference"
              editing
              value={d.costCentre}
              onChange={(v) => set({ costCentre: v })}
              placeholder="Optional"
            />
          </KvRow>
          <KvRow wide label="Resource Allocation" ai={ai("resources")}>
            <Val
              label="Resource Allocation"
              editing
              value={d.resources}
              onChange={(v) => set({ resources: v })}
              placeholder="e.g. 4 FTE across 3 functions"
            />
          </KvRow>
        </Panel>
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

/** Figma 4 – Access And Controls, Quality And Assurance, Records And External Access */
function ControlsStep(c: StepCtx) {
  const { d, set, ai } = c;
  const recommended = d.controlsMode !== "Customize";
  return (
    <Shell>
      <Card icon={BinocularsIcon} title="Access And Controls">
        <Panel>
          {CONTROL_FIELDS.map((f) => (
            <KvRow wide key={f.key} label={f.label} ai={recommended}>
              <Val
                label={f.label}
                editing
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
        </Panel>
      </Card>
      <Card icon={HelpCircleIcon} title="Quality And Assurance">
        <Panel>
          <KvRow wide label="Quality / Assurance Lead" ai={ai("qualityLead")}>
            <Val
              label="Quality / Assurance Lead"
              editing
              kind="select"
              options={names}
              value={d.qualityLead}
              onChange={(v) => set({ qualityLead: v })}
              placeholder="Not assigned"
            />
          </KvRow>
          <KvRow wide label="Gate Approval Rule" ai={ai("gateRule")}>
            <Val
              label="Gate Approval Rule"
              editing
              kind="select"
              options={GATE_RULES}
              value={d.gateRule}
              onChange={(v) => set({ gateRule: v })}
            />
          </KvRow>
          <Stacked label="Applicable Standards / Regulatory Basis">
            <Block
              white
              label="Applicable standards"
              editing
              value={d.standards}
              onChange={(v) => set({ standards: v })}
              placeholder="Enter only standards confirmed relevant by the quality or regulatory team"
              rows={2}
            />
          </Stacked>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {REG_CONTROLS.map((r) => (
              <Check
                key={r}
                label={r}
                checked={d.regControls.includes(r)}
                onChange={(on) =>
                  set((x) => ({
                    regControls: on
                      ? [...x.regControls, r]
                      : x.regControls.filter((y) => y !== r),
                  }))
                }
              />
            ))}
          </div>
        </Panel>
      </Card>
      <Card icon={BinocularsIcon} title="Records And External Access">
        <Panel>
          <KvRow wide label="External Collaboration" ai={ai("externalAccess")}>
            <Val
              label="External Collaboration"
              editing
              kind="select"
              options={EXTERNAL_ACCESS.map((x) => x.value)}
              value={d.externalAccess}
              onChange={(v) => set({ externalAccess: v })}
            />
          </KvRow>
          <KvRow wide label="Data Handling Region" ai={ai("dataLocation")}>
            <Val
              label="Data Handling Region"
              editing
              value={d.dataLocation}
              onChange={(v) => set({ dataLocation: v })}
              placeholder="e.g. EU, UK, US"
            />
          </KvRow>
          <KvRow wide label="Retention Requirement" ai={ai("retention")}>
            <Val
              label="Retention Requirement"
              editing
              value={d.retention}
              onChange={(v) => set({ retention: v })}
              placeholder="e.g. 10 years; subject to policy"
            />
          </KvRow>
        </Panel>
        <Footer c={c} />
      </Card>
    </Shell>
  );
}

/* ---------------- Figma 5 – Review Before Creation ---------------- */

const title = (s: string) => s.replace(/\b\w/g, (ch) => ch.toUpperCase());
const iso = (s: string) => s || "TBD";

function MiniRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex min-h-[43px] items-center justify-between gap-1.5 rounded-xl border border-[#EDEDF0] bg-white px-4 py-2.5 text-sm leading-[1.5] tracking-[-0.02em]">
      <span className="shrink-0 font-semibold text-[#101D37]">{label}</span>
      <span
        className={`min-w-0 text-right break-words ${tone ?? "text-[#101D37]"}`}
      >
        {value}
      </span>
    </div>
  );
}

const ACCESS_TEXT: Record<string, string> = {
  Sponsor:
    "Charter, decision gates and status reporting; approves gates and changes",
  Lead: "Full project charter, team, plan and controls; manages scope, assignments and submissions",
  Member:
    "Assigned workstreams, research and team discussion; no access to controls",
};

export function ReviewStep(c: StepCtx) {
  const { d } = c;
  const missing = missingItems(d);
  const [role, setRole] = useState<"Sponsor" | "Lead" | "Member" | "External">(
    "Lead",
  );
  const people = d.teams.reduce((n, t) => n + (teamInfo(t)?.people ?? 0), 0);
  const external =
    d.externalAccess === "No external access"
      ? "No access: this project is limited to people inside the organization"
      : d.externalAccess === "Named external reviewers"
        ? "Read and comment on shared research; no editing"
        : "Contribute content to shared research; no access to controls";
  return (
    <Shell>
      <Card icon={BinocularsIcon} title="Review Before Creation">
        {missing.length > 0 && (
          <div className="flex flex-col gap-2.5 rounded-2xl border-[0.3px] border-[#FF6720] bg-[#FBF1EF] p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.02)]">
            <p className="flex items-center gap-2 text-lg leading-[1.5] font-semibold tracking-[-0.02em] text-[#FF6720]">
              <Icon icon={huge(Alert02Icon)} size={18} stroke={1.6} />
              {missing.length} {missing.length === 1 ? "Item" : "Items"} To
              Complete
            </p>
            <ul className="flex flex-col">
              {missing.map((m) => {
                const [head, ...rest] = m.text.split(": ");
                return (
                  <li key={m.text}>
                    <button
                      type="button"
                      onClick={() => c.jump(m.step)}
                      className="text-left text-base leading-[1.5] tracking-[-0.02em] text-[#344054] hover:underline"
                    >
                      {rest.length ? (
                        <>
                          <span className="font-semibold text-[#101D37]">
                            {head}:
                          </span>{" "}
                          {rest.join(": ")}
                        </>
                      ) : (
                        m.text
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {missing.length === 0 && (
          <p className="flex items-center gap-1.5 text-base font-medium text-[#2BCB23]">
            <Icon icon={huge(Tick02Icon)} size={18} stroke={1.8} />
            Everything required is in place.
          </p>
        )}
      </Card>

      <div className="flex flex-col gap-3 rounded-[20px] border border-[#EDEDF0] bg-[#E9EEFC] p-4">
        <p className="flex items-center gap-1.5 text-sm leading-[1.5] font-semibold text-blue">
          <Icon icon={huge(BinocularsIcon)} size={16} stroke={1.6} />
          {d.governance.split(" /")[0]} Project
        </p>
        <div className="flex flex-col">
          <p className="text-xl leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
            {d.name || "Untitled project"}
          </p>
          <p className="text-base leading-[1.5] tracking-[-0.02em] text-body">
            {d.departments[0] ?? d.type}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#DCE3F5] pt-2.5 text-base leading-[1.5] tracking-[-0.02em] text-body">
          <span className="flex items-center gap-1.5">
            <Icon icon={huge(Settings02Icon)} size={16} stroke={1.5} />
            {d.type}
          </span>
          <span className="hidden h-4 w-px bg-[#D0D5DD] sm:block" />
          <span className="flex items-center gap-1.5">
            <Icon icon={huge(File02Icon)} size={16} stroke={1.5} />
            {d.departments.length > 1
              ? `${d.departments.length} departments`
              : (d.departments[0] ?? "No department")}
          </span>
          <span className="hidden h-4 w-px bg-[#D0D5DD] sm:block" />
          <span className="flex items-center gap-1.5">
            <Icon icon={huge(Calendar03Icon)} size={16} stroke={1.5} />
            {iso(d.start)} - {iso(d.target)}
          </span>
        </div>
      </div>

      <Card>
        <Panel>
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            <div className="flex flex-col gap-2.5">
              <h4 className={H3}>Accountability</h4>
              <MiniRow label="Sponsor" value={d.sponsor || "Not Assigned"} />
              <MiniRow label="Project Lead" value={d.lead || "Not Assigned"} />
              <MiniRow
                label="Steering Group"
                value={d.steering.length ? d.steering.join(", ") : "None"}
              />
              <MiniRow
                label="Departments"
                value={`${d.departments.length} ${d.departments.length === 1 ? "Department" : "Departments"}`}
              />
              <MiniRow
                label="Assignment"
                value={
                  d.teamMode === TEAM_MODES[0].value
                    ? "Teams Selected At Setup"
                    : "Leads Assign Later"
                }
              />
              <MiniRow
                label="Teams"
                value={
                  d.teams.length ? `${d.teams.length} Selected` : "Pending"
                }
              />
              <MiniRow
                label="People"
                value={`${people} Inherited From Teams`}
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <h4 className={H3}>Governance And Controls</h4>
              <MiniRow
                label="Priority"
                value={d.priority}
                tone={PRIORITY_TONE[d.priority] ?? "text-[#101D37]"}
              />
              <MiniRow
                label="Approval"
                value={title(d.approvals.replace(", then ", " → "))}
              />
              <MiniRow label="Changes" value={title(d.changeAuth)} />
              <MiniRow label="Classification" value={d.classification} />
              <MiniRow
                label="Quality Lead"
                value={d.qualityLead || "Not Specified"}
              />
              <MiniRow
                label="External Access"
                value={title(d.externalAccess)}
              />
            </div>
          </div>
        </Panel>
      </Card>

      <Card>
        <Panel>
          <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h4 className={H3}>Workstreams-{d.workstreams.length}</h4>
              {d.workstreams.length === 0 && (
                <p className="text-sm text-body">None yet</p>
              )}
              {d.workstreams.map((w, i) => {
                const deps = w.dependencies
                  .split("\n")
                  .filter((l) => l.trim()).length;
                return (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#101D37]">
                      {w.name || "Untitled"}
                    </span>
                    <MiniRow
                      label={`${w.owner || "No Owner"} · Required Plans · ${deps} ${deps === 1 ? "Dependency" : "Dependencies"}`}
                      value=""
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              <h4 className={H3}>Decision Gates-{d.gates.length}</h4>
              {d.gates.length === 0 && (
                <p className="text-sm text-body">None yet</p>
              )}
              {d.gates.map((g, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#101D37]">
                    {g.name || "Untitled"}
                  </span>
                  <MiniRow
                    label={`${g.owner || "No Owner"} · ${g.approver || "No Approver"} · ${g.date ? showDate(g.date) : "No Date"}`}
                    value=""
                  />
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </Card>

      <div className="flex flex-col gap-3 rounded-[20px] border border-[#EDEDF0] bg-[#E9EEFC] px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm leading-[1.5] font-semibold text-blue">
            <Icon icon={huge(BinocularsIcon)} size={16} stroke={1.6} />
            Access Preview
          </p>
          <div
            role="tablist"
            aria-label="Preview access for"
            className="flex items-center gap-0.5 rounded-lg border border-[#EDEDF0] bg-white p-1"
          >
            {(["Sponsor", "Lead", "Member", "External"] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={`h-7 rounded-lg px-2.5 py-0.5 text-xs font-medium ${role === r ? "bg-blue text-white" : "text-body hover:text-[#101D37]"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <p className="text-lg leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
          {d.name || "Untitled project"}
        </p>
        <p className="max-w-[460px] text-base leading-[1.5] tracking-[-0.02em] text-body">
          {role === "External" ? external : ACCESS_TEXT[role]}
        </p>
      </div>

      <p className="text-base leading-[1.5] tracking-[-0.02em] text-body">
        Creating this project establishes its charter, departments,
        participating teams and governance. People are inherited from teams.
        Research work packages are configured separately
      </p>
      <div className="flex flex-col gap-2">
        <ErrorLine text={c.error} />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={c.saveDraft}
            className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37] hover:text-blue"
          >
            {c.saved ? "Draft Saved ✓" : "Save Draft"}
          </button>
          <div className="flex items-center gap-2.5">
            {c.back && (
              <button
                type="button"
                onClick={c.back}
                className="flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-[#101D37] hover:text-blue"
              >
                <Icon icon={huge(ArrowLeft01Icon)} size={16} stroke={1.8} />
                Back
              </button>
            )}
            <button
              type="button"
              onClick={c.create}
              disabled={missing.length > 0}
              title={
                missing.length ? "Complete the items above first" : undefined
              }
              className={BLUE_BTN}
            >
              Create Project
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

/* ---------------- step list ---------------- */

export const STEPS: StepDef[] = [
  {
    id: "charter",
    section: "Charter",
    validate: (d) =>
      !d.name.trim()
        ? "Please give the project a name."
        : !d.objective.trim()
          ? "Please describe the business objective."
          : null,
    render: CharterStep,
  },
  {
    id: "scope",
    section: "Charter",
    validate: (d) =>
      d.start && d.target && d.target < d.start
        ? "Target completion can't be before the planned start."
        : null,
    render: ScopeStep,
  },
  {
    id: "org",
    section: "Organization",
    validate: (d) => {
      if (!d.sponsor || !d.lead)
        return "Choose an executive sponsor and a project lead.";
      if (!d.departments.length)
        return "Select at least one participating department.";
      if (d.teamMode !== TEAM_MODES[0].value) return null;
      const miss = d.departments.find(
        (dep) => !d.teams.some((t) => t.startsWith(dep + " ·")),
      );
      return miss
        ? `${miss} needs at least one team. Use Edit Details to pick one.`
        : null;
    },
    render: OrganizationStep,
  },
  {
    id: "delivery",
    section: "Delivery",
    alwaysEdit: true,
    validate: (d) => {
      if (
        !d.workstreams.some((w) => w.name.trim() && w.owner && w.output.trim())
      )
        return "Add at least one workstream with a name, owner and expected output.";
      if (!d.gates.some((g) => g.name.trim() && g.criteria.trim()))
        return "Add at least one decision gate with acceptance criteria.";
      const i = d.gates.findIndex((g) => !g.approver || !g.workstreams.length);
      return i >= 0
        ? `Decision Gate ${i + 1} needs an approver and at least one workstream in its scope.`
        : null;
    },
    render: DeliveryStep,
  },
  {
    id: "delivery2",
    section: "Delivery",
    alwaysEdit: true,
    validate: (d) =>
      d.risks.some((r) => r.risk.trim()) || d.noRiskReason.trim()
        ? null
        : "Add a risk, or explain why no material risks are identified.",
    render: Delivery2Step,
  },
  {
    id: "controls",
    section: "Controls",
    alwaysEdit: true,
    render: ControlsStep,
  },
];
