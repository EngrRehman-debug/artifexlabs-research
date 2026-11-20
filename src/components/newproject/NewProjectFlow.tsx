"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send03 } from "@untitledui/icons";
import {
  Add01Icon,
  CheckmarkCircle02Icon,
  Image02Icon,
  Pdf02Icon,
  RefreshIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import ResearchPickers from "@/components/knowledge/ResearchPickers";
import {
  MicButton,
  RecordingBar,
  VoiceChip,
  VoiceError,
  useVoiceRecorder,
  type VoiceNote,
} from "@/components/voice/Voice";
import { EMPTY_DRAFT, type Draft } from "@/lib/newProject";
import { addCreated, slugFor } from "@/lib/createdProjects";
import {
  aiInsights,
  aiIntake,
  aiTranscribe,
  useResearchContext,
} from "@/lib/ai/client";
import type { IntakeRequest, ProjectInsights, Question } from "@/lib/ai/types";
import QuestionForm from "./QuestionForm";
import {
  AiAvatar,
  ReviewStep,
  SECTIONS,
  STEPS,
  type Ctx,
  type StepCtx,
} from "./cards";

const STORE = "newProject:draft:v3";
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
type Phase = "prompt" | "chat" | "done";
type Msg = {
  from: "ai" | "user";
  text: string;
  at: number;
  voices?: VoiceNote[];
  /** what the voice notes said (Groq Whisper) */
  transcript?: string;
  /** assistant: follow-up questions, fields it filled, model that answered */
  /** older drafts stored plain strings */
  questions?: (Question | string)[];
  filled?: string[];
  model?: string;
  error?: boolean;
};
/* the set-up conversation before the step cards: description → AI → questions → answers */
const INTRO = "__intro";
type Interview = {
  status: "thinking" | "asking" | "done" | "error";
  round: number;
  asked: string[];
  error?: string;
};
const IV_DONE: Interview = { status: "done", round: 0, asked: [] };
type Saved = {
  phase: Phase;
  d: Draft;
  cur: string;
  startedAt: number;
  touched: string[];
  thread: Record<string, Msg[]>;
  maxIdx: number;
  iv: Interview;
  /** fields the AI actually filled (only these show "AI Suggested") */
  aiKeys: string[];
};

const STEP_IDS = STEPS.map((c) => c.id);
const indexOf = (id: string) =>
  id === "review" ? STEPS.length : STEP_IDS.indexOf(id);

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
      typeof s.cur === "string" && indexOf(s.cur) >= 0 ? s.cur : STEPS[0].id;
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
      /* a reply that was in flight when the page closed can be retried */
      iv:
        s.iv && typeof s.iv === "object" && Array.isArray(s.iv.asked)
          ? s.iv.status === "thinking"
            ? {
                ...s.iv,
                status: "error",
                error: "The page was closed before the assistant answered.",
              }
            : s.iv
          : IV_DONE,
      aiKeys: Array.isArray(s.aiKeys) ? s.aiKeys : [],
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
              {i + 1}
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
  m,
  now,
  children,
  form,
}: {
  m: Pick<Msg, "text" | "at" | "questions" | "filled" | "model" | "error">;
  now: number;
  children?: React.ReactNode;
  /** the questions are shown as an interactive form (children) instead of a list */
  form?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <AiAvatar />
      <div className="flex min-w-0 flex-col gap-2">
        <div
          className={`flex w-fit max-w-full flex-col gap-3 rounded-[20px] border px-5 py-5 text-base leading-6 tracking-[-0.02em] text-[#101D37] ${
            m.error
              ? "border-[#F04438]/25 bg-[#FEF3F2]"
              : "border-[#EDEDF0] bg-white"
          }`}
        >
          <p className="whitespace-pre-line">{m.text}</p>
          {!!m.filled?.length && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-body">Filled:</span>
              {m.filled.map((f) => (
                <span
                  key={f}
                  className="rounded-md bg-blue/[0.07] px-1.5 py-0.5 text-xs font-medium text-blue"
                >
                  {f}
                </span>
              ))}
            </div>
          )}
          {!form && !!m.questions?.length && (
            <ol className="flex flex-col gap-2 rounded-[14px] bg-[#FAFAFA] p-4">
              {m.questions.map((q, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue text-xs font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="pt-px">
                    {typeof q === "string" ? q : q.question}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {children}
        </div>
        <span className="text-xs leading-[1.5] text-body">
          {ago(m.at, now)}
          {m.model && ` · ${m.model}`}
        </span>
      </div>
    </div>
  );
}

/** "Thinking…" bubble while the model answers. */
function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-2.5" role="status" aria-live="polite">
      <AiAvatar />
      <div className="flex items-center gap-3 rounded-[20px] border border-[#EDEDF0] bg-white px-5 py-4">
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 150, 300].map((d) => (
            <span
              key={d}
              className="size-2 animate-bounce rounded-full bg-blue/70"
              style={{ animationDelay: `${d}ms` }}
            />
          ))}
        </span>
        <span className="text-sm text-body">{label}</span>
      </div>
    </div>
  );
}

