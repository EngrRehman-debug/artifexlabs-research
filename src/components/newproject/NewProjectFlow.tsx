"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Database01, Send03 } from "@untitledui/icons";
import {
  Add01Icon,
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  Image02Icon,
  Mic01Icon,
  Pdf02Icon,
  PencilEdit02Icon,
  RefreshIcon,
  SparklesIcon,
  Tick02Icon,
  Cancel01Icon,
  CheckListIcon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import {
  EMPTY_DRAFT,
  missingItems,
  suggestFromPrompt,
  type Draft,
} from "@/lib/newProject";
import { addCreated, slugFor } from "@/lib/createdProjects";
import {
  CARDS,
  KvRow,
  SECTIONS,
  SubCard,
  type CardDef,
  type Ctx,
} from "./cards";

const STORE = "newProject:draft:v2";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
type Phase = "prompt" | "chat" | "done";
type Msg = { from: "ai" | "user"; text: string; at: number };
type Saved = {
  phase: Phase;
  d: Draft;
  cur: string;
  startedAt: number;
  touched: string[];
  thread: Record<string, Msg[]>;
  maxIdx: number;
};

const CARD_IDS = CARDS.map((c) => c.id);
const indexOf = (id: string) =>
  id === "review" ? CARDS.length : CARD_IDS.indexOf(id);

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
      typeof s.cur === "string" && indexOf(s.cur) >= 0 ? s.cur : CARDS[0].id;
    return {
      phase: "chat",
      d,
      cur,
      startedAt: typeof s.startedAt === "number" ? s.startedAt : Date.now(),
      touched: Array.isArray(s.touched) ? s.touched : [],
      thread: s.thread && typeof s.thread === "object" ? s.thread : {},
      maxIdx: Math.max(
        typeof s.maxIdx === "number" ? s.maxIdx : 0,
        indexOf(cur),
      ),
    };
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

const ago = (at: number, now: number) => {
  const m = Math.floor((now - at) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  return h < 24
    ? `${h} hour${h === 1 ? "" : "s"} ago`
    : `${Math.floor(h / 24)} days ago`;
};

const hasValue = (v: unknown) =>
  Array.isArray(v)
    ? v.length > 0
    : typeof v === "string"
      ? v.trim().length > 0
      : v != null;

/* ---------------- Figma "Create New Project" pieces ---------------- */

/** Blue 40px AI avatar with the sparkle */
function AiAvatar() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue text-white">
      <Icon icon={huge(SparklesIcon)} size={20} stroke={1.5} />
    </span>
  );
}

