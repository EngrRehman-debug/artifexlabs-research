"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database01, Send03 } from "@untitledui/icons";
import {
  Add01Icon,
  AiMagicIcon,
  Alert02Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Copy01Icon,
  Image02Icon,
  Mic01Icon,
  Pdf02Icon,
  PencilEdit02Icon,
  RefreshIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import { EMPTY_DRAFT, missingItems, type Draft } from "@/lib/newProject";
import { SECTIONS, STEPS, seedDraft, type Step } from "./steps";
import { addCreated, slugFor } from "@/lib/createdProjects";

const STORE = "newProject:draft";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
type Phase = "prompt" | "chat" | "done";
type Saved = { phase: Phase; d: Draft; cur: string };

/* Restore defensively: an old or damaged draft must never break the page. */
const read = (): Saved | null => {
  try {
    const raw = localStorage.getItem(STORE);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Saved> | null;
    if (
      !s ||
      s.phase !== "chat" ||
      !s.d ||
      typeof s.d !== "object" ||
      typeof s.d.prompt !== "string"
    )
      return null;
    const d = { ...EMPTY_DRAFT, ...s.d } as Draft;
    for (const k of [
      "files",
      "departments",
      "teams",
      "steering",
      "workstreams",
      "gates",
      "risks",
      "regControls",
    ] as const)
      if (!Array.isArray(d[k]))
        (d as Record<string, unknown>)[k] = EMPTY_DRAFT[k];
    const cur =
      typeof s.cur === "string" &&
      (s.cur === "review" || STEPS.some((x) => x.id === s.cur))
        ? s.cur
        : STEPS[0].id;
    return { phase: "chat", d, cur };
  } catch {
    return null;
  }
};
const write = (s: Saved | null) => {
  try {
    if (s) localStorage.setItem(STORE, JSON.stringify(s));
    else localStorage.removeItem(STORE);
  } catch {
    /* storage unavailable */
  }
};

/* ---------------- small chat pieces (Figma "Generating Process") ---------------- */

function AiLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue">
        <Icon icon={huge(AiMagicIcon)} size={14} stroke={1.4} />
      </span>
      <div className="min-w-0 flex-1 text-sm leading-[1.5] tracking-[-0.02em] text-[#101D37]">
        {children}
      </div>
    </div>
  );
}

