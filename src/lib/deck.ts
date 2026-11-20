/*
 * "Final Research Case" deck: slides generated from a project's details, then edited
 * in the slide editor and saved as PDF. Text fields hold simple HTML (b / i / u / lists).
 */
import type { CreatedProject, OverviewData } from "./createdProjects";
import { EVIDENCE_BARS, EVIDENCE_TABLE, LINEAGE } from "./evidence";

export type Block =
  | { id: string; type: "text"; html: string }
  | { id: string; type: "bullets"; items: string[] }
  | { id: string; type: "table"; rows: string[][] }
  | {
      id: string;
      type: "chart";
      title: string;
      bars: { label: string; value: number }[];
    }
  | { id: string; type: "callout"; html: string };

export type Slide = {
  id: string;
  layout: "cover" | "content";
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** cover: the three facts along the bottom */
  meta?: string[];
  blocks: Block[];
};

let n = 0;
export const uid = (p = "b") =>
  `${p}${Date.now().toString(36)}${(n++).toString(36)}`;

const lines = (s: string) =>
  s
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

export function newBlock(type: Block["type"]): Block {
  const id = uid();
  switch (type) {
    case "text":
      return {
        id,
        type,
        html: "Click to write. Select text to make it <b>bold</b> or <i>italic</i>.",
      };
    case "bullets":
      return {
        id,
        type,
        items: ["First point", "Second point", "Third point"],
      };
    case "table":
      return {
        id,
        type,
        rows: [
          ["Item", "Owner", "Status"],
          ["", "", ""],
          ["", "", ""],
        ],
      };
    case "chart":
      return {
        id,
        type,
        title: "Chart title",
        bars: [
          { label: "A", value: 40 },
          { label: "B", value: 65 },
          { label: "C", value: 30 },
        ],
      };
    case "callout":
      return {
        id,
        type,
        html: "<b>Key point:</b> write the takeaway the reader must remember.",
      };
  }
}

export function blankSlide(): Slide {
  return {
    id: uid("s"),
    layout: "content",
    eyebrow: "Section",
    title: "New slide",
    blocks: [newBlock("text")],
  };
}

export function evidenceSlide(): Slide {
  const totals = EVIDENCE_BARS.reduce(
    (a, b) => ({
      e: a.e + b.extracted,
      c: a.c + b.cited,
      v: a.v + b.validated,
    }),
    { e: 0, c: 0, v: 0 },
  );
  return {
    id: uid("s"),
    layout: "content",
    eyebrow: "Evidence",
    title: "What the Evidence Says",
    blocks: [
      {
        id: uid(),
        type: "chart",
        title: "Validated claims per source",
        bars: EVIDENCE_BARS.slice(0, 6).map((b) => ({
          label: b.label,
          value: b.validated,
        })),
      },
      {
        id: uid(),
        type: "bullets",
        items: [
          `<b>${totals.e}</b> data points extracted from ${EVIDENCE_BARS.length} sources`,
          `<b>${totals.c}</b> cited in the analysis`,
          `<b>${totals.v}</b> validated by a reviewer`,
        ],
      },
    ],
  };
}

