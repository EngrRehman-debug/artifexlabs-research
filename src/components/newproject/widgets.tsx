"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Add01Icon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";

/* Figma "Generating Process" inputs: white, border #EDEDF0, radius 10; selected: blue border + text. */

export type Opt = { value: string; desc?: string };

/** Compact single-select pills for grouped form steps; the picked option's description shows below. */
export function Pills({
  options,
  value,
  onChange,
}: {
  options: Opt[];
  value: string;
  onChange: (v: string) => void;
}) {
  const desc = options.find((o) => o.value === value)?.desc;
  return (
    <div className="flex flex-col gap-1.5">
      <div role="radiogroup" className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              title={o.desc}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs leading-[1.5] font-medium tracking-[-0.02em] transition-colors ${
                on ? "border-blue bg-blue/[0.06] text-blue" : "border-[#EDEDF0] bg-white text-[#344054] hover:border-blue/40"
              }`}
            >
              {o.value}
            </button>
          );
        })}
      </div>
      {desc && <span className="text-[11px] leading-[1.5] text-body">{desc}</span>}
    </div>
  );
}

export function Chips({
  options,
  values,
  onChange,
  suggested = [],
}: {
  options: string[];
  values: string[];
  /** receives an updater so rapid clicks never work from a stale list */
  onChange: (update: (prev: string[]) => string[]) => void;
  suggested?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = values.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange((prev) => (prev.includes(o) ? prev.filter((v) => v !== o) : [...prev, o]))}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs leading-[1.5] font-medium tracking-[-0.02em] transition-colors ${
              on ? "border-blue bg-blue/[0.06] text-blue" : "border-[#EDEDF0] bg-white text-[#344054] hover:border-blue/40"
            }`}
          >
            {on && <Icon icon={huge(Tick02Icon)} size={12} stroke={1.6} />}
            {o}
            {suggested.includes(o) && !on && <span className="text-[10px] text-blue">· suggested</span>}
          </button>
        );
      })}
    </div>
  );
}

const inputCls =
  "w-full rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-sm leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body focus:border-blue";

/** `group`: for button sets (pills/chips) – a <label> would forward clicks on its text to the first button. */
export function Field({
  label,
  hint,
  group,
  children,
}: {
  label: string;
  hint?: string;
  group?: boolean;
  children: ReactNode;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs leading-[1.5] font-medium text-[#344054]">
        {label}
        {hint && <span className="font-normal text-body"> · {hint}</span>}
      </span>
      {children}
    </Tag>
  );
}

export function Text({
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: "text" | "date";
  autoFocus?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls} h-10`}
    />
  );
}

/** Multi-line field that grows with its text – no inner scrollbar or resize handle. */
export function Area({
  value,
  onChange,
  placeholder,
  rows = 3,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`; // + top/bottom border
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${inputCls} resize-none overflow-hidden py-2`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} h-10`}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  );
}

/** Editable list of cards (workstreams, decision gates, risks). */
export function RepeatList<T>({
  items,
  onChange,
  make,
  label,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  make: () => T;
  label: string;
  render: (item: T, set: (patch: Partial<T>) => void, i: number) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-3 rounded-xl border border-[#EDEDF0] bg-[#FAFAFA] p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#101D37]">
              {label} {i + 1}
            </span>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="flex items-center gap-1 text-xs text-body hover:text-[#FF2020]"
            >
              <Icon icon={huge(Delete02Icon)} size={13} stroke={1.3} />
              Remove
            </button>
          </div>
          {render(item, (patch) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))), i)}
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, make()])}
        className="flex items-center gap-1.5 self-start rounded-lg border border-dashed border-blue/40 px-3 py-1.5 text-xs font-medium text-blue hover:bg-blue/[0.04]"
      >
        <Icon icon={huge(Add01Icon)} size={13} stroke={1.3} />
        Add {label.toLowerCase()}
      </button>
    </div>
  );
}
