import type { Draft } from "../newProject";

/* Request / response shapes shared by the browser and the /api/ai routes. */

export type ChatTurn = { from: "ai" | "user"; text: string };

/** A follow-up question with choices (shown as tabs with radio / checkbox options + "Other"). */
export type Question = {
  /** short tab label, e.g. "Timeline" */
  header: string;
  question: string;
  multiSelect: boolean;
  options: { label: string; description?: string }[];
};

export type IntakeRequest = {
  /** "start": first description; "answer": user answered the questions; "finish": skip the rest;
   *  "edit": a change asked for later, while reviewing the steps (no questions, nothing drafted) */
  mode: "start" | "answer" | "finish" | "edit";
  draft: Partial<Draft>;
  /** the user's text for this turn (description or answer) */
  text: string;
  /** questions the assistant asked last turn */
  asked: string[];
  history: ChatTurn[];
  /** names of the Knowledge Library sources selected (context only) */
  sources: string[];
  round: number;
  panel?: string;
  reasoning?: string;
};

export type IntakeResponse = {
  patch: Partial<Draft>;
  /** labels of the fields filled this turn */
  filled: string[];
  reply: string;
  questions: Question[];
  done: boolean;
  model: string;
  /** web pages read with Firecrawl */
  links: string[];
};

export type RiskLevel = "Low" | "Medium" | "High";

export type ProjectInsights = {
  summary: string;
  recommendation: string;
  /** 0–100: how feasible / ready the project looks from what is known */
  feasibility: number;
  stats: { label: string; value: string }[];
  risks: {
    risk: string;
    likelihood: RiskLevel;
    impact: RiskLevel;
    mitigation: string;
    owner: string;
  }[];
  questions: string[];
  nextSteps: string[];
  model: string;
  generatedAt: string;
};

export type InsightsRequest = {
  draft: Partial<Draft>;
  sources: string[];
  panel?: string;
  reasoning?: string;
};
