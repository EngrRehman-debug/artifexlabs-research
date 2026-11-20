import { NextResponse } from "next/server";
import { AiError, complete, parseJson, readLinks } from "@/lib/ai/server";
import {
  COMPLETE_SYSTEM,
  DETAILS_SYSTEM,
  detailGaps,
  mergeDetails,
  FIELD_GUIDE,
  INTAKE_SYSTEM,
  LABELS,
  draftSummary,
  emptyAskable,
  sanitize,
} from "@/lib/ai/intake";
import type { IntakeRequest, IntakeResponse, Question } from "@/lib/ai/types";
import { PEOPLE, suggestName, type Draft } from "@/lib/newProject";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Questions are asked once (one form); after the answers the assistant drafts the rest. */
const MAX_ROUNDS = 2;

const clip = (v: unknown, n: number) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
function cleanQuestions(raw: unknown): Question[] {
  return (
    (Array.isArray(raw) ? raw : [])
      .filter((q): q is Record<string, unknown> => !!q && typeof q === "object")
      .map((q) => ({
        header: clip(q.header, 14) || "Question",
        question: clip(q.question, 220),
        multiSelect: q.multiSelect === true,
        options: (Array.isArray(q.options) ? q.options : [])
          .map((o) =>
            typeof o === "string"
              ? { label: clip(o, 60) }
              : o && typeof o === "object"
                ? {
                    label: clip((o as Record<string, unknown>).label, 60),
                    description:
                      clip((o as Record<string, unknown>).description, 100) ||
                      undefined,
                  }
                : { label: "" },
          )
          .filter((o) => o.label && !/^other\b/i.test(o.label))
          .slice(0, 4),
      }))
      .filter((q) => q.question && q.options.length >= 2)
      /* name, type, governance and priority are set without asking */
      .filter(
        (q) =>
          !/(name|call it|type|governance|priority)/i.test(
            `${q.header} ${q.question}`,
          ),
      )
      .slice(0, 4)
  );
}

const today = () => new Date().toISOString().slice(0, 10);
const changed = (patch: Partial<Draft>) => [
  ...new Set(
    Object.keys(patch)
      .map((k) => LABELS[k])
      .filter(Boolean),
  ),
];

