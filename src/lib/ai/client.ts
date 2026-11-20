"use client";

import { useKnowledge } from "../knowledge";
import type {
  InsightsRequest,
  IntakeRequest,
  IntakeResponse,
  ProjectInsights,
} from "./types";

/* Browser side of the AI routes. Keys stay on the server; this only calls /api/ai/*. */

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No connection. Check your internet and try again.");
  }
  const j = await res.json().catch(() => null);
  if (!res.ok) throw new Error(j?.error ?? `Request failed (${res.status})`);
  return j as T;
}

export const aiIntake = (req: IntakeRequest) =>
  postJson<IntakeResponse>("/api/ai/intake", req);

export const aiInsights = (req: InsightsRequest) =>
  postJson<ProjectInsights>("/api/ai/insights", req);

export const aiTranscribe = (audio: string) =>
  postJson<{ text: string }>("/api/ai/transcribe", { audio }).then(
    (r) => r.text,
  );

/** Model panel, reasoning and selected Knowledge Library sources, as the AI routes expect them. */
export function useResearchContext() {
  const k = useKnowledge();
  const sources = [
    ...(k.useUploads ? ["Uploaded files"] : []),
    ...(k.useOnline ? ["Online search"] : []),
    ...k.repos.filter((r) => r.active).map((r) => r.name),
  ];
  return { panel: k.panel, reasoning: k.reasoning, sources };
}