function Feedback({ text }: { text: string }) {
  const [vote, setVote] = useState<0 | 1 | -1>(0);
  const [copied, setCopied] = useState(false);
  const btn =
    "flex size-6 items-center justify-center rounded-md text-body hover:bg-[#F2F4F7] hover:text-[#101D37]";
  return (
    <div className="ml-8 flex items-center gap-1">
      <button
        type="button"
        aria-label="Copy"
        className={btn}
        onClick={() => {
          navigator.clipboard?.writeText(text).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
      >
        <Icon
          icon={huge(copied ? CheckmarkCircle02Icon : Copy01Icon)}
          size={13}
          stroke={1.3}
        />
      </button>
      <button
        type="button"
        aria-label="Helpful"
        aria-pressed={vote === 1}
        className={`${btn} ${vote === 1 ? "text-blue" : ""}`}
        onClick={() => setVote(vote === 1 ? 0 : 1)}
      >
        <Icon icon={huge(ThumbsUpIcon)} size={13} stroke={1.3} />
      </button>
      <button
        type="button"
        aria-label="Not helpful"
        aria-pressed={vote === -1}
        className={`${btn} ${vote === -1 ? "text-[#FF2020]" : ""}`}
        onClick={() => setVote(vote === -1 ? 0 : -1)}
      >
        <Icon icon={huge(ThumbsDownIcon)} size={13} stroke={1.3} />
      </button>
    </div>
  );
}

/** User answer – right aligned, Figma: light card holding a blue-outlined pill. */
function UserAnswer({ text, onEdit }: { text: string; onEdit?: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onEdit}
        disabled={!onEdit}
        title={onEdit ? "Edit this answer" : undefined}
        className="group flex max-w-[85%] items-start gap-2 rounded-2xl border border-[#EDEDF0] bg-white px-3 py-2 text-left disabled:cursor-default"
      >
        <span className="rounded-[10px] border border-blue/40 bg-blue/[0.04] px-3 py-1.5 text-sm leading-[1.5] font-medium tracking-[-0.02em] break-words whitespace-pre-line text-blue">
          {text || "—"}
        </span>
        {onEdit && (
          <span className="mt-1.5 text-body opacity-0 transition-opacity group-hover:opacity-100">
            <Icon icon={huge(PencilEdit02Icon)} size={13} stroke={1.3} />
          </span>
        )}
      </button>
    </div>
  );
}

function Typing() {
  return (
    <AiLine>
      <span className="inline-flex gap-1 py-1.5" aria-label="Thinking">
        {[0, 150, 300].map((ms) => (
          <span
            key={ms}
            className="size-1.5 animate-bounce rounded-full bg-body/60"
            style={{ animationDelay: `${ms}ms` }}
          />
        ))}
      </span>
    </AiLine>
  );
}

/* ---------------- draft preview (right side, Figma frame 4 split view) ---------------- */

function DraftPreview({
  d,
  visible,
  cur,
  onJump,
}: {
  d: Draft;
  visible: Step[];
  cur: string;
  onJump: (id: string) => void;
}) {
  const curIdx = visible.findIndex((s) => s.id === cur);
  const done = cur === "review" ? visible.length : Math.max(curIdx, 0);
  const pct = Math.round((done / visible.length) * 100);
  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-64px)] w-[300px] shrink-0 flex-col border-l border-[#EDEDF0] bg-white xl:flex">
      <div className="border-b border-[#EDEDF0] px-4 py-4">
        <p className="text-base leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
          Project draft
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EDEDF0]">
            <div
              className="h-full rounded-full bg-blue transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-medium text-body">{pct}%</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {SECTIONS.filter((s) => s !== "Review").map((sec) => (
          <div key={sec} className="mb-4">
            <p className="mb-1.5 text-[10px] font-semibold tracking-[0.06em] text-body uppercase">
              {sec}
            </p>
            <ul className="flex flex-col">
              {visible
                .filter((s) => s.section === sec)
                .map((s) => {
                  const i = visible.indexOf(s);
                  const answered = i < done;
                  const isCur = s.id === cur;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        disabled={!answered}
                        onClick={() => onJump(s.id)}
                        className={`flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left disabled:cursor-default ${answered ? "hover:bg-[#F8F9FC]" : ""}`}
                      >
                        <span
                          className={`mt-1 size-2 shrink-0 rounded-full ${answered ? "bg-[#2BCB23]" : isCur ? "bg-blue" : "bg-[#EDEDF0]"}`}
                        />
                        <span className="min-w-0">
                          <span
                            className={`block text-xs font-medium ${isCur ? "text-blue" : "text-[#101D37]"}`}
                          >
                            {s.label}
                          </span>
                          {answered && (
                            <span className="line-clamp-2 block text-[11px] leading-[1.4] text-body">
                              {s.summary(d)}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

/* ---------------- review card (Figma summary card) ---------------- */

function ReviewCard({
  d,
  visible,
  onJump,
  onCreate,
}: {
  d: Draft;
  visible: Step[];
  onJump: (id: string) => void;
  onCreate: () => void;
}) {
  const missing = missingItems(d);
  const [open, setOpen] = useState<string | null>("Charter");
  return (
    <div className="ml-8 flex flex-col gap-3 rounded-2xl border border-[#EDEDF0] bg-white p-4 shadow-[0_14px_30px_0_rgba(40,92,224,0.06)]">
      <div className="flex items-start justify-between gap-3 border-b border-[#EDEDF0] pb-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.06em] text-blue uppercase">
            {d.governance} project
          </p>
          <p className="text-base leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37]">
            {d.name || "Untitled project"}
          </p>
          <p className="line-clamp-2 text-xs leading-[1.5] text-body">
            {d.objective}
          </p>
        </div>
        <span className="shrink-0 rounded-lg bg-[#FAFAFA] px-2 py-1 text-xs font-medium text-body">
          {d.type}
        </span>
      </div>

      {SECTIONS.filter((s) => s !== "Review").map((sec) => {
        const items = visible.filter((s) => s.section === sec);
        const isOpen = open === sec;
        return (
          <div key={sec} className="rounded-xl border border-[#EDEDF0]">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : sec)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-[#101D37]"
            >
              {sec}
              <span
                className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                <Icon icon={huge(ArrowDown01Icon)} size={14} />
              </span>
            </button>
            {isOpen && (
              <ol className="flex flex-col gap-1.5 border-t border-[#EDEDF0] px-3 py-2.5">
                {items.map((s, i) => (
                  <li
                    key={s.id}
                    className="flex items-start gap-2 text-xs leading-[1.5]"
                  >
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-blue/10 text-[10px] font-semibold text-blue">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-medium text-[#101D37]">
                        {s.label}:{" "}
                      </span>
                      <span className="break-words text-body">
                        {s.summary(d)}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onJump(s.id)}
                      className="shrink-0 text-blue hover:underline"
                    >
                      Edit
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}

      {missing.length > 0 ? (
        <div className="rounded-xl border border-[#FF6720]/30 bg-[#FF6720]/[0.05] p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#FF6720]">
            <Icon icon={huge(Alert02Icon)} size={14} stroke={1.4} />
            {missing.length} {missing.length === 1 ? "item" : "items"} to
            complete
          </p>
          <ul className="mt-1.5 flex flex-col gap-1">
            {missing.map((m) => (
              <li
                key={m.text}
                className="flex items-center justify-between gap-2 text-xs text-[#344054]"
              >
                {m.text}
                <button
                  type="button"
                  onClick={() => onJump(m.step)}
                  className="shrink-0 font-medium text-blue hover:underline"
                >
                  Fix
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="flex items-center gap-1.5 text-xs font-medium text-[#2BCB23]">
          <Icon icon={huge(CheckmarkCircle02Icon)} size={14} stroke={1.4} />
          Everything required is in place.
        </p>
      )}

      <p className="text-[11px] leading-[1.5] text-body">
        Creating this project establishes its charter, departments, teams and
        governance. Research work packages are configured separately.
      </p>
      <button
        type="button"
        disabled={missing.length > 0}
        onClick={onCreate}
        className="flex h-9 items-center justify-center gap-1.5 self-start rounded-[10px] bg-blue px-4 text-sm font-semibold text-white disabled:opacity-40"
      >
        Create project
      </button>
    </div>
  );
}

/* ---------------- main flow ---------------- */

export default function NewProjectFlow({
  onPhase,
}: {
  onPhase?: (p: Phase) => void;
}) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [cur, setCur] = useState<string>(STEPS[0].id);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [custom, setCustom] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLInputElement>(null);
  const loaded = useRef(false);

  /* restore an unfinished draft */
  useEffect(() => {
    const s = read();
    if (s) {
      setD(s.d);
      setCur(s.cur);
      setPhase("chat");
      setResumed(true);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current && phase === "chat") write({ phase, d, cur });
  }, [phase, d, cur]);

  useEffect(() => onPhase?.(phase), [phase, onPhase]);

  const visible = useMemo(() => STEPS.filter((s) => !s.when || s.when(d)), [d]);
  const step = visible.find((s) => s.id === cur) ?? null; // null => review
  const curIdx = step ? visible.indexOf(step) : visible.length;
  const answered = visible.slice(0, curIdx);
  const section = step?.section ?? "Review";

  /* new question: brief "thinking" pause, then scroll */
  useEffect(() => {
    if (phase !== "chat") return;
    setThinking(true);
    setError(null);
    setCustom("");
    const t = setTimeout(() => setThinking(false), 450);
    return () => clearTimeout(t);
  }, [cur, phase]);

  /* one smooth scroll per new question: its block is pinned just under the sticky
   * header (Claude-style), so the typing dots and then the form appear in place –
   * no second jump when the form replaces the dots, no manual scrolling. */
  useEffect(() => {
    if (phase !== "chat") return;
    /* the first question stays below the intro message – nothing to scroll past yet */
    if (cur === STEPS[0].id && !returnTo.current) return;
    const id = setTimeout(
      () => currentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      30,
    );
    return () => clearTimeout(id);
  }, [cur, phase]);

  /* once the form is shown, focus its first field without moving the page */
  useEffect(() => {
    if (phase !== "chat" || thinking) return;
    if (STEPS.find((s) => s.id === cur)?.composer)
      return composerRef.current?.focus({ preventScroll: true });
    const first = currentRef.current?.querySelector<HTMLElement>(
      "form input:not([type=date]), form textarea",
    );
    first?.focus({ preventScroll: true });
  }, [cur, thinking, phase]);

  const set = useCallback(
    (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
      setD((p) => ({
        ...p,
        ...(typeof patch === "function" ? patch(p) : patch),
      }));
      setError(null);
    },
    [],
  );

  /* latest draft + guard so a double click / key repeat can't skip a question */
  const dRef = useRef(d);
  dRef.current = d;
  /* where to go back to after editing an earlier answer */
  const returnTo = useRef<string | null>(null);
  /** question ids that were visible when the edit started */
  const baseIds = useRef<string[]>([]);

  const goNext = useCallback(
    (draft: Draft) => {
      const vis = STEPS.filter((s) => !s.when || s.when(draft));
      const back = returnTo.current;
      returnTo.current = null;
      if (back && (back === "review" || vis.some((s) => s.id === back))) {
        /* the edit made a new question necessary (e.g. regulated controls): ask it first */
        const fresh = vis.find(
          (s) => s.id !== cur && !baseIds.current.includes(s.id),
        );
        if (fresh) {
          baseIds.current.push(fresh.id);
          returnTo.current = back;
          setCur(fresh.id);
        } else setCur(back);
        return;
      }
      const i = vis.findIndex((s) => s.id === cur);
      setCur(vis[i + 1]?.id ?? "review");
    },
    [cur],
  );

  const next = () => {
    if (!step) return;
    const msg = step.validate?.(d);
    if (msg) return setError(msg);
    goNext(d);
  };

  const advancing = useRef(false);
  useEffect(() => {
    advancing.current = false;
  }, [cur]);

  const pick = useCallback(
    (patch: Partial<Draft>) => {
      if (advancing.current) return;
      advancing.current = true;
      const n = { ...dRef.current, ...patch };
      setD(n);
      setTimeout(() => goNext(n), 180);
    },
    [goNext],
  );

  const skip = () => step && goNext(d);
  const jump = (id: string) => {
    if (id === cur) return;
    if (!returnTo.current) {
      returnTo.current = cur;
      baseIds.current = visible.map((s) => s.id);
    }
    setCur(id);
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    setD(
      seedDraft(
        EMPTY_DRAFT,
        promptText.trim(),
        files.map((f) => f.name),
      ),
    );
    setCur(STEPS[0].id);
    setPhase("chat");
  };

  const reset = () => {
    write(null);
    setD(EMPTY_DRAFT);
    setCur(STEPS[0].id);
    setPromptText("");
    setFiles([]);
    setResumed(false);
    setPhase("prompt");
  };

  const create = () => {
    setCreatedSlug(slugFor(addCreated(d)));
    write(null);
    setPhase("done");
  };

  /* composer */
  const composerKey = step?.composer?.key;
  const composerValue = composerKey ? (d[composerKey] as string) : custom;
  const composerEnabled =
    !!step && !thinking && (!!composerKey || !!step.choice);
  const composerPlaceholder = !step
    ? "Review the summary above"
    : (step.composer?.placeholder ??
      (step.choice
        ? "Or type a different answer…"
        : "Fill in the form above, then Continue"));
  const sendComposer = () => {
    if (!step) return;
    if (composerKey) return next();
    if (step.choice && custom.trim()) {
      const keyById: Record<string, keyof Draft> = {
        type: "type",
        governance: "governance",
        priority: "priority",
        sponsor: "sponsor",
        lead: "lead",
        teamMode: "teamMode",
        controlsMode: "controlsMode",
      };
      const k = keyById[step.id];
      if (k) pick({ [k]: custom.trim() } as Partial<Draft>);
    }
  };

  /* ---------- prompt phase (Figma "New Projects") ---------- */
  if (phase === "prompt")
    return (
      <div className="flex w-full max-w-[885px] flex-col gap-[30px]">
        <h1 className="text-center text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
          Create <span className="text-blue">New Project</span>
        </h1>
        <form
          onSubmit={start}
          className="flex flex-col gap-4 rounded-[20px] border border-[#EDEDF0] bg-white p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.10)]"
        >
          <div className="flex flex-col gap-5 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] p-4">
            <label className="flex items-start gap-2">
              <Icon
                icon={huge(Add01Icon)}
                size={16}
                className="mt-1 shrink-0 text-body"
              />
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={5}
                placeholder="Describe the project: the question, research objective or decision to make, scope, stakeholders and timeline…"
                className="min-h-[120px] w-full resize-none bg-transparent text-base leading-6 tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
              />
            </label>
            <div className="flex flex-wrap items-center gap-[10px] pl-6">
              <button
                type="button"
                aria-label="Attach image"
                onClick={() => imageInput.current?.click()}
                className="flex size-[60px] items-center justify-center rounded-[10px] border border-[#EDEDF0] bg-white p-2.5 text-[#101D37]"
              >
                <Icon icon={huge(Image02Icon)} size={30} stroke={1.5} />
              </button>
              <button
                type="button"
                aria-label="Attach PDF"
                onClick={() => pdfInput.current?.click()}
                className="flex size-[60px] items-center justify-center rounded-[10px] border border-[#EDEDF0] bg-white p-2.5 text-[#101D37]"
              >
                <Icon icon={huge(Pdf02Icon)} size={30} stroke={1.5} />
              </button>
              {files.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="flex h-[60px] max-w-[220px] items-center gap-2 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-xs text-[#242C2C]"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() =>
                      setFiles((all) => all.filter((_, j) => j !== i))
                    }
                    className="text-body"
                  >
                    <Icon icon={huge(Cancel01Icon)} size={14} stroke={1.2} />
                  </button>
                </span>
              ))}
              <input
                ref={imageInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) =>
                  e.target.files &&
                  setFiles((f) => [...f, ...Array.from(e.target.files!)])
                }
              />
              <input
                ref={pdfInput}
                type="file"
                accept="application/pdf"
                multiple
                hidden
                onChange={(e) =>
                  e.target.files &&
                  setFiles((f) => [...f, ...Array.from(e.target.files!)])
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2.5">
            <button
              type="button"
              className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] p-2.5 text-sm leading-[1.5] tracking-[-0.02em] text-body"
            >
              <Icon icon={untitled(Database01)} size={16} />
              Evidence Sources
              <Icon icon={huge(ArrowDown01Icon)} size={16} />
            </button>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                aria-label="Voice input"
                className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDEDF0] text-body"
              >
                <Icon icon={huge(Mic01Icon)} size={16} />
              </button>
              <button
                type="submit"
                aria-label="Start project setup"
                disabled={!promptText.trim()}
                className="flex size-9 items-center justify-center rounded-[10px] bg-blue text-white disabled:opacity-40"
              >
                <Icon icon={untitled(Send03)} size={16} />
              </button>
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-body">
          I&apos;ll walk you through a few quick steps to set up the project —
          most fields are filled in from your description.
        </p>
      </div>
    );

  /* ---------- created ---------- */
  if (phase === "done")
    return (
      <div className="flex w-full max-w-[640px] flex-col items-center gap-4 rounded-[20px] border border-[#EDEDF0] bg-white p-8 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-[#2BCB23]/10 text-[#2BCB23]">
          <Icon icon={huge(CheckmarkCircle02Icon)} size={26} stroke={1.5} />
        </span>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-[#101D37]">
          {d.name} is set up
        </h2>
        <p className="text-sm text-body">
          Charter, {plural(d.departments.length, "department")}, {plural(d.workstreams.length, "workstream")} and{" "}
          {plural(d.gates.length, "decision gate")} were recorded.
        </p>
        <div className="flex gap-2">
          <Link
            href={createdSlug ? `/projects/${createdSlug}` : "/projects"}
            className="flex h-9 items-center rounded-[10px] bg-blue px-4 text-sm font-semibold text-white"
          >
            Open project
          </Link>
          <Link
            href="/projects"
            className="flex h-9 items-center rounded-[10px] border border-[#EDEDF0] px-4 text-sm font-semibold text-[#242C2C]"
          >
            All projects
          </Link>
          <button
            type="button"
            onClick={reset}
            className="h-9 rounded-[10px] border border-[#EDEDF0] px-4 text-sm font-semibold text-[#242C2C]"
          >
            Create another
          </button>
        </div>
      </div>
    );

  /* ---------- chat ---------- */
  return (
    <div className="flex min-w-0 flex-1">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* progress – sections like the reference wizard */}
        <div className="sticky top-16 z-20 border-b border-[#EDEDF0] bg-[#F8F9FC]/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[760px] items-center gap-3">
            <ol className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SECTIONS.map((s, i) => {
                const si = SECTIONS.indexOf(section);
                return (
                  <li key={s} className="flex items-center gap-1">
                    <span
                      className={`rounded-md px-2 py-1 text-xs whitespace-nowrap ${
                        i === si
                          ? "bg-blue/10 font-semibold text-blue"
                          : i < si
                            ? "text-[#101D37]"
                            : "text-body"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")} {s}
                    </span>
                    {i < SECTIONS.length - 1 && (
                      <span className="text-[#D0D5DD]">›</span>
                    )}
                  </li>
                );
              })}
            </ol>
            <span className="shrink-0 text-xs text-body">
              {step ? `Step ${curIdx + 1} of ${visible.length}` : "Review"}
            </span>
            <button
              type="button"
              onClick={reset}
              title="Start over"
              className="flex shrink-0 items-center gap-1 text-xs text-body hover:text-[#101D37]"
            >
              <Icon icon={huge(RefreshIcon)} size={13} stroke={1.3} />
              <span className="hidden sm:inline">Start over</span>
            </button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col gap-5 px-4 pt-6 pb-4 sm:px-6">
          {resumed && (
            <p className="rounded-lg bg-blue/[0.06] px-3 py-2 text-xs text-blue">
              Welcome back — I restored your unfinished draft.
            </p>
          )}

          {/* opening message */}
          <UserAnswer
            text={
              d.prompt + (d.files.length ? `\n📎 ${d.files.join(", ")}` : "")
            }
          />
          <AiLine>
            Thanks — I&apos;ve drafted the basics from your description.
            Let&apos;s confirm it in {visible.length} quick steps across
            charter, organization, delivery and controls. Most fields are
            already filled in; optional ones can be skipped.
          </AiLine>

          {answered.map((s) => (
            <div key={s.id} className="flex flex-col gap-2.5">
              <AiLine>{s.ask(d)}</AiLine>
              <UserAnswer text={s.summary(d)} onEdit={() => jump(s.id)} />
            </div>
          ))}

          {/* current question; min height leaves room to pin it to the top of the view */}
          <div
            ref={currentRef}
            className="min-h-[calc(100dvh-260px)] scroll-mt-[136px]"
          >
            {thinking ? (
              <Typing />
            ) : step ? (
              <div className="flex flex-col gap-3">
                <AiLine>
                  {step.ask(d)}
                  {step.hint && (
                    <span className="mt-0.5 block text-xs text-body">
                      {step.hint}
                    </span>
                  )}
                </AiLine>
                {/* a real form so Enter in any single-line field continues */}
                <form
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    next();
                  }}
                  className="ml-8 flex flex-col gap-3 rounded-2xl border border-[#EDEDF0] bg-white p-4 shadow-[0_1px_5px_0_rgba(0,0,0,0.04)]"
                >
                  {step.render?.({ d, set, pick, active: true })}
                  {step.composer && (
                    <p className="text-xs text-body">
                      ↓{" "}
                      {d[step.composer.key]
                        ? "Edit the answer in the message box below."
                        : "Type your answer in the message box below."}
                    </p>
                  )}
                  {error && (
                    <p
                      role="alert"
                      className="flex items-center gap-1.5 text-xs text-[#FF2020]"
                    >
                      <Icon icon={huge(Alert02Icon)} size={13} stroke={1.4} />
                      {error}
                    </p>
                  )}
                  {!step.choice && (
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        className="h-9 rounded-[10px] bg-blue px-4 text-sm font-semibold text-white"
                      >
                        Continue
                      </button>
                      {step.optional && (
                        <button
                          type="button"
                          onClick={skip}
                          className="h-9 rounded-[10px] px-3 text-sm font-medium text-body hover:text-[#101D37]"
                        >
                          Skip
                        </button>
                      )}
                    </div>
                  )}
                </form>
                <Feedback text={step.ask(d)} />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <AiLine>
                  Here&apos;s the full project setup. Open a section to check
                  it, use “Edit” to change anything, then create the project.
                </AiLine>
                <ReviewCard
                  d={d}
                  visible={visible}
                  onJump={jump}
                  onCreate={create}
                />
              </div>
            )}
          </div>
        </div>

        {/* composer (Figma bottom input) */}
        <div className="sticky bottom-0 z-20 bg-gradient-to-t from-[#F8F9FC] via-[#F8F9FC] to-transparent px-4 pt-4 pb-4 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendComposer();
            }}
            className="mx-auto flex max-w-[760px] flex-col gap-3 rounded-[20px] border border-[#EDEDF0] bg-white p-3 shadow-[0_14px_30px_0_rgba(40,92,224,0.08)]"
          >
            <label className="flex items-center gap-2 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] px-3 py-2.5">
              <Icon
                icon={huge(Add01Icon)}
                size={16}
                className="shrink-0 text-body"
              />
              <input
                ref={composerRef}
                value={composerValue}
                disabled={!composerEnabled}
                onChange={(e) =>
                  composerKey
                    ? set({ [composerKey]: e.target.value } as Partial<Draft>)
                    : setCustom(e.target.value)
                }
                placeholder={composerPlaceholder}
                className="w-full min-w-0 bg-transparent text-sm leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body disabled:cursor-not-allowed"
              />
            </label>
            <div className="flex items-center justify-between">
              <span className="flex h-8 items-center gap-1 rounded-[10px] border border-[#EDEDF0] px-2.5 text-xs text-body">
                <Icon icon={untitled(Database01)} size={14} />
                Evidence Sources
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Voice input"
                  className="flex size-8 items-center justify-center rounded-[10px] border border-[#EDEDF0] text-body"
                >
                  <Icon icon={huge(Mic01Icon)} size={15} />
                </button>
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={!composerEnabled}
                  className="flex size-8 items-center justify-center rounded-[10px] bg-blue text-white disabled:opacity-40"
                >
                  <Icon icon={untitled(Send03)} size={15} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <DraftPreview
        d={d}
        visible={visible}
        cur={step ? step.id : "review"}
        onJump={jump}
      />
    </div>
  );
}
