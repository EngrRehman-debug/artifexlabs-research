import "server-only";
import { MODELS, panelFor, type ModelInfo } from "./models";

/*
 * Server-side model calls. API keys come from .env.local and never reach the browser.
 * A panel's first model answers; if it is busy, slow or fails, the second one takes over.
 */

export type Reasoning = "fast" | "balanced" | "deep";

export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

const TIMEOUT_MS = 30_000;

async function post(
  url: string,
  headers: Record<string, string>,
  body: unknown,
) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = text.slice(0, 300);
      try {
        const j = JSON.parse(text);
        msg = j?.error?.message ?? msg;
      } catch {
        /* not JSON */
      }
      throw new AiError(`${res.status}: ${msg}`, res.status);
    }
    return JSON.parse(text);
  } catch (e) {
    if (e instanceof AiError) throw e;
    throw new AiError(
      ctrl.signal.aborted ? "The model took too long to answer" : String(e),
    );
  } finally {
    clearTimeout(t);
  }
}

type Call = {
  system: string;
  prompt: string;
  json: boolean;
  reasoning: Reasoning;
  maxTokens: number;
};

async function groq(m: ModelInfo, c: Call): Promise<string> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new AiError("GROQ_API_KEY is not set");
  const r = await post(
    "https://api.groq.com/openai/v1/chat/completions",
    { Authorization: `Bearer ${key}` },
    {
      model: m.api,
      messages: [
        { role: "system", content: c.system },
        { role: "user", content: c.prompt },
      ],
      temperature: 0.3,
      max_completion_tokens: c.maxTokens,
      ...(c.json ? { response_format: { type: "json_object" } } : {}),
      ...(m.api.startsWith("openai/gpt-oss")
        ? {
            reasoning_effort:
              c.reasoning === "deep"
                ? "high"
                : c.reasoning === "fast"
                  ? "low"
                  : "medium",
          }
        : {}),
    },
  );
  return r?.choices?.[0]?.message?.content ?? "";
}

async function gemini(m: ModelInfo, c: Call): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError("GEMINI_API_KEY is not set");
  const r = await post(
    `https://generativelanguage.googleapis.com/v1beta/models/${m.api}:generateContent`,
    { "x-goog-api-key": key },
    {
      systemInstruction: { parts: [{ text: c.system }] },
      contents: [{ role: "user", parts: [{ text: c.prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: c.maxTokens,
        ...(c.json ? { responseMimeType: "application/json" } : {}),
      },
    },
  );
  return (r?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
}

/** Run a prompt on the chosen panel, falling back to its second model. */
export async function complete(opts: {
  panel?: string;
  reasoning?: string;
  system: string;
  prompt: string;
  json?: boolean;
  maxTokens?: number;
}): Promise<{ text: string; model: string }> {
  const panel = panelFor(opts.panel);
  const reasoning: Reasoning =
    opts.reasoning === "fast" || opts.reasoning === "deep"
      ? opts.reasoning
      : "balanced";
  const call: Call = {
    system: opts.system,
    prompt: opts.prompt,
    json: opts.json ?? true,
    reasoning,
    maxTokens: opts.maxTokens ?? 4096,
  };
  const errors: string[] = [];
  for (const name of panel.models) {
    const m = MODELS[name];
    if (!m?.available) continue;
    try {
      const text =
        m.provider === "groq" ? await groq(m, call) : await gemini(m, call);
      if (text.trim()) return { text, model: m.label };
      errors.push(`${m.label}: empty answer`);
    } catch (e) {
      errors.push(`${m.label}: ${(e as Error).message}`);
    }
  }
  console.error("[ai] all models failed:", errors.join(" | "));
  throw new AiError(
    "The AI models are busy right now. Please try again in a moment.",
    503,
  );
}

/** Parse a JSON answer, tolerating code fences or text around the object. */
export function parseJson<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const a = cleaned.indexOf("{");
    const b = cleaned.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(cleaned.slice(a, b + 1)) as T;
    throw new AiError(
      "The model returned an unreadable answer. Please try again.",
    );
  }
}

/* ---------------- Firecrawl: read web pages the user linked ---------------- */

export async function readLinks(
  text: string,
  max = 2,
): Promise<{ url: string; content: string }[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];
  const urls = [
    ...new Set(text.match(/https?:\/\/[^\s<>"')\]]+/g) ?? []),
  ].slice(0, max);
  const out = await Promise.all(
    urls.map(async (url) => {
      try {
        const r = await post(
          "https://api.firecrawl.dev/v2/scrape",
          { Authorization: `Bearer ${key}` },
          { url, formats: ["markdown"], onlyMainContent: true },
        );
        const md: string = r?.data?.markdown ?? "";
        return md ? { url, content: md.slice(0, 6000) } : null;
      } catch (e) {
        console.error(
          "[ai] firecrawl failed for a link:",
          (e as Error).message,
        );
        return null;
      }
    }),
  );
  return out.filter((x): x is { url: string; content: string } => !!x);
}