export async function POST(req: Request) {
  let body: IntakeRequest;
  try {
    body = (await req.json()) as IntakeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const text = String(body.text ?? "").slice(0, 8000);
  const draft = (body.draft ?? {}) as Partial<Draft>;
  const sources = (Array.isArray(body.sources) ? body.sources : [])
    .slice(0, 20)
    .map(String);
  const round = Number(body.round) || 0;
  const history = (Array.isArray(body.history) ? body.history : [])
    .slice(-10)
    .map(
      (t) =>
        `${t.from === "ai" ? "Assistant" : "User"}: ${String(t.text).slice(0, 1500)}`,
    )
    .join("\n");

  try {
    let patch: Partial<Draft> = {};
    let reply = "";
    let questions: Question[] = [];
    let model = "";
    let links: string[] = [];

    if (body.mode !== "finish") {
      const pages = await readLinks(text);
      links = pages.map((p) => p.url);
      const empty = emptyAskable(draft);
      const prompt = [
        `Today: ${today()}`,
        `People in this workspace: ${PEOPLE.map((p) => p.name).join(", ")}`,
        sources.length
          ? `Knowledge Library sources selected for this project (context only): ${sources.join(", ")}`
          : "",
        `Fields:\n${FIELD_GUIDE}`,
        `Current project fields (JSON): ${draftSummary(draft)}`,
        `Fields still empty: ${empty.map((e) => `${e.key} (${e.label})`).join(", ") || "none"}`,
        history ? `Conversation so far:\n${history}` : "",
        body.mode === "answer" && body.asked?.length
          ? `You asked:\n- ${body.asked.join("\n- ")}\nThe user's answers below follow the same order.`
          : "",
        body.mode === "start"
          ? `The user's project description:\n"""${text}"""`
          : body.mode === "edit"
            ? `The user is reviewing the set-up and asks for this change (apply it, reply briefly, no questions):\n"""${text}"""`
            : `The user's answer:\n"""${text}"""`,
        ...pages.map(
          (p) =>
            `Web page the user linked (${p.url}), read for context:\n"""${p.content}"""`,
        ),
        `Return JSON: {"fields": {only fields you can fill or update from the user's text, using the keys above; arrays must be complete lists}, "reply": "...", "questions": [{"header": "...", "question": "...", "multiSelect": false, "options": [{"label": "...", "description": "..."}]}]}`,
        round + 1 >= MAX_ROUNDS || body.mode === "edit"
          ? "Return an empty questions array."
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const r = await complete({
        panel: body.panel,
        reasoning: body.reasoning,
        system: INTAKE_SYSTEM,
        prompt,
      });
      model = r.model;
      const out = parseJson<{
        fields?: unknown;
        reply?: unknown;
        questions?: unknown;
      }>(r.text);
      patch = sanitize(out.fields, draft);
      /* keep only what actually changes */
      for (const k of Object.keys(patch) as (keyof Draft)[])
        if (JSON.stringify(patch[k]) === JSON.stringify(draft[k]))
          delete patch[k];
      /* the name always comes from the user's own words when the model leaves it out */
      if (body.mode === "start" && !draft.name && !patch.name) {
        const name = suggestName(text);
        if (name) patch.name = name;
      }
      reply =
        typeof out.reply === "string" ? out.reply.trim().slice(0, 600) : "";
      questions = cleanQuestions(out.questions);
    }

    const merged = { ...draft, ...patch };
    const stillEmpty = emptyAskable(merged);
    const done =
      body.mode === "finish" ||
      !questions.length ||
      !stillEmpty.length ||
      round + 1 >= MAX_ROUNDS;
    if (done) questions = [];

    /* finished asking: draft whatever is still empty so the user can review it */
    const drafted: Partial<Draft> = {};
    if (done && stillEmpty.length && body.mode !== "edit") {
      const prompt = [
        `Today: ${today()}`,
        `People in this workspace: ${PEOPLE.map((p) => p.name).join(", ")}`,
        `Fields:\n${FIELD_GUIDE}`,
        `Current project fields (JSON): ${draftSummary(merged)}`,
        history ? `Conversation:\n${history}` : "",
        text && body.mode !== "start"
          ? `Latest message from the user: """${text}"""`
          : "",
        `Fill these empty fields: ${stillEmpty.map((e) => e.key).join(", ")}`,
        `Return JSON: {"fields": {...}}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      try {
        const r = await complete({
          panel: body.panel,
          reasoning: body.reasoning,
          system: COMPLETE_SYSTEM,
          prompt,
        });
        model ||= r.model;
        const out = parseJson<{ fields?: unknown }>(r.text);
        const proposed = sanitize(out.fields, merged);
        /* only fill what is still empty */
        for (const [k, v] of Object.entries(proposed)) {
          const key = k as keyof Draft;
          const cur = merged[key];
          const isEmpty = Array.isArray(cur) ? cur.length === 0 : !cur;
          if (isEmpty) (drafted as Record<string, unknown>)[key] = v;
        }
        /* new workstreams bring their departments (and teams) with them */
        if (drafted.workstreams && proposed.departments) {
          drafted.departments = proposed.departments;
          drafted.teams = proposed.teams;
        }
      } catch (e) {
        console.error(
          "[ai] drafting remaining fields failed:",
          (e as Error).message,
        );
      }
    }

    /* workstreams, gates and risks get all their details (output, owners, dates, criteria…) */
    const after = { ...merged, ...drafted };
    const gaps = detailGaps(after);
    if (gaps.length) {
      const prompt = [
        `Today: ${today()}`,
        `People in this workspace: ${PEOPLE.map((p) => p.name).join(", ")}`,
        `Fields:\n${FIELD_GUIDE}`,
        `Project (JSON): ${draftSummary(after)}`,
        `Missing details: ${gaps.join(", ")}`,
        `Return JSON: {"fields": {"workstreams": [...], "gates": [...], "risks": [...]}} with the complete arrays.`,
      ].join("\n\n");
      try {
        const r = await complete({
          panel: body.panel,
          reasoning: body.reasoning,
          system: DETAILS_SYSTEM,
          prompt,
        });
        model ||= r.model;
        const out = parseJson<{ fields?: unknown }>(r.text);
        Object.assign(
          drafted,
          mergeDetails(after, sanitize(out.fields, after)),
        );
      } catch (e) {
        console.error("[ai] completing details failed:", (e as Error).message);
      }
    }

    const filled = changed(patch);
    const proposedLabels = changed(drafted).filter((l) => !filled.includes(l));
    if (!reply)
      reply = filled.length
        ? `Thanks. I filled in ${filled.slice(0, 6).join(", ")}.`
        : body.mode === "finish"
          ? "No problem."
          : "Thanks, noted.";
    if (done && body.mode !== "edit")
      reply +=
        proposedLabels.length > 0
          ? ` I've drafted the rest (${proposedLabels.slice(0, 5).join(", ")}${proposedLabels.length > 5 ? "…" : ""}) for you to review step by step.`
          : " Everything is in place; review each step below.";

    const res: IntakeResponse = {
      patch: { ...patch, ...drafted },
      filled: [...filled, ...proposedLabels],
      reply,
      questions,
      done,
      model,
      links,
    };
    return NextResponse.json(res);
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError(String(e));
    console.error("[ai] intake failed:", err.message);
    return NextResponse.json(
      { error: err.message },
      { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
    );
  }
}
