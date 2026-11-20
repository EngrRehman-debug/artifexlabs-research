import { NextResponse } from "next/server";
import { AiError, complete, parseJson } from "@/lib/ai/server";
import {
  INSIGHTS_SHAPE,
  INSIGHTS_SYSTEM,
  cleanInsights,
  draftSummary,
} from "@/lib/ai/intake";
import type { InsightsRequest } from "@/lib/ai/types";
import { PEOPLE, type Draft } from "@/lib/newProject";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** First AI assessment of a new project: summary, stats, risk analysis, questions, next steps. */
export async function POST(req: Request) {
  let body: InsightsRequest;
  try {
    body = (await req.json()) as InsightsRequest;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const draft = (body.draft ?? {}) as Partial<Draft>;
  const sources = (Array.isArray(body.sources) ? body.sources : [])
    .slice(0, 20)
    .map(String);
  const prompt = [
    `Today: ${new Date().toISOString().slice(0, 10)}`,
    `People: ${PEOPLE.map((p) => p.name).join(", ")}`,
    sources.length
      ? `Knowledge Library sources selected (context only): ${sources.join(", ")}`
      : "",
    `Project (JSON): ${draftSummary(draft)}`,
    draft.prompt
      ? `Original description: """${String(draft.prompt).slice(0, 4000)}"""`
      : "",
    `Return JSON exactly in this shape:\n${INSIGHTS_SHAPE}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  try {
    const r = await complete({
      panel: body.panel,
      reasoning: body.reasoning,
      system: INSIGHTS_SYSTEM,
      prompt,
    });
    return NextResponse.json(cleanInsights(parseJson(r.text), r.model));
  } catch (e) {
    const err = e instanceof AiError ? e : new AiError(String(e));
    console.error("[ai] insights failed:", err.message);
    return NextResponse.json({ error: err.message }, { status: 503 });
  }
}