/** Build the deck from the project overview (+ the chat answers for projects created here). */
export function buildDeck(data: OverviewData, draft?: CreatedProject): Slide[] {
  const { project, stats, upcoming, workPackages } = data;
  const name = project.name;
  const date = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const totals = EVIDENCE_BARS.reduce(
    (a, b) => ({ c: a.c + b.cited, v: a.v + b.validated }),
    { c: 0, v: 0 },
  );

  const objective =
    draft?.objective?.trim() ||
    `Establish whether ${name.toLowerCase()} is technically and commercially viable, and what it would take to move to a pilot.`;
  const inScope = draft
    ? lines(draft.inScope)
    : [
        "Baseline the current process and its losses",
        "Compare the technical options against agreed criteria",
        "Model costs, benefits and key risks",
      ];
  const outScope = draft
    ? lines(draft.outScope)
    : ["Full-scale implementation", "Procurement of equipment or services"];
  const ins = draft?.insights;
  const risks = ins?.risks.length
    ? ins.risks.map(
        (r) =>
          `<b>${r.likelihood} likelihood · ${r.impact} impact:</b> ${r.risk}${r.mitigation ? ` — ${r.mitigation}` : ""}`,
      )
    : (draft?.risks
        .filter((r) => r.risk.trim())
        .map(
          (r) =>
            `<b>${r.severity}:</b> ${r.risk}${r.response ? ` — ${r.response}` : ""}`,
        ) ?? [
        "<b>Medium:</b> Supplier data arrives late — agree data requests early and track weekly",
        "<b>Medium:</b> Pilot telemetry covers too few operating hours — extend logging before the decision gate",
      ]);

  const slides: Slide[] = [
    {
      id: uid("s"),
      layout: "cover",
      eyebrow: "Final Research Case",
      title: name,
      subtitle: `Prepared for Artifex Labs · ${project.lead} · ${date}`,
      meta: [
        ins
          ? `Feasibility ${ins.feasibility}%`
          : `${project.progress}% complete`,
        `${EVIDENCE_BARS.length} sources · ${totals.v} claims validated`,
        "Draft for review",
      ],
      blocks: [],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Overview",
      title: "Executive Summary",
      blocks: [
        { id: uid(), type: "text", html: ins?.summary || objective },
        {
          id: uid(),
          type: "callout",
          html: ins?.recommendation
            ? `<b>Recommendation:</b> ${ins.recommendation}`
            : `<b>Recommendation:</b> continue to the next decision gate. ${totals.v} of ${totals.c} cited claims are validated; the remaining claims are flagged for review.`,
        },
        {
          id: uid(),
          type: "table",
          rows: [
            ["Measure", "Value"],
            ...stats.map((s) => [s.label, String(s.value)]),
          ],
        },
      ],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Charter",
      title: "What We Set Out to Establish",
      blocks: [
        {
          id: uid(),
          type: "bullets",
          items: inScope.length ? inScope : ["Scope not defined yet"],
        },
        {
          id: uid(),
          type: "bullets",
          items: outScope.length
            ? outScope.map((o) => `<i>Out of scope:</i> ${o}`)
            : ["Nothing excluded yet"],
        },
        ...(draft?.measures?.trim()
          ? [
              {
                id: uid(),
                type: "callout" as const,
                html: `<b>Success looks like:</b> ${lines(draft.measures).join("; ")}`,
              },
            ]
          : []),
      ],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Delivery",
      title: "Work Packages",
      blocks: [
        {
          id: uid(),
          type: "table",
          rows: [
            ["Work package", "Owner", "Team", "Status"],
            ...workPackages.map((w) => [w.title, w.owner, w.team, w.status]),
          ],
        },
      ],
    },
    evidenceSlide(),
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Evidence",
      title: "How Every Claim Is Traced",
      blocks: [
        {
          id: uid(),
          type: "table",
          rows: [
            ["Field", "What it records"],
            ...[...EVIDENCE_TABLE, ...LINEAGE]
              .slice(0, 5)
              .map((e) => [e.title, e.detail]),
          ],
        },
      ],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Plan",
      title: "Upcoming Milestones",
      blocks: [
        {
          id: uid(),
          type: "table",
          rows: [
            ["Milestone", "Start", "End", "Priority"],
            ...(upcoming.length
              ? upcoming.map((u) => [u.title, u.start, u.end, u.priority])
              : [["No milestones yet", "", "", ""]]),
          ],
        },
      ],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Risks",
      title: "Risks and Mitigations",
      blocks: [
        {
          id: uid(),
          type: "bullets",
          items: risks.length ? risks : ["No material risks recorded"],
        },
        {
          id: uid(),
          type: "callout",
          html: ins?.questions.length
            ? `<b>Open questions:</b> ${ins.questions.slice(0, 2).join(" ")}`
            : "<b>Open question:</b> confirm the cost range with Finance before the decision gate.",
        },
      ],
    },
    {
      id: uid("s"),
      layout: "content",
      eyebrow: "Decision",
      title: "Recommendation and Next Steps",
      blocks: [
        {
          id: uid(),
          type: "callout",
          html: ins?.recommendation
            ? `<b>Recommendation:</b> ${ins.recommendation}`
            : `<b>Proceed</b> with ${name} to the next decision gate, subject to the open validation items.`,
        },
        {
          id: uid(),
          type: "bullets",
          items: ins?.nextSteps.length
            ? ins.nextSteps
            : [
                "Close the flagged claims with a second source",
                "Run the pilot measurement plan",
                "Bring the decision to the steering group",
              ],
        },
      ],
    },
  ];

  /* contents slide, built from the titles */
  slides.splice(1, 0, {
    id: uid("s"),
    layout: "content",
    eyebrow: "Contents",
    title: "What Is in This Document",
    blocks: [
      {
        id: uid(),
        type: "table",
        rows: [
          ["Section", "Page"],
          ...slides.slice(1).map((s, i) => [s.title, String(i + 3)]),
        ],
      },
    ],
  });
  return slides;
}