/** Stepper: 5 circles (40px) on a 4px track with a midpoint dot per segment. */
function Stepper({
  si,
  partial,
  completed,
  canOpen,
  onOpen,
}: {
  si: number;
  /** section was finished earlier (stays ticked when the user goes back) */
  completed: (i: number) => boolean;
  /** current section has at least one confirmed card */
  partial: boolean;
  canOpen: (i: number) => boolean;
  onOpen: (i: number) => void;
}) {
  return (
    <ol className="grid grid-cols-5" aria-label="Project setup progress">
      {SECTIONS.map((s, i) => {
        const current = i === si;
        const done = !current && (i < si || completed(i));
        const fill = done ? "100%" : current && partial ? "50%" : "0%";
        const dotOn = done || (current && partial);
        const open = canOpen(i) && !current;
        return (
          <li key={s} className="relative flex flex-col items-center gap-1.5">
            {i < SECTIONS.length - 1 && (
              <span
                aria-hidden
                className="absolute top-[18px] left-[calc(50%+20px)] h-1 w-[calc(100%-40px)] rounded-full bg-[#EDEDF0]"
              >
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-blue transition-[width] duration-500"
                  style={{ width: fill }}
                />
                <span
                  className={`absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white transition-colors ${
                    dotOn ? "border-blue" : "border-[#EDEDF0]"
                  }`}
                />
              </span>
            )}
            <button
              type="button"
              disabled={!open}
              onClick={() => onOpen(i)}
              aria-current={current ? "step" : undefined}
              aria-label={`${i + 1}. ${s}${done ? " (done)" : current ? " (current)" : ""}`}
              className={`relative z-10 flex size-10 items-center justify-center rounded-full text-base leading-none font-medium transition-colors disabled:cursor-default ${
                done || current
                  ? "bg-blue font-semibold text-white"
                  : "border-2 border-[#EDEDF0] bg-white text-[#667085]"
              } ${open ? "hover:ring-4 hover:ring-blue/15" : ""}`}
            >
              {done ? (
                <Icon icon={huge(Tick02Icon)} size={18} stroke={2} />
              ) : (
                i + 1
              )}
            </button>
            <span
              className={`text-center text-sm leading-[1.5] tracking-[-0.02em] sm:text-base ${
                current
                  ? "font-semibold text-[#101D37]"
                  : done
                    ? "font-medium text-[#101D37]"
                    : "font-medium text-[#667085]"
              }`}
            >
              {s}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AiBubble({
  text,
  at,
  now,
}: {
  text: string;
  at: number;
  now: number;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <AiAvatar />
      <div className="flex min-w-0 flex-col gap-2">
        <p className="w-fit max-w-full rounded-[20px] border border-[#EDEDF0] bg-white px-5 py-5 text-base leading-6 tracking-[-0.02em] text-[#101D37]">
          {text}
        </p>
        <span className="text-xs leading-[1.5] text-body">{ago(at, now)}</span>
      </div>
    </div>
  );
}

function UserBubble({
  text,
  at,
  now,
}: {
  text: string;
  at: number;
  now: number;
}) {
  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="flex min-w-0 flex-col gap-2">
        <p className="w-fit max-w-full rounded-[20px] bg-[#E8EEFC] px-5 py-5 text-base leading-6 tracking-[-0.02em] break-words whitespace-pre-line text-[#101D37]">
          {text}
        </p>
        <span className="text-xs leading-[1.5] text-body">{ago(at, now)}</span>
      </div>
      <Image
        src="/images/avatar-ibrahim.png"
        alt="You"
        width={80}
        height={80}
        className="size-10 shrink-0 rounded-full object-cover"
      />
    </div>
  );
}

function ConfirmButton({
  onClick,
  label = "Confirm & Continue",
  disabled,
}: {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-fit items-center gap-1 rounded-lg bg-blue px-3 text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-white disabled:opacity-40"
    >
      {label}
      <Icon icon={huge(ArrowRight01Icon)} size={16} stroke={1.8} />
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

/** The AI card: white, radius 20, padding 16; header (icon + title, Edit Details) and a grey inner panel. */
function AiCard({
  card,
  ctx,
  onToggleEdit,
  onConfirm,
  error,
}: {
  card: CardDef;
  ctx: Ctx;
  onToggleEdit: () => void;
  onConfirm: () => void;
  error: string | null;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-2.5">
        <span className="hidden sm:block">
          <AiAvatar />
        </span>
        <article className="flex min-w-0 flex-1 flex-col gap-5 rounded-[20px] border border-[#EDEDF0] bg-white p-4">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37]">
              <Icon icon={huge(card.icon)} size={20} stroke={1.6} />
              {card.title}
            </h3>
            <button
              type="button"
              onClick={onToggleEdit}
              aria-pressed={ctx.editing}
              className={`flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm leading-[1.5] font-semibold tracking-[-0.02em] ${
                ctx.editing
                  ? "border border-blue bg-white text-blue hover:bg-blue/[0.04]"
                  : "bg-blue text-white"
              }`}
            >
              <Icon
                icon={huge(ctx.editing ? Tick02Icon : PencilEdit02Icon)}
                size={16}
                stroke={1.6}
              />
              {ctx.editing ? "Done Editing" : "Edit Details"}
            </button>
          </header>
          <div className="flex flex-col gap-2.5 rounded-2xl border border-[#EDEDF0] bg-[#FAFAFA] p-3 sm:p-5">
            {card.body(ctx)}
            {!card.after && (
              <div className="mt-1.5 flex flex-col gap-2">
                <ErrorLine text={error} />
                <ConfirmButton onClick={onConfirm} />
              </div>
            )}
          </div>
        </article>
      </div>
      {card.after && (
        <article className="flex flex-col gap-5 rounded-[20px] border border-[#EDEDF0] bg-white p-4">
          <h3 className="flex items-center gap-2 text-lg leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37]">
            <Icon icon={huge(card.after.icon)} size={20} stroke={1.6} />
            {card.after.title}
          </h3>
          {card.after.body(ctx)}
          <div className="flex flex-col gap-2">
            <ErrorLine text={error} />
            <ConfirmButton onClick={onConfirm} />
          </div>
        </article>
      )}
    </div>
  );
}

/** Review: every confirmed card as a read-only summary row, missing items, Create project. */
function ReviewCard({
  d,
  onJump,
  onCreate,
}: {
  d: Draft;
  onJump: (id: string) => void;
  onCreate: () => void;
}) {
  const missing = missingItems(d);
  return (
    <div className="flex items-start gap-2.5">
      <span className="hidden sm:block">
        <AiAvatar />
      </span>
      <article className="flex min-w-0 flex-1 flex-col gap-5 rounded-[20px] border border-[#EDEDF0] bg-white p-4">
        <header className="flex items-center gap-2">
          <Icon icon={huge(CheckListIcon)} size={20} stroke={1.6} />
          <h3 className="text-lg leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37]">
            Review And Create
          </h3>
        </header>
        <div className="flex flex-col gap-2.5 rounded-2xl border border-[#EDEDF0] bg-[#FAFAFA] p-3 sm:p-5">
          <div className="flex flex-col gap-1 pb-1">
            <p className="text-xs font-semibold tracking-[0.06em] text-blue uppercase">
              {d.governance} project
            </p>
            <p className="text-lg leading-[1.4] font-semibold tracking-[-0.02em] text-[#101D37]">
              {d.name || "Untitled project"}
            </p>
            <p className="text-sm leading-[1.5] text-body">{d.objective}</p>
          </div>
          {SECTIONS.filter((s) => s !== "Review").map((sec) => (
            <SubCard
              key={sec}
              icon={CARDS.find((c) => c.section === sec)!.icon}
              title={sec}
            >
              <div className="flex flex-col gap-2.5">
                {CARDS.filter((c) => c.section === sec).map((c) => (
                  <KvRow
                    key={c.id}
                    grey
                    label={<span className="text-base">{c.title}</span>}
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-sm leading-[1.5] break-words text-[#344054]">
                        {c.summary(d)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onJump(c.id)}
                        className="shrink-0 text-sm font-semibold text-blue hover:underline"
                      >
                        Edit
                      </button>
                    </span>
                  </KvRow>
                ))}
              </div>
            </SubCard>
          ))}
          {missing.length > 0 ? (
            <div className="rounded-xl border border-[#FF6720]/30 bg-[#FF6720]/[0.05] p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#FF6720]">
                <Icon icon={huge(Alert02Icon)} size={15} stroke={1.5} />
                {plural(missing.length, "item")} to complete
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {missing.map((m) => (
                  <li
                    key={m.text}
                    className="flex items-center justify-between gap-2 text-sm text-[#344054]"
                  >
                    {m.text}
                    <button
                      type="button"
                      onClick={() => onJump(m.step)}
                      className="shrink-0 font-semibold text-blue hover:underline"
                    >
                      Fix
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-[#2BCB23]">
              <Icon icon={huge(CheckmarkCircle02Icon)} size={16} stroke={1.5} />
              Everything required is in place.
            </p>
          )}
          <div className="mt-1.5">
            <ConfirmButton
              label="Create Project"
              onClick={onCreate}
              disabled={missing.length > 0}
            />
          </div>
        </div>
      </article>
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
  const [cur, setCur] = useState<string>(CARDS[0].id);
  const [startedAt, setStartedAt] = useState(0);
  const [touched, setTouched] = useState<string[]>([]);
  const [thread, setThread] = useState<Record<string, Msg[]>>({});
  const [maxIdx, setMaxIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  const [now, setNow] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const firstRender = useRef(true);

  /* restore an unfinished draft */
  useEffect(() => {
    const s = read();
    if (s) {
      setD(s.d);
      setCur(s.cur);
      setStartedAt(s.startedAt);
      setTouched(s.touched);
      setThread(s.thread);
      setMaxIdx(s.maxIdx);
      setPhase("chat");
      setResumed(true);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current && phase === "chat")
      write({ phase, d, cur, startedAt, touched, thread, maxIdx });
  }, [phase, d, cur, startedAt, touched, thread, maxIdx]);

  useEffect(() => onPhase?.(phase), [phase, onPhase]);

  /* relative times ("2 mins ago") are computed on the client and refreshed */
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* new card: back to the stepper, smoothly */
  useEffect(() => {
    if (phase !== "chat") return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cur, phase]);

  const card = CARDS.find((c) => c.id === cur) ?? null; // null => review
  const idx = indexOf(cur);
  const si = card ? SECTIONS.indexOf(card.section) : SECTIONS.length - 1;
  const partial =
    !!card && CARDS.findIndex((c) => c.section === card.section) < idx;

  const set = useCallback(
    (patch: Partial<Draft> | ((d: Draft) => Partial<Draft>)) => {
      setD((p) => {
        const delta = typeof patch === "function" ? patch(p) : patch;
        const keys = Object.keys(delta);
        setTouched((t) =>
          keys.every((k) => t.includes(k))
            ? t
            : [...t, ...keys.filter((k) => !t.includes(k))],
        );
        return { ...p, ...delta };
      });
      setError(null);
    },
    [],
  );

  const ctx: Ctx = useMemo(
    () => ({
      d,
      set,
      editing,
      ai: (k) => !touched.includes(k as string) && hasValue(d[k]),
    }),
    [d, set, editing, touched],
  );

  const go = (id: string) => {
    setCur(id);
    setEditing(false);
    setError(null);
    setMaxIdx((m) => Math.max(m, indexOf(id)));
  };

  const confirm = () => {
    if (!card) return;
    const msg = card.validate?.(d);
    if (msg) {
      setError(msg);
      setEditing(true);
      return;
    }
    go(CARDS[idx + 1]?.id ?? "review");
  };

  const openSection = (i: number) => {
    const first =
      SECTIONS[i] === "Review"
        ? "review"
        : CARDS.find((c) => c.section === SECTIONS[i])!.id;
    if (indexOf(first) <= maxIdx) go(first);
  };

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = promptText.trim();
    if (!prompt) return;
    setD({
      ...EMPTY_DRAFT,
      ...suggestFromPrompt(prompt),
      prompt,
      files: files.map((f) => f.name),
    } as Draft);
    setStartedAt(Date.now());
    setNow(Date.now());
    setTouched([]);
    setThread({});
    setMaxIdx(0);
    setCur(CARDS[0].id);
    setEditing(false);
    setPhase("chat");
  };

  const reset = () => {
    write(null);
    setD(EMPTY_DRAFT);
    setCur(CARDS[0].id);
    setPromptText("");
    setFiles([]);
    setThread({});
    setTouched([]);
    setResumed(false);
    setPhase("prompt");
  };

  const create = () => {
    setCreatedSlug(slugFor(addCreated(d)));
    write(null);
    setPhase("done");
  };

  /* bottom composer: a note for the current card; the assistant acknowledges it */
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (!text) return;
    const at = Date.now();
    const reply = card
      ? `Noted for “${card.title}”. Use Edit Details to change any field, then Confirm & Continue when it looks right.`
      : "Noted. Use Edit on any section to change it, then Create Project.";
    setThread((t) => ({
      ...t,
      [cur]: [
        ...(t[cur] ?? []),
        { from: "user", text, at },
        { from: "ai", text: reply, at },
      ],
    }));
    setNow(at);
    setMessage("");
    setTimeout(
      () =>
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      30,
    );
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
          Charter, {plural(d.departments.length, "department")},{" "}
          {plural(d.workstreams.length, "workstream")} and{" "}
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

  /* ---------- chat (Figma "Create New Project": stepper + conversation card) ---------- */
  const msgs = thread[cur] ?? [];
  return (
    <div className="flex w-full min-w-0 flex-col">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
          Create <span className="text-blue">New Project</span>
        </h1>
        <button
          type="button"
          onClick={reset}
          title="Discard this draft and start over"
          className="flex shrink-0 items-center gap-1 text-sm text-body hover:text-[#101D37]"
        >
          <Icon icon={huge(RefreshIcon)} size={14} stroke={1.4} />
          <span className="hidden sm:inline">Start over</span>
        </button>
      </div>

      <div
        ref={topRef}
        className="mt-[30px] scroll-mt-24 overflow-x-auto [scrollbar-width:none] lg:-mx-[18px] [&::-webkit-scrollbar]:hidden"
      >
        <div className="min-w-[560px]">
          <Stepper
            si={si}
            partial={partial}
            completed={(i) =>
              SECTIONS[i] !== "Review" &&
              CARDS.reduce(
                (m, c, j) => (c.section === SECTIONS[i] ? j : m),
                -1,
              ) < maxIdx
            }
            canOpen={(i) =>
              indexOf(
                SECTIONS[i] === "Review"
                  ? "review"
                  : CARDS.find((c) => c.section === SECTIONS[i])!.id,
              ) <= maxIdx
            }
            onOpen={openSection}
          />
        </div>
      </div>

      {/* conversation card: #FAFAFA, border, radius 20; composer pinned to its bottom */}
      <section className="mt-8 flex min-h-[calc(100dvh-236px)] flex-col rounded-[20px] border border-[#EDEDF0] bg-[#FAFAFA] shadow-[0_14px_30px_0_rgba(40,92,224,0.06)]">
        <div className="flex flex-1 flex-col gap-5 px-3 pt-[30px] pb-6 sm:px-5">
          {resumed && (
            <p className="w-fit rounded-lg bg-blue/[0.06] px-3 py-2 text-sm text-blue">
              Welcome back. I restored your unfinished draft.
            </p>
          )}
          {cur === CARDS[0].id && (
            <>
              <AiBubble
                text="Let's set up your new project. I've prepared a draft from your objective."
                at={startedAt}
                now={now}
              />
              <UserBubble
                text={
                  d.prompt +
                  (d.files.length ? `\n📎 ${d.files.join(", ")}` : "")
                }
                at={startedAt}
                now={now}
              />
            </>
          )}

          {card ? (
            <AiCard
              key={card.id}
              card={card}
              ctx={ctx}
              error={error}
              onConfirm={confirm}
              onToggleEdit={() => setEditing((e) => !e)}
            />
          ) : (
            <ReviewCard d={d} onJump={go} onCreate={create} />
          )}

          {msgs.map((m, i) =>
            m.from === "user" ? (
              <UserBubble key={i} text={m.text} at={m.at} now={now} />
            ) : (
              <AiBubble key={i} text={m.text} at={m.at} now={now} />
            ),
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={send}
          className="sticky bottom-0 z-10 rounded-b-[20px] border-t border-[#EDEDF0] bg-white p-3 shadow-[0_-14px_30px_0_rgba(40,92,224,0.06)] sm:p-5"
        >
          <label className="flex min-h-[70px] items-center gap-2.5 rounded-2xl border border-[#EDEDF0] bg-[#FAFAFA] py-3 pr-4 pl-4 focus-within:border-blue">
            <Icon
              icon={huge(Add01Icon)}
              size={18}
              className="shrink-0 text-body"
            />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe a question, research objective or decision to make.."
              className="w-full min-w-0 bg-transparent text-base leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
            />
            <button
              type="button"
              aria-label="Voice input"
              title="Voice input"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#EDEDF0] bg-white text-body hover:text-[#101D37]"
            >
              <Icon icon={huge(Mic01Icon)} size={18} />
            </button>
            <button
              type="submit"
              aria-label="Send"
              disabled={!message.trim()}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue text-white disabled:opacity-60"
            >
              <Icon icon={untitled(Send03)} size={18} />
            </button>
          </label>
        </form>
      </section>
    </div>
  );
}