function UserBubble({
  text,
  at,
  now,
  voices,
  transcript,
}: {
  text: string;
  at: number;
  now: number;
  voices?: VoiceNote[];
  transcript?: string;
}) {
  return (
    <div className="flex items-start justify-end gap-2.5">
      <div className="flex min-w-0 flex-col items-end gap-2">
        <div className="flex w-fit max-w-full flex-col gap-2.5 rounded-[20px] bg-[#E8EEFC] px-5 py-5">
          {voices?.map((v) => (
            <VoiceChip key={v.id} note={v} />
          ))}
          {transcript && (
            <p className="text-sm leading-[1.5] text-body italic">
              “{transcript}”
            </p>
          )}
          {text && (
            <p className="text-base leading-6 tracking-[-0.02em] break-words whitespace-pre-line text-[#101D37]">
              {text}
            </p>
          )}
        </div>
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

/* ---------------- main flow ---------------- */

export default function NewProjectFlow({
  onPhase,
}: {
  onPhase?: (p: Phase) => void;
}) {
  const [phase, setPhase] = useState<Phase>("prompt");
  const [d, setD] = useState<Draft>(EMPTY_DRAFT);
  const [cur, setCur] = useState<string>(STEPS[0].id);
  const [startedAt, setStartedAt] = useState(0);
  const [touched, setTouched] = useState<string[]>([]);
  const [thread, setThread] = useState<Record<string, Msg[]>>({});
  const [maxIdx, setMaxIdx] = useState(0);
  const [iv, setIv] = useState<Interview>(IV_DONE);
  const [aiKeys, setAiKeys] = useState<string[]>([]);
  /** apply what the AI returned and remember which fields it filled */
  const applyAi = (patch: Partial<Draft>) => {
    setD((p) => ({ ...p, ...patch }));
    const keys = Object.keys(patch);
    setAiKeys((k) => [...new Set([...k, ...keys])]);
    /* a field the AI just changed counts as its suggestion again */
    setTouched((t) => t.filter((x) => !keys.includes(x)));
  };
  /** the assistant is answering a message sent from a step card */
  const [stepBusy, setStepBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [insights, setInsightsState] = useState<ProjectInsights | null>(null);
  const [insightsError, setInsightsError] = useState(false);
  const rc = useResearchContext();
  /** last request to the assistant, for "Try again" */
  const lastAsk = useRef<{
    mode: IntakeRequest["mode"];
    text: string;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  const [now, setNow] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [promptNotes, setPromptNotes] = useState<VoiceNote[]>([]);
  const [message, setMessage] = useState("");
  const [chatNotes, setChatNotes] = useState<VoiceNote[]>([]);
  const promptRec = useVoiceRecorder({
    onDone: (n) => setPromptNotes((l) => [...l, n]),
  });
  const chatRec = useVoiceRecorder({
    onDone: (n) => setChatNotes((l) => [...l, n]),
  });
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
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
      setIv(s.iv);
      setAiKeys(s.aiKeys);
      setPhase("chat");
      setResumed(true);
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current && phase === "chat")
      write({
        phase,
        d,
        cur,
        startedAt,
        touched,
        thread,
        maxIdx,
        iv,
        aiKeys,
      });
  }, [phase, d, cur, startedAt, touched, thread, maxIdx, iv, aiKeys]);

  useEffect(() => onPhase?.(phase), [phase, onPhase]);

  /* relative times ("2 mins ago") are computed on the client and refreshed */
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  /* new step: bring its card up under the pinned stepper; earlier steps stay above it */
  useEffect(() => {
    if (phase !== "chat") return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [cur, phase]);

  const step = STEPS.find((c) => c.id === cur) ?? null; // null => review
  const idx = indexOf(cur);
  const si = step ? SECTIONS.indexOf(step.section) : SECTIONS.length - 1;
  const partial =
    !!step && STEPS.findIndex((c) => c.section === step.section) < idx;

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
      editing: editing || !!step?.alwaysEdit,
      ai: (k) =>
        aiKeys.includes(k as string) &&
        !touched.includes(k as string) &&
        hasValue(d[k]),
    }),
    [d, set, editing, touched, step, aiKeys],
  );

  const go = (id: string) => {
    setCur(id);
    setEditing(false);
    setError(null);
    setMaxIdx((m) => Math.max(m, indexOf(id)));
  };

  const confirm = () => {
    if (!step) return;
    const msg = step.validate?.(d);
    if (msg) {
      setError(msg);
      setEditing(true);
      /* bring the first missing field into view and put the cursor in it */
      setTimeout(() => {
        const el = activeRef.current?.querySelector<HTMLElement>(
          "[data-invalid], [data-invalid-group]",
        );
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.querySelector<HTMLElement>("input, textarea, button")?.focus({
          preventScroll: true,
        });
      }, 60);
      return;
    }
    go(STEPS[idx + 1]?.id ?? "review");
  };
  const back = idx > 0 ? () => go(STEPS[idx - 1].id) : undefined;

  const openSection = (i: number) => {
    const first =
      SECTIONS[i] === "Review"
        ? "review"
        : STEPS.find((c) => c.section === SECTIONS[i])!.id;
    if (indexOf(first) <= maxIdx) go(first);
  };

  const scrollEnd = () =>
    setTimeout(
      () =>
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
      40,
    );

  const push = (key: string, m: Msg) =>
    setThread((t) => ({ ...t, [key]: [...(t[key] ?? []), m] }));

  /** voice notes → text (Groq Whisper); a failed note just gives no text */
  const transcribeAll = async (notes: VoiceNote[]) =>
    (await Promise.all(notes.map((n) => aiTranscribe(n.src).catch(() => ""))))
      .filter(Boolean)
      .join(" ");

  /* One turn of the set-up conversation: the model fills fields from the text and asks
   * up to 3 questions for what is missing; when it stops asking it drafts the rest. */
  const ask = async (
    mode: IntakeRequest["mode"],
    text: string,
    base: Draft,
    history: Msg[],
    state: Interview,
  ) => {
    lastAsk.current = { mode, text };
    setIv({ ...state, status: "thinking", error: undefined });
    scrollEnd();
    try {
      const r = await aiIntake({
        mode,
        text,
        draft: base,
        asked: state.asked,
        history: history.map((m) => ({
          from: m.from,
          text: [m.text, m.transcript].filter(Boolean).join(" "),
        })),
        sources: rc.sources,
        round: state.round,
        panel: rc.panel,
        reasoning: rc.reasoning,
      });
      applyAi(r.patch);
      const at = Date.now();
      setNow(at);
      push(INTRO, {
        from: "ai",
        text: r.reply,
        at,
        questions: r.questions.length ? r.questions : undefined,
        filled: r.filled.length ? r.filled : undefined,
        model: r.model || undefined,
      });
      setIv({
        status: r.done ? "done" : "asking",
        round: state.round + 1,
        asked: r.questions.map((q) => q.question),
      });
      scrollEnd();
    } catch (e) {
      setIv({ ...state, status: "error", error: (e as Error).message });
    }
  };

  /* the form's answers go into the chat as the user's message */
  const answerForm = (display: string, model: string) => {
    const msg: Msg = { from: "user", text: display, at: Date.now() };
    push(INTRO, msg);
    setNow(msg.at);
    ask("answer", model, d, [...(thread[INTRO] ?? []), msg], iv);
  };

  /* "Skip": sent as the user's message, then the assistant drafts the rest */
  const skipQuestions = () => {
    const msg: Msg = {
      from: "user",
      text: "Skip the questions and draft the rest for me.",
      at: Date.now(),
    };
    push(INTRO, msg);
    setNow(msg.at);
    ask("finish", "", d, [...(thread[INTRO] ?? []), msg], iv);
  };

  const retry = () => {
    const l = lastAsk.current ?? { mode: "start" as const, text: d.prompt };
    ask(l.mode, l.text || d.prompt, d, thread[INTRO] ?? [], iv);
  };

  /* AI unavailable: the user fills the steps in themselves (nothing is suggested);
   * only their own description goes into the objective */
  const continueWithoutAi = () => {
    setD((p) => ({
      ...p,
      objective: p.objective || (p.prompt === "Voice note" ? "" : p.prompt),
    }));
    setTouched((t) => [...new Set([...t, "objective"])]);
    setIv(IV_DONE);
  };

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const typed = promptText.trim();
    const notes = promptNotes;
    if (!typed && !notes.length) return;
    const at = Date.now();
    const base: Draft = {
      ...EMPTY_DRAFT,
      prompt: typed || "Voice note",
      files: files.map((f) => f.name),
    };
    const first: Msg = {
      from: "user",
      text: typed,
      at,
      voices: notes.length ? notes : undefined,
    };
    setD(base);
    setStartedAt(at);
    setNow(at);
    setTouched([]);
    setAiKeys([]);
    setThread({ [INTRO]: [first] });
    setPromptNotes([]);
    setMaxIdx(0);
    setCur(STEPS[0].id);
    setEditing(false);
    setResumed(false);
    const fresh: Interview = { status: "thinking", round: 0, asked: [] };
    setIv(fresh);
    setPhase("chat");

    let text = typed;
    if (notes.length) {
      const transcript = await transcribeAll(notes);
      if (transcript) {
        text = [typed, transcript].filter(Boolean).join("\n\n");
        setThread({ [INTRO]: [{ ...first, transcript }] });
        base.prompt = text;
        setD((p) => ({ ...p, prompt: text }));
      }
    }
    if (!text) {
      lastAsk.current = { mode: "start", text: "" };
      setIv({
        ...fresh,
        status: "error",
        error:
          "I couldn't make out the voice note. Please type a short description of the project.",
      });
      return;
    }
    await ask("start", text, base, [], fresh);
  };

  const reset = () => {
    write(null);
    setD(EMPTY_DRAFT);
    setCur(STEPS[0].id);
    setPromptText("");
    setFiles([]);
    setPromptNotes([]);
    setChatNotes([]);
    setThread({});
    setTouched([]);
    setAiKeys([]);
    setResumed(false);
    setIv(IV_DONE);
    setInsightsState(null);
    setInsightsError(false);
    setPhase("prompt");
  };

  /* Create: the AI writes the project's first assessment (summary, stats, risk analysis) */
  const create = async () => {
    setCreating(true);
    let ins: ProjectInsights | undefined;
    try {
      ins = await aiInsights({
        draft: d,
        sources: rc.sources,
        panel: rc.panel,
        reasoning: rc.reasoning,
      });
    } catch {
      setInsightsError(true);
    }
    setInsightsState(ins ?? null);
    setCreatedSlug(slugFor(addCreated(d, ins)));
    write(null);
    setCreating(false);
    setPhase("done");
  };

  /* bottom composer: answers the set-up questions, or asks for a change while on a step */
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const typed = message.trim();
    const notes = chatNotes;
    if (!typed && !notes.length) return;
    const at = Date.now();
    const interviewing = cur === STEPS[0].id && iv.status !== "done";
    const key = interviewing ? INTRO : cur;
    const userMsg: Msg = {
      from: "user",
      text: typed,
      at,
      voices: notes.length ? notes : undefined,
    };
    push(key, userMsg);
    setNow(at);
    setMessage("");
    setChatNotes([]);
    scrollEnd();

    if (interviewing) setIv((v) => ({ ...v, status: "thinking" }));
    else setStepBusy(true);
    let text = typed;
    if (notes.length) {
      const transcript = await transcribeAll(notes);
      if (transcript) {
        text = [typed, transcript].filter(Boolean).join("\n\n");
        setThread((t) => ({
          ...t,
          [key]: (t[key] ?? []).map((m) =>
            m.at === at && m.from === "user" ? { ...m, transcript } : m,
          ),
        }));
      }
    }
    if (!text) {
      push(key, {
        from: "ai",
        text: "I couldn't make out that voice note. Could you type it instead?",
        at: Date.now(),
        error: true,
      });
      if (interviewing) setIv((v) => ({ ...v, status: "asking" }));
      else setStepBusy(false);
      return;
    }

    if (interviewing) {
      await ask("answer", text, d, [...(thread[INTRO] ?? []), userMsg], iv);
      return;
    }
    /* on a step: apply the requested change to the fields */
    try {
      const r = await aiIntake({
        mode: "edit",
        text,
        draft: d,
        asked: [],
        history: (thread[cur] ?? []).map((m) => ({
          from: m.from,
          text: m.text,
        })),
        sources: rc.sources,
        round: 99,
        panel: rc.panel,
        reasoning: rc.reasoning,
      });
      applyAi(r.patch);
      push(cur, {
        from: "ai",
        text: r.reply,
        at: Date.now(),
        filled: r.filled.length ? r.filled : undefined,
        model: r.model || undefined,
      });
    } catch (err) {
      push(cur, {
        from: "ai",
        text: `${(err as Error).message} You can also change the fields above directly.`,
        at: Date.now(),
        error: true,
      });
    } finally {
      setStepBusy(false);
      setNow(Date.now());
      scrollEnd();
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
            {promptRec.active ? (
              <div className="flex min-h-[120px] items-center">
                <RecordingBar rec={promptRec} />
              </div>
            ) : (
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
            )}
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
              {promptNotes.map((n) => (
                <VoiceChip
                  key={n.id}
                  note={n}
                  onRemove={() =>
                    setPromptNotes((l) => l.filter((x) => x.id !== n.id))
                  }
                />
              ))}
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
          <VoiceError rec={promptRec} />
          <div className="flex items-center justify-between gap-2.5">
            <ResearchPickers />
            <div className="flex items-center gap-2.5">
              <MicButton rec={promptRec} />
              <button
                type="submit"
                aria-label="Start project setup"
                disabled={
                  (!promptText.trim() && !promptNotes.length) ||
                  promptRec.active
                }
                className="flex size-9 items-center justify-center rounded-[10px] bg-blue text-white disabled:opacity-40"
              >
                <Icon icon={untitled(Send03)} size={16} />
              </button>
            </div>
          </div>
        </form>
        <p className="text-center text-xs text-body">
          I&apos;ll fill in the project from your description, ask a few
          questions for what&apos;s missing, then walk you through each step.
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
        {insights && (
          <div className="flex w-full flex-col gap-3 rounded-[16px] bg-[#FAFAFA] p-5 text-left">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-[#101D37]">
                First AI assessment
              </span>
              <span className="rounded-md bg-blue/10 px-2 py-0.5 text-xs font-semibold text-blue">
                Feasibility {insights.feasibility}%
              </span>
            </div>
            <p className="text-sm leading-[1.6] text-[#344054]">
              {insights.summary}
            </p>
            <p className="text-xs text-body">
              Stats, risk analysis and the research case slides use this
              assessment · {insights.model}
            </p>
          </div>
        )}
        {insightsError && (
          <p className="text-sm text-[#B42318]">
            The AI assessment couldn&apos;t be written right now. You can
            generate it from the project page.
          </p>
        )}
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
  const intro = thread[INTRO] ?? [];
  const interviewing = cur === STEPS[0].id && iv.status !== "done";
  const busy = iv.status === "thinking" || stepBusy;
  return (
    <div className="flex w-full min-w-0 flex-col">
      {/* title + stepper stay pinned under the top bar; the conversation scrolls below */}
      <div className="sticky top-16 z-20 -mx-4 -mt-10 bg-white px-4 pt-10 pb-6 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
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

        <div className="mt-[30px] overflow-x-auto [scrollbar-width:none] lg:-mx-[18px] [&::-webkit-scrollbar]:hidden">
          <div className="min-w-[560px]">
            <Stepper
              si={si}
              partial={partial}
              completed={(i) =>
                SECTIONS[i] !== "Review" &&
                STEPS.reduce(
                  (m, c, j) => (c.section === SECTIONS[i] ? j : m),
                  -1,
                ) < maxIdx
              }
              canOpen={(i) =>
                indexOf(
                  SECTIONS[i] === "Review"
                    ? "review"
                    : STEPS.find((c) => c.section === SECTIONS[i])!.id,
                ) <= maxIdx
              }
              onOpen={openSection}
            />
          </div>
        </div>
      </div>

      {/* conversation card: #FAFAFA, border, radius 20; composer pinned to its bottom */}
      <section className="mt-2 flex min-h-[calc(100dvh-300px)] flex-col rounded-[20px] border border-[#EDEDF0] bg-[#FAFAFA]">
        <div className="flex flex-1 flex-col gap-5 px-3 pt-[30px] pb-6 sm:px-5">
          {resumed && (
            <p className="w-fit rounded-lg bg-blue/[0.06] px-3 py-2 text-sm text-blue">
              Welcome back. I restored your unfinished draft.
            </p>
          )}
          {/* set-up conversation: the user's description first, then the assistant */}
          {(intro.length
            ? intro
            : [{ from: "user" as const, text: d.prompt, at: startedAt }]
          ).map((m, i) =>
            m.from === "user" ? (
              <UserBubble
                key={i}
                text={
                  m.text +
                  (i === 0 && d.files.length
                    ? `${m.text ? "\n" : ""}📎 ${d.files.join(", ")}`
                    : "")
                }
                at={m.at}
                now={now}
                voices={m.voices}
                transcript={m.transcript}
              />
            ) : (
              <AiBubble
                key={i}
                m={m}
                now={now}
                form={i === intro.length - 1 && iv.status === "asking"}
              >
                {i === intro.length - 1 &&
                  iv.status === "asking" &&
                  !!m.questions?.length &&
                  typeof m.questions[0] !== "string" && (
                    <QuestionForm
                      key={m.at}
                      questions={m.questions as Question[]}
                      onSubmit={({ display, model }) =>
                        answerForm(display, model)
                      }
                      onSkip={skipQuestions}
                    />
                  )}
              </AiBubble>
            ),
          )}
          {cur === STEPS[0].id && iv.status === "thinking" && (
            <TypingBubble
              label={
                iv.round === 0
                  ? "Reading your description and filling in the project…"
                  : lastAsk.current?.mode === "finish"
                    ? "Drafting the rest of the project…"
                    : "Updating the project from your answers…"
              }
            />
          )}
          {cur === STEPS[0].id && iv.status === "error" && (
            <AiBubble
              m={{
                text: iv.error ?? "Something went wrong.",
                at: now,
                error: true,
              }}
              now={now}
            >
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={retry}
                  className="h-8 rounded-[10px] bg-blue px-3 text-xs font-semibold text-white"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={continueWithoutAi}
                  className="h-8 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-xs font-semibold text-[#101D37]"
                >
                  Fill it in myself
                </button>
              </div>
            </AiBubble>
          )}

          {(() => {
            const sc: StepCtx = {
              ...ctx,
              toggleEdit: () => setEditing((e) => !e),
              back,
              confirm,
              jump: go,
              create,
              saveDraft: () => {
                write({
                  phase,
                  d,
                  cur,
                  startedAt,
                  touched,
                  thread,
                  maxIdx,
                  iv,
                  aiKeys,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              },
              saved,
              error,
              creating,
            };
            /* the step cards appear once the set-up questions are done */
            if (cur === STEPS[0].id && iv.status !== "done") return null;
            const noop = () => {};
            const past: StepCtx = {
              ...sc,
              editing: false,
              toggleEdit: noop,
              back: undefined,
              confirm: noop,
              create: noop,
              saveDraft: noop,
              saved: false,
              error: null,
              creating: false,
            };
            const View = step ? step.render : ReviewStep;
            return (
              <>
                {STEPS.slice(0, idx).map((st) => {
                  const Past = st.render;
                  return (
                    <div key={st.id} className="flex flex-col gap-5">
                      <div className="group relative">
                        {/* confirmed step: read-only, actions hidden; "Edit" goes back to it */}
                        <div inert className="[&_[data-action]]:hidden">
                          <Past {...past} />
                        </div>
                        <button
                          type="button"
                          onClick={() => go(st.id)}
                          className="absolute top-4 right-4 flex h-8 items-center gap-1.5 rounded-[10px] border border-[#EDEDF0] bg-white px-2.5 text-xs font-semibold text-[#101D37] shadow-sm hover:border-blue/40 hover:text-blue"
                        >
                          <Icon
                            icon={huge(CheckmarkCircle02Icon)}
                            size={14}
                            stroke={1.6}
                            className="text-[#2BCB23]"
                          />
                          Confirmed · Edit
                        </button>
                      </div>
                      {(thread[st.id] ?? []).map((m, i) =>
                        m.from === "user" ? (
                          <UserBubble
                            key={i}
                            text={m.text}
                            at={m.at}
                            now={now}
                            voices={m.voices}
                            transcript={m.transcript}
                          />
                        ) : (
                          <AiBubble key={i} m={m} now={now} />
                        ),
                      )}
                    </div>
                  );
                })}
                <div ref={activeRef} className="scroll-mt-[260px]">
                  <View key={cur} {...sc} />
                </div>
              </>
            );
          })()}

          {msgs.map((m, i) =>
            m.from === "user" ? (
              <UserBubble
                key={i}
                text={m.text}
                at={m.at}
                now={now}
                voices={m.voices}
                transcript={m.transcript}
              />
            ) : (
              <AiBubble key={i} m={m} now={now} />
            ),
          )}
          {stepBusy && <TypingBubble label="Updating the project…" />}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={send}
          className="sticky bottom-0 z-10 -mx-px -mb-px rounded-[20px] border border-[#EDEDF0] bg-white p-3 shadow-[0_14px_30px_0_rgba(40,92,224,0.10)] sm:p-5"
        >
          {chatNotes.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {chatNotes.map((n) => (
                <VoiceChip
                  key={n.id}
                  note={n}
                  onRemove={() =>
                    setChatNotes((l) => l.filter((x) => x.id !== n.id))
                  }
                />
              ))}
            </div>
          )}
          <VoiceError rec={chatRec} />
          <label className="flex min-h-[70px] items-center gap-2.5 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] p-4 focus-within:border-blue">
            {chatRec.active ? (
              <RecordingBar rec={chatRec} />
            ) : (
              <>
                <Icon
                  icon={huge(Add01Icon)}
                  size={18}
                  className="shrink-0 text-body"
                />
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={busy}
                  placeholder={
                    busy
                      ? "Thinking…"
                      : interviewing
                        ? "Or answer in your own words…"
                        : "Ask for a change, e.g. “move the target date to June” or “add a Finance workstream”"
                  }
                  className="w-full min-w-0 bg-transparent text-base leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
                />
                <MicButton rec={chatRec} />
              </>
            )}
            <button
              type="submit"
              aria-label="Send"
              disabled={
                (!message.trim() && !chatNotes.length) || chatRec.active || busy
              }
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
