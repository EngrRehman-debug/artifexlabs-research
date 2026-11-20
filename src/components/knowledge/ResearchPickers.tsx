"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Database01 } from "@untitledui/icons";
import {
  ArrowDown01Icon,
  ArrowRight01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import { LogoPair } from "./ModelLogos";
import {
  MODEL_PANELS,
  panelFor,
  REASONING,
  updateKnowledge,
  useKnowledge,
} from "@/lib/knowledge";

/** Small on/off switch (blue when on) */
export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-blue" : "bg-[#D0D5DD]"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`}
      />
    </button>
  );
}

/** Button + floating panel; closes on outside click and Escape. */
function Dropdown({
  label,
  icon,
  children,
  up,
  width = 360,
}: {
  label: ReactNode;
  icon: ReactNode;
  children: (close: () => void) => ReactNode;
  up?: boolean;
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  /* Keep the panel inside the window: shift it left when it would overflow on the right,
   * open it on the side with more room, and cap its height there (it scrolls inside),
   * so it never stretches the page. */
  const [place, setPlace] = useState<{
    shift: number;
    up: boolean;
    maxH?: number;
  }>({ shift: 0, up: !!up });
  useLayoutEffect(() => {
    if (!open || !panel.current || !ref.current) return;
    const place = () => {
      if (!panel.current || !ref.current) return;
      const btn = ref.current.getBoundingClientRect();
      const natural = panel.current.scrollHeight;
      const GAP = 8 + 16;
      const below = window.innerHeight - btn.bottom - GAP;
      /* keep clear of the sticky top bar (about 70px) */
      const above = btn.top - GAP - 64;
      const goUp = up
        ? natural <= above || above >= below
        : natural > below && above > below;
      const room = goUp ? above : below;
      const left = btn.left;
      const over = left + panel.current.offsetWidth - (window.innerWidth - 16);
      setPlace({
        shift: over > 0 ? Math.min(over, left - 16) : 0,
        up: goUp,
        maxH: natural > room ? Math.max(160, room) : undefined,
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, up]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex h-9 items-center gap-1.5 rounded-[10px] border px-2.5 text-sm leading-[1.5] tracking-[-0.02em] transition-colors ${
          open
            ? "border-blue bg-blue/[0.04] text-[#101D37]"
            : "border-[#EDEDF0] bg-white text-body hover:border-[#D0D5DD] hover:text-[#101D37]"
        }`}
      >
        {icon}
        <span className="whitespace-nowrap">{label}</span>
        <Icon
          icon={huge(ArrowDown01Icon)}
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          ref={panel}
          role="dialog"
          className={`absolute left-0 z-40 flex max-w-[calc(100vw-32px)] flex-col overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl border border-[#EDEDF0] bg-white shadow-[0_14px_30px_0_rgba(16,29,55,0.14)] ${place.up ? "bottom-11" : "top-11"}`}
          style={{
            width,
            maxHeight: place.maxH,
            transform: place.shift
              ? `translateX(-${place.shift}px)`
              : undefined,
          }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function SectionHead({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.06em] text-body uppercase">
      {children}
    </p>
  );
}

/** "Sources · Uploads + online" – which evidence the research may use. */
export function SourcesPicker({ up }: { up?: boolean }) {
  const k = useKnowledge();
  const active = k.repos.filter((r) => r.active);
  const parts = [
    k.useUploads && "Uploads",
    k.useOnline && "online",
    active.length && `${active.length} repos`,
  ].filter(Boolean);
  return (
    <Dropdown
      up={up}
      icon={<Icon icon={untitled(Database01)} size={16} />}
      label={
        <>
          Sources{" "}
          <span className="text-body">
            · {parts.length ? parts.join(" + ") : "none"}
          </span>
        </>
      }
    >
      {() => (
        <>
          <div className="border-b border-[#EDEDF0] px-4 py-3">
            <p className="text-sm font-semibold text-[#101D37]">
              Evidence sources
            </p>
            <p className="text-xs text-body">
              Answers cite the exact passage they came from.
            </p>
          </div>
          <div className="flex flex-col gap-1 px-2 py-2">
            {[
              {
                k: "useUploads" as const,
                name: "Uploaded files",
                desc: "Documents added to this workspace",
              },
              {
                k: "useOnline" as const,
                name: "Search online",
                desc: "Live web, journals and patents",
              },
            ].map((o) => (
              <div
                key={o.k}
                className="flex items-center justify-between gap-3 rounded-[10px] px-2 py-2 hover:bg-[#F8F9FC]"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[#101D37]">
                    {o.name}
                  </span>
                  <span className="block text-xs text-body">{o.desc}</span>
                </span>
                <Switch
                  on={k[o.k]}
                  label={o.name}
                  onChange={(v) => updateKnowledge(() => ({ [o.k]: v }))}
                />
              </div>
            ))}
          </div>
          <SectionHead>Knowledge Library</SectionHead>
          <ul className="flex max-h-[220px] flex-col overflow-y-auto px-2 pb-2">
            {k.repos.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-[10px] px-2 py-2 hover:bg-[#F8F9FC]">
                  <input
                    type="checkbox"
                    checked={r.active}
                    onChange={(e) =>
                      updateKnowledge((s) => ({
                        repos: s.repos.map((x) =>
                          x.id === r.id
                            ? { ...x, active: e.target.checked }
                            : x,
                        ),
                      }))
                    }
                    className="size-4 shrink-0 cursor-pointer accent-blue"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-[#101D37]">
                    {r.name}
                  </span>
                  <span className="shrink-0 text-xs text-body">
                    {r.records}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Link
            href="/knowledge"
            className="flex items-center justify-between border-t border-[#EDEDF0] px-4 py-3 text-sm font-semibold text-blue hover:bg-blue/[0.04]"
          >
            Manage Knowledge Library
            <Icon icon={huge(ArrowRight01Icon)} size={16} stroke={1.8} />
          </Link>
        </>
      )}
    </Dropdown>
  );
}

/** "Panel · 2 models" – which models research and cross-check the answer. */
export function ModelsPicker({ up }: { up?: boolean }) {
  const k = useKnowledge();
  const panel = panelFor(k.panel);
  return (
    <Dropdown
      up={up}
      width={440}
      icon={<LogoPair models={panel.models} size={20} />}
      label={
        <>
          Panel{" "}
          <span className="text-body">· {panel.models.length} models</span>
        </>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-[#EDEDF0] px-4 py-3">
            <p className="text-sm font-semibold text-[#101D37]">
              Research panel
            </p>
            <p className="text-xs text-body">
              The first model answers; the second takes over if it is busy.
            </p>
          </div>
          <div
            role="radiogroup"
            aria-label="Model panel"
            className="flex flex-col gap-2 p-3"
          >
            {MODEL_PANELS.map((p) => {
              const on = p.id === panel.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={!p.available}
                  title={p.available ? undefined : "Not connected yet"}
                  onClick={() => updateKnowledge(() => ({ panel: p.id }))}
                  className={`flex items-start gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                    on
                      ? "border-blue bg-blue/[0.05]"
                      : p.available
                        ? "border-[#EDEDF0] bg-white hover:border-[#D0D5DD]"
                        : "border-[#EDEDF0] bg-[#FAFAFA]"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border ${on ? "border-blue bg-blue text-white" : "border-[#667085] bg-white"}`}
                  >
                    {on && (
                      <Icon icon={huge(Tick02Icon)} size={14} stroke={2.2} />
                    )}
                  </span>
                  <span className={p.available ? "" : "opacity-50 grayscale"}>
                    <LogoPair models={p.models} size={30} />
                  </span>
                  <span
                    className={`min-w-0 ${p.available ? "" : "opacity-60"}`}
                  >
                    <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-[#101D37]">
                      {p.name}
                      {p.recommended && (
                        <span className="rounded-md bg-blue/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue">
                          Recommended
                        </span>
                      )}
                      {p.available ? (
                        <span className="flex items-center gap-1 rounded-md bg-[#2BCB23]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#1F9C19]">
                          <span className="size-1.5 rounded-full bg-[#2BCB23]" />
                          Available
                        </span>
                      ) : (
                        <span className="rounded-md bg-[#F2F4F7] px-1.5 py-0.5 text-[10px] font-semibold text-body">
                          Not available yet
                        </span>
                      )}
                    </span>
                    <span className="block text-xs text-body">{p.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <SectionHead>Reasoning</SectionHead>
          <div className="grid grid-cols-3 gap-1 px-3 pb-3">
            {REASONING.map((r) => {
              const on = r.id === k.reasoning;
              return (
                <button
                  key={r.id}
                  type="button"
                  title={r.desc}
                  aria-pressed={on}
                  onClick={() => updateKnowledge(() => ({ reasoning: r.id }))}
                  className={`h-8 rounded-[10px] text-xs font-semibold transition-colors ${on ? "bg-blue text-white" : "bg-[#F2F4F7] text-body hover:text-[#101D37]"}`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-[#EDEDF0] px-4 py-2.5">
            <span className="text-xs text-body">
              Gemini and Groq are connected. Claude and Perplexity are coming.
            </span>
            <button
              type="button"
              onClick={close}
              className="h-8 rounded-[10px] bg-blue px-3 text-xs font-semibold text-white"
            >
              Done
            </button>
          </div>
        </>
      )}
    </Dropdown>
  );
}

/** Sources + Models side by side (prompt toolbars) */
export default function ResearchPickers({ up }: { up?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SourcesPicker up={up} />
      <ModelsPicker up={up} />
    </div>
  );
}
