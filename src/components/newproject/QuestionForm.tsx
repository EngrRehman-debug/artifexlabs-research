"use client";

import { useState } from "react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";
import type { Question } from "@/lib/ai/types";

type Answer = { picked: string[]; other: string };

/** The answers as chat text: one line per question ("Timeline: Jan – Jun 2027"). */
export function answersText(qs: Question[], a: Answer[]) {
  const show = (x?: Answer) =>
    [...(x?.picked ?? []), x?.other.trim()].filter(Boolean).join(", ");
  return {
    display: qs
      .map((q, i) => (show(a[i]) ? `${q.header}: ${show(a[i])}` : ""))
      .filter(Boolean)
      .join("\n"),
    /* the model gets the full question with each answer */
    model: qs
      .map((q, i) => `Q: ${q.question}\nA: ${show(a[i]) || "(no answer)"}`)
      .join("\n\n"),
  };
}

/**
 * Follow-up questions as a short form: one tab per question, radio (one answer) or
 * checkbox (several) options written by the AI, plus "Other" for the user's own words.
 */
export default function QuestionForm({
  questions,
  disabled,
  onSubmit,
  onSkip,
}: {
  questions: Question[];
  disabled?: boolean;
  onSubmit: (text: { display: string; model: string }) => void;
  onSkip: () => void;
}) {
  const [tab, setTab] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(() =>
    questions.map(() => ({ picked: [], other: "" })),
  );
  const answered = (i: number) =>
    answers[i].picked.length > 0 || answers[i].other.trim().length > 0;
  const count = questions.filter((_, i) => answered(i)).length;
  const last = tab === questions.length - 1;
  const q = questions[tab];
  const a = answers[tab];

  const update = (i: number, fn: (x: Answer) => Answer) =>
    setAnswers((all) => all.map((x, j) => (j === i ? fn(x) : x)));

  const pick = (label: string) => {
    update(tab, (x) =>
      q.multiSelect
        ? {
            ...x,
            picked: x.picked.includes(label)
              ? x.picked.filter((p) => p !== label)
              : [...x.picked, label],
          }
        : { picked: [label], other: "" },
    );
    /* single choice: move on to the next question */
    if (!q.multiSelect && !last) setTimeout(() => setTab((t) => t + 1), 180);
  };

  return (
    <div className="flex flex-col gap-4 rounded-[16px] border border-[#EDEDF0] bg-[#FAFAFA] p-3 sm:p-4">
      {/* tabs */}
      <div
        role="tablist"
        aria-label="Questions"
        className="flex flex-wrap items-center gap-1.5"
      >
        {questions.map((x, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === tab}
            onClick={() => setTab(i)}
            className={`flex h-8 items-center gap-1.5 rounded-[10px] border px-2.5 text-xs font-semibold transition-colors ${
              i === tab
                ? "border-blue bg-blue text-white"
                : answered(i)
                  ? "border-blue/30 bg-blue/[0.06] text-blue"
                  : "border-[#EDEDF0] bg-white text-body hover:text-[#101D37]"
            }`}
          >
            {answered(i) ? (
              <Icon icon={huge(Tick02Icon)} size={13} stroke={2.2} />
            ) : (
              <span className="opacity-70">{i + 1}</span>
            )}
            {x.header}
          </button>
        ))}
        <span className="ml-auto text-xs text-body">
          {count}/{questions.length} answered
        </span>
      </div>

      {/* current question */}
      <div role="tabpanel" className="flex flex-col gap-2.5">
        <p className="text-base leading-6 font-semibold tracking-[-0.02em] text-[#101D37]">
          {q.question}
          {q.multiSelect && (
            <span className="ml-2 text-xs font-normal text-body">
              Choose all that apply
            </span>
          )}
        </p>
        <div
          role={q.multiSelect ? "group" : "radiogroup"}
          aria-label={q.question}
          className="flex flex-col gap-2"
        >
          {q.options.map((o, i) => {
            const on = a.picked.includes(o.label);
            return (
              <button
                key={o.label}
                type="button"
                role={q.multiSelect ? "checkbox" : "radio"}
                aria-checked={on}
                disabled={disabled}
                onClick={() => pick(o.label)}
                className={`flex items-start gap-3 rounded-[12px] border bg-white px-3.5 py-2.5 text-left transition-colors disabled:opacity-60 ${
                  on
                    ? "border-blue ring-2 ring-blue/15"
                    : "border-[#EDEDF0] hover:border-[#D0D5DD]"
                }`}
              >
                <span
                  aria-hidden
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors ${
                    q.multiSelect ? "rounded-[5px]" : "rounded-full"
                  } ${on ? "border-blue bg-blue text-white" : "border-[#667085] bg-white"}`}
                >
                  {on &&
                    (q.multiSelect ? (
                      <Icon icon={huge(Tick02Icon)} size={14} stroke={2.4} />
                    ) : (
                      <span className="size-2 rounded-full bg-white" />
                    ))}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-[1.5] font-medium text-[#101D37]">
                    <span className="mr-1.5 text-body">{i + 1}.</span>
                    {o.label}
                  </span>
                  {o.description && (
                    <span className="block text-xs leading-[1.5] text-body">
                      {o.description}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
          {/* the user's own answer */}
          <label
            className={`flex items-center gap-3 rounded-[12px] border bg-white px-3.5 py-2 transition-colors focus-within:border-blue ${
              a.other.trim() ? "border-blue" : "border-[#EDEDF0]"
            }`}
          >
            <span className="shrink-0 text-sm font-medium text-body">
              Other
            </span>
            <input
              value={a.other}
              disabled={disabled}
              onChange={(e) => {
                const other = e.target.value;
                update(tab, (x) => ({
                  picked: q.multiSelect || !other.trim() ? x.picked : [],
                  other,
                }));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!last) setTab((t) => t + 1);
                }
              }}
              placeholder="Type your own answer…"
              className="h-8 w-full min-w-0 bg-transparent text-sm text-[#101D37] outline-none placeholder:text-body"
            />
          </label>
        </div>
      </div>

      {/* actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="text-sm font-semibold text-body hover:text-[#101D37] disabled:opacity-60"
        >
          Skip, draft the rest for me
        </button>
        <div className="flex items-center gap-2">
          {tab > 0 && (
            <button
              type="button"
              onClick={() => setTab((t) => t - 1)}
              className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-sm font-semibold text-[#101D37]"
            >
              <Icon icon={huge(ArrowLeft01Icon)} size={16} stroke={1.8} />
              Back
            </button>
          )}
          {!last && (
            <button
              type="button"
              onClick={() => setTab((t) => t + 1)}
              className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-sm font-semibold text-[#101D37]"
            >
              Next
              <Icon icon={huge(ArrowRight01Icon)} size={16} stroke={1.8} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled || count === 0}
            onClick={() => onSubmit(answersText(questions, answers))}
            title={count === 0 ? "Answer at least one question" : undefined}
            className="flex h-9 items-center gap-1.5 rounded-[10px] bg-blue px-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            Submit answers
          </button>
        </div>
      </div>
    </div>
  );
}
