"use client";

import { useState } from "react";
import { AiMagicIcon, RefreshIcon } from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";
import { StageBar } from "@/components/dashboard/ProjectUi";
import { aiInsights, useResearchContext } from "@/lib/ai/client";
import type { RiskLevel } from "@/lib/ai/types";
import { setInsights, type CreatedProject } from "@/lib/createdProjects";

const LEVEL: Record<RiskLevel, string> = {
  High: "bg-[#FF2020]/10 text-[#FF2020]",
  Medium: "bg-[#FDEEEB] text-[#FF6720]",
  Low: "bg-[#2BCB23]/10 text-[#2BCB23]",
};
const SCORE: Record<RiskLevel, number> = { Low: 1, Medium: 2, High: 3 };

function Pill({ level, prefix }: { level: RiskLevel; prefix: string }) {
  return (
    <span
      className={`inline-flex h-6 items-center rounded-md px-1.5 text-xs font-medium whitespace-nowrap ${LEVEL[level]}`}
    >
      {prefix} {level}
    </span>
  );
}

const CARD =
  "flex flex-col gap-3 rounded-[20px] border border-[#EDEDF0] bg-white p-5";
const H2 =
  "text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]";

/** AI assessment of a project created in the chat: summary, risk analysis, questions, next steps. */
export default function ProjectInsights({ p }: { p: CreatedProject }) {
  const rc = useResearchContext();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ins = p.insights;

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      setInsights(
        p.id,
        await aiInsights({
          draft: p,
          sources: rc.sources,
          panel: rc.panel,
          reasoning: rc.reasoning,
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const button = (
    <button
      type="button"
      onClick={generate}
      disabled={busy}
      className="flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-xs font-semibold text-[#101D37] hover:border-blue/40 hover:text-blue disabled:opacity-60"
    >
      {busy ? (
        <span
          aria-hidden
          className="size-3.5 animate-spin rounded-full border-2 border-blue/30 border-t-blue"
        />
      ) : (
        <Icon
          icon={huge(ins ? RefreshIcon : AiMagicIcon)}
          size={14}
          stroke={1.6}
        />
      )}
      {busy ? "Analysing…" : ins ? "Regenerate" : "Generate AI assessment"}
    </button>
  );

  if (!ins)
    return (
      <section
        className={`${CARD} items-start sm:flex-row sm:items-center sm:justify-between`}
      >
        <div>
          <h2 className="text-base font-semibold text-[#101D37]">
            AI assessment
          </h2>
          <p className="text-sm text-body">
            Summary, risk analysis and next steps written from this
            project&apos;s set-up.
          </p>
          {error && <p className="mt-1 text-sm text-[#B42318]">{error}</p>}
        </div>
        {button}
      </section>
    );

  const risks = [...ins.risks].sort(
    (a, b) =>
      SCORE[b.likelihood] * SCORE[b.impact] -
      SCORE[a.likelihood] * SCORE[a.impact],
  );
  return (
    <>
      <section className={CARD}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={H2}>AI Summary</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-body">
              Feasibility
              <StageBar value={ins.feasibility} />
            </span>
            {button}
          </div>
        </div>
        <p className="text-base leading-[1.6] tracking-[-0.02em] text-[#344054]">
          {ins.summary}
        </p>
        {ins.recommendation && (
          <p className="rounded-[14px] border-l-4 border-blue bg-[#EEF2FD] px-4 py-3 text-sm leading-[1.6] text-[#101D37]">
            <b>Recommendation:</b> {ins.recommendation}
          </p>
        )}
        {error && <p className="text-sm text-[#B42318]">{error}</p>}
        <p className="text-xs text-body">
          Written by {ins.model} ·{" "}
          {new Date(ins.generatedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}{" "}
          · AI draft, check before relying on it
        </p>
      </section>

      {risks.length > 0 && (
        <section className={CARD}>
          <h2 className={H2}>Risk Analysis</h2>
          <ul className="flex flex-col gap-1.5">
            {risks.map((r) => (
              <li
                key={r.risk}
                className="flex flex-col gap-2 rounded-2xl border border-[#EDEDF0] px-4 py-3 md:flex-row md:items-center md:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                    {r.risk}
                  </p>
                  <p className="text-xs leading-[1.5] text-body">
                    {r.mitigation}
                    {r.owner && ` · Owner: ${r.owner}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Pill prefix="Likelihood" level={r.likelihood} />
                  <Pill prefix="Impact" level={r.impact} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(ins.questions.length > 0 || ins.nextSteps.length > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { title: "Open Research Questions", items: ins.questions },
            { title: "Next Steps", items: ins.nextSteps },
          ]
            .filter((b) => b.items.length)
            .map((b) => (
              <section key={b.title} className={CARD}>
                <h2 className="text-base font-semibold text-[#101D37]">
                  {b.title}
                </h2>
                <ol className="flex flex-col gap-2">
                  {b.items.map((t, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-sm leading-[1.5] text-[#344054]"
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue/10 text-[11px] font-semibold text-blue">
                        {i + 1}
                      </span>
                      {t}
                    </li>
                  ))}
                </ol>
              </section>
            ))}
        </div>
      )}
    </>
  );
}
