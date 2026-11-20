"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Add01Icon,
  ArrowDown02Icon,
  ArrowUp02Icon,
  Cancel01Icon,
  ChartColumnIcon,
  Copy01Icon,
  Delete02Icon,
  File02Icon,
  LeftToRightListBulletIcon,
  Pdf02Icon,
  PresentationBarChart01Icon,
  RefreshIcon,
  Table01Icon,
  TextIcon,
  Alert02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge } from "@/components/dashboard/Icon";
import {
  blankSlide,
  buildDeck,
  evidenceSlide,
  newBlock,
  uid,
  type Block,
  type Slide,
} from "@/lib/deck";
import type { CreatedProject, OverviewData } from "@/lib/createdProjects";

/** Short fingerprint of the project details a deck was built from. */
function signature(data: OverviewData, draft?: CreatedProject) {
  const src = JSON.stringify({
    p: data.project,
    s: data.stats,
    u: data.upcoming,
    w: data.workPackages,
    d: draft
      ? [
          draft.name,
          draft.objective,
          draft.inScope,
          draft.outScope,
          draft.measures,
          draft.lead,
          draft.risks,
          draft.workstreams,
          draft.gates,
          draft.insights?.generatedAt,
        ]
      : null,
  });
  let h = 5381;
  for (let k = 0; k < src.length; k++)
    h = ((h << 5) + h + src.charCodeAt(k)) >>> 0;
  return h.toString(36);
}

/* Slides are laid out at 960 × 540 and scaled to fit (thumbnails, canvas, PDF page). */
const W = 960;
const H = 540;

type IconSvg = Parameters<typeof huge>[0];

/* ---------------- editable text ---------------- */

/** contentEditable HTML; saved on blur so typing never fights React. */
function Editable({
  html,
  onChange,
  editable,
  className,
  placeholder,
  as = "div",
}: {
  html: string;
  onChange?: (html: string) => void;
  editable: boolean;
  className?: string;
  placeholder?: string;
  as?: "div" | "span" | "h1" | "h2" | "p" | "li" | "td" | "th";
}) {
  const Tag = as;
  return (
    <Tag
      contentEditable={editable}
      suppressContentEditableWarning
      spellCheck={editable}
      data-placeholder={placeholder}
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        onChange?.(e.currentTarget.innerHTML)
      }
      className={`${className ?? ""} ${editable ? "rounded-[4px] outline-none hover:bg-blue/[0.04] focus:bg-blue/[0.05] focus:ring-2 focus:ring-blue/30" : ""} empty:before:text-[#98A2B3] empty:before:content-[attr(data-placeholder)]`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ---------------- blocks ---------------- */

function SmallBtn({
  onClick,
  children,
  title,
}: {
  onClick: () => void;
  children: ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-6 items-center gap-1 rounded-md border border-[#EDEDF0] bg-white px-1.5 text-[11px] font-semibold text-body shadow-sm hover:text-blue"
    >
      {children}
    </button>
  );
}

function BlockView({
  b,
  edit,
  set,
  remove,
}: {
  b: Block;
  edit: boolean;
  set: (b: Block) => void;
  remove: () => void;
}) {
  let body: ReactNode;
  switch (b.type) {
    case "text":
      body = (
        <Editable
          editable={edit}
          html={b.html}
          placeholder="Write text"
          onChange={(html) => set({ ...b, html })}
          className="text-[15px] leading-[1.6] text-[#344054]"
        />
      );
      break;
    case "callout":
      body = (
        <div className="flex gap-3 rounded-xl border-l-4 border-blue bg-[#EEF2FD] px-4 py-3">
          <Editable
            editable={edit}
            html={b.html}
            placeholder="Write the key point"
            onChange={(html) => set({ ...b, html })}
            className="flex-1 text-[15px] leading-[1.55] text-[#101D37]"
          />
        </div>
      );
      break;
    case "bullets":
      body = (
        <div className="flex flex-col gap-1">
          <ul className="flex flex-col gap-2">
            {b.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-blue" />
                <Editable
                  editable={edit}
                  html={it}
                  placeholder="Point"
                  onChange={(html) =>
                    set({
                      ...b,
                      items: b.items.map((x, j) => (j === i ? html : x)),
                    })
                  }
                  className="min-w-[40px] flex-1 text-[15px] leading-[1.55] text-[#344054]"
                />
              </li>
            ))}
          </ul>
          {edit && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover/block:opacity-100">
              <SmallBtn
                title="Add point"
                onClick={() => set({ ...b, items: [...b.items, "New point"] })}
              >
                + Point
              </SmallBtn>
              {b.items.length > 1 && (
                <SmallBtn
                  title="Remove last point"
                  onClick={() => set({ ...b, items: b.items.slice(0, -1) })}
                >
                  − Point
                </SmallBtn>
              )}
            </div>
          )}
        </div>
      );
      break;
    case "table":
      body = (
        <div className="flex flex-col gap-1">
          <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-xl border border-[#EDEDF0] text-[13px] leading-[1.45]">
            <tbody>
              {b.rows.map((row, r) => (
                <tr
                  key={r}
                  className={
                    r === 0
                      ? "bg-[#F2F4F7]"
                      : r % 2
                        ? "bg-white"
                        : "bg-[#FAFAFA]"
                  }
                >
                  {row.map((cell, c) => (
                    <Editable
                      key={c}
                      as={r === 0 ? "th" : "td"}
                      editable={edit}
                      html={cell}
                      onChange={(html) =>
                        set({
                          ...b,
                          rows: b.rows.map((x, i) =>
                            i === r ? x.map((y, j) => (j === c ? html : y)) : x,
                          ),
                        })
                      }
                      className={`border-b border-[#EDEDF0] px-3 py-2 text-left align-top break-words ${r === 0 ? "font-semibold text-[#101D37]" : "text-[#344054]"}`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {edit && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover/block:opacity-100">
              <SmallBtn
                title="Add row"
                onClick={() =>
                  set({ ...b, rows: [...b.rows, b.rows[0].map(() => "")] })
                }
              >
                + Row
              </SmallBtn>
              {b.rows.length > 2 && (
                <SmallBtn
                  title="Remove last row"
                  onClick={() => set({ ...b, rows: b.rows.slice(0, -1) })}
                >
                  − Row
                </SmallBtn>
              )}
              {b.rows[0].length < 6 && (
                <SmallBtn
                  title="Add column"
                  onClick={() =>
                    set({
                      ...b,
                      rows: b.rows.map((r, i) => [
                        ...r,
                        i === 0 ? "Column" : "",
                      ]),
                    })
                  }
                >
                  + Column
                </SmallBtn>
              )}
              {b.rows[0].length > 1 && (
                <SmallBtn
                  title="Remove last column"
                  onClick={() =>
                    set({ ...b, rows: b.rows.map((r) => r.slice(0, -1)) })
                  }
                >
                  − Column
                </SmallBtn>
              )}
            </div>
          )}
        </div>
      );
      break;
    case "chart": {
      const max = Math.max(1, ...b.bars.map((x) => x.value));
      body = (
        <div className="flex flex-col gap-3 rounded-xl border border-[#EDEDF0] bg-white p-4">
          <Editable
            editable={edit}
            html={b.title}
            onChange={(html) => set({ ...b, title: html })}
            className="text-[13px] font-semibold text-[#101D37]"
          />
          <div className="flex h-[150px] items-end gap-3">
            {b.bars.map((bar, i) => (
              <div
                key={i}
                className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
              >
                <Editable
                  editable={edit}
                  html={String(bar.value)}
                  onChange={(html) => {
                    const v = Math.max(
                      0,
                      Number(
                        html.replace(/<[^>]*>/g, "").replace(/[^\d.]/g, ""),
                      ) || 0,
                    );
                    set({
                      ...b,
                      bars: b.bars.map((x, j) =>
                        j === i ? { ...x, value: v } : x,
                      ),
                    });
                  }}
                  className="text-[11px] font-semibold text-[#101D37]"
                />
                <div
                  className="w-full max-w-[44px] rounded-t-md bg-blue"
                  style={{
                    height: `${Math.max(4, (bar.value / max) * 110)}px`,
                  }}
                />
                <Editable
                  editable={edit}
                  html={bar.label}
                  onChange={(html) =>
                    set({
                      ...b,
                      bars: b.bars.map((x, j) =>
                        j === i ? { ...x, label: html } : x,
                      ),
                    })
                  }
                  className="w-full truncate text-center text-[10px] leading-[1.3] text-body"
                />
              </div>
            ))}
          </div>
          {edit && (
            <div className="flex gap-1 opacity-0 transition-opacity group-hover/block:opacity-100">
              {b.bars.length < 10 && (
                <SmallBtn
                  title="Add bar"
                  onClick={() =>
                    set({
                      ...b,
                      bars: [...b.bars, { label: "New", value: 20 }],
                    })
                  }
                >
                  + Bar
                </SmallBtn>
              )}
              {b.bars.length > 1 && (
                <SmallBtn
                  title="Remove last bar"
                  onClick={() => set({ ...b, bars: b.bars.slice(0, -1) })}
                >
                  − Bar
                </SmallBtn>
              )}
            </div>
          )}
        </div>
      );
      break;
    }
  }
  return (
    <div className="group/block relative min-w-0">
      {body}
      {edit && (
        <button
          type="button"
          title="Remove this block"
          aria-label="Remove this block"
          onMouseDown={(e) => e.preventDefault()}
          onClick={remove}
          className="absolute -top-2.5 -right-2.5 flex size-6 items-center justify-center rounded-full border border-[#EDEDF0] bg-white text-body opacity-0 shadow-sm transition-opacity group-hover/block:opacity-100 hover:text-[#D92D20]"
        >
          <Icon icon={huge(Cancel01Icon)} size={12} stroke={2} />
        </button>
      )}
    </div>
  );
}

/* ---------------- slide ---------------- */

function SlideView({
  slide,
  index,
  total,
  project,
  edit,
  onChange,
}: {
  slide: Slide;
  index: number;
  total: number;
  project: string;
  edit: boolean;
  onChange?: (s: Slide) => void;
}) {
  const set = (p: Partial<Slide>) => onChange?.({ ...slide, ...p });
  if (slide.layout === "cover")
    return (
      <div
        className="relative flex flex-col justify-center overflow-hidden px-20 text-white"
        style={{
          width: W,
          height: H,
          background:
            "linear-gradient(135deg,#285CE0 0%,#1B3FA6 55%,#101D37 100%)",
        }}
      >
        <div className="pointer-events-none absolute -top-24 -right-24 size-[360px] rounded-full bg-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 size-[300px] rounded-full bg-white/[0.05]" />
        <Editable
          editable={edit}
          html={slide.eyebrow}
          onChange={(h) => set({ eyebrow: h })}
          className="text-[13px] font-semibold tracking-[0.12em] text-white/80 uppercase"
        />
        <Editable
          as="h1"
          editable={edit}
          html={slide.title}
          onChange={(h) => set({ title: h })}
          className="mt-4 text-[52px] leading-[1.1] font-semibold tracking-[-0.02em]"
        />
        <Editable
          editable={edit}
          html={slide.subtitle ?? ""}
          placeholder="Subtitle"
          onChange={(h) => set({ subtitle: h })}
          className="mt-5 text-[20px] font-medium text-white/90"
        />
        <div className="absolute right-20 bottom-14 left-20 flex flex-wrap gap-x-12 gap-y-2">
          {(slide.meta ?? []).map((m, i) => (
            <Editable
              key={i}
              editable={edit}
              html={m}
              onChange={(h) =>
                set({
                  meta: (slide.meta ?? []).map((x, j) => (j === i ? h : x)),
                })
              }
              className="text-[15px] font-medium text-white/90"
            />
          ))}
        </div>
      </div>
    );
  const many = slide.blocks.length > 1;
  return (
    <div
      className="relative flex flex-col overflow-hidden bg-white px-14 pt-12 pb-14"
      style={{ width: W, height: H }}
    >
      <div className="absolute top-0 left-0 h-1.5 w-full bg-blue" />
      <Editable
        editable={edit}
        html={slide.eyebrow}
        onChange={(h) => set({ eyebrow: h })}
        className="text-[12px] font-semibold tracking-[0.12em] text-blue uppercase"
      />
      <Editable
        as="h2"
        editable={edit}
        html={slide.title}
        onChange={(h) => set({ title: h })}
        className="mt-2 text-[30px] leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]"
      />
      <div
        className={`mt-6 grid min-h-0 flex-1 content-start gap-6 ${many ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {slide.blocks.map((b, i) => (
          <div
            key={b.id}
            className={
              many &&
              (b.type === "table" || b.type === "text") &&
              i === 0 &&
              slide.blocks.length % 2 === 1
                ? "col-span-2"
                : ""
            }
          >
            <BlockView
              b={b}
              edit={edit}
              set={(nb) =>
                set({
                  blocks: slide.blocks.map((x) => (x.id === b.id ? nb : x)),
                })
              }
              remove={() =>
                set({ blocks: slide.blocks.filter((x) => x.id !== b.id) })
              }
            />
          </div>
        ))}
        {edit && slide.blocks.length === 0 && (
          <p className="text-[14px] text-[#98A2B3]">
            Empty slide. Use Insert in the toolbar to add text, bullets, a
            table, a chart or a callout.
          </p>
        )}
      </div>
      <div className="absolute right-14 bottom-5 left-14 flex items-center justify-between text-[11px] text-[#98A2B3]">
        <span>Artifex Labs · {project}</span>
        <span>
          {index + 1} / {total}
        </span>
      </div>
    </div>
  );
}

/** Scales a 960×540 slide to `width`. */
function Scaled({ width, children }: { width: number; children: ReactNode }) {
  const s = width / W;
  return (
    <div style={{ width, height: H * s }} className="relative overflow-hidden">
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${s})`,
          transformOrigin: "top left",
        }}
        className="absolute top-0 left-0"
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- editor ---------------- */

function ToolBtn({
  icon,
  children,
  onClick,
  disabled,
  danger,
}: {
  icon: IconSvg;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-35 ${
        danger
          ? "text-[#D92D20] hover:bg-[#FEF3F2]"
          : "text-[#101D37] hover:bg-[#F2F4F7]"
      }`}
    >
      <Icon icon={huge(icon)} size={16} stroke={1.6} />
      <span className="hidden xl:inline">{children}</span>
    </button>
  );
}

function FormatBtn({
  cmd,
  children,
  label,
}: {
  cmd: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault();
        document.execCommand(cmd);
      }}
      className="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm text-[#101D37] hover:bg-[#F2F4F7]"
    >
      {children}
    </button>
  );
}

export default function DeckEditor({
  slug,
  data,
  draft,
}: {
  slug: string;
  data: OverviewData;
  draft?: CreatedProject;
}) {
  const key = `deck:${slug}`;
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [cur, setCur] = useState(0);
  const [saved, setSaved] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState<"pptx" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 500 });
  const sig = signature(data, draft);
  const project = data.project.name;

  /* project data only seeds a new deck; keep it in a ref so re-renders never reload */
  const source = useRef({ data, draft });
  source.current = { data, draft };
  useEffect(() => {
    const { data: d, draft: dr } = source.current;
    const now = signature(d, dr);
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw
        ? (JSON.parse(raw) as Slide[] | { slides: Slide[]; src?: string })
        : null;
      const list = Array.isArray(parsed) ? parsed : parsed?.slides;
      if (Array.isArray(list) && list.length) {
        setSlides(list);
        /* project details changed since these slides were made: offer an update */
        setStale(!Array.isArray(parsed) && !!parsed?.src && parsed.src !== now);
      } else setSlides(buildDeck(d, dr));
    } catch {
      setSlides(buildDeck(d, dr));
    }
  }, [key]);

  /* the fingerprint saved with the deck; moves forward when the deck is rebuilt or the user keeps theirs */
  const [deckSrc, setDeckSrc] = useState<string | null>(null);
  useEffect(() => {
    if (slides && deckSrc === null) {
      try {
        const raw = localStorage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : null;
        setDeckSrc(
          parsed && !Array.isArray(parsed) && parsed.src ? parsed.src : sig,
        );
      } catch {
        setDeckSrc(sig);
      }
    }
  }, [slides, deckSrc, key, sig]);

  useEffect(() => {
    if (!slides) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({ slides, src: deckSrc ?? sig }),
      );
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }, [slides, key, deckSrc, sig]);

  const ready = slides !== null;
  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) =>
      setStageSize({ w: e.contentRect.width, h: e.contentRect.height }),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, [ready]);

  /* the editor takes the whole window; keep the page behind it from scrolling */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!slides)
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#F8F9FC] text-sm text-body">
        Building the research case…
      </div>
    );

  const i = Math.min(cur, slides.length - 1);
  const slide = slides[i];
  const update = (fn: (l: Slide[]) => Slide[]) => {
    setSaved(false);
    setSlides((l) => (l ? fn(l) : l));
  };
  const setSlide = (s: Slide) =>
    update((l) => l.map((x, j) => (j === i ? s : x)));
  const insertAt = (s: Slide) => {
    update((l) => [...l.slice(0, i + 1), s, ...l.slice(i + 1)]);
    setCur(i + 1);
  };
  const move = (d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= slides.length) return;
    update((l) => {
      const c = [...l];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
    setCur(j);
  };
  const addBlock = (t: Block["type"]) => {
    if (slide.layout === "cover") {
      insertAt({ ...blankSlide(), blocks: [newBlock(t)] });
      return;
    }
    setSlide({ ...slide, blocks: [...slide.blocks, newBlock(t)] });
  };
  const pdf = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    const prev = document.title;
    document.title = `${project} – Research Case`;
    setTimeout(() => {
      window.print();
      document.title = prev;
    }, 50);
  };
  /* the whole slide fits the stage: limited by width and by height (16:9) */
  const canvasW = Math.max(
    320,
    Math.min(stageSize.w - 16, ((stageSize.h - 24) * W) / H, 1100),
  );
  const rebuild = () => {
    update(() => buildDeck(data, draft));
    setDeckSrc(sig);
    setStale(false);
    setCur(0);
  };
  const pptx = async () => {
    setExportError(null);
    setBusy("pptx");
    try {
      const { exportPptx } = await import("@/lib/deckPptx");
      await exportPptx(slides, project);
    } catch {
      setExportError("Couldn't create the PowerPoint file. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="deck-editor fixed inset-0 z-[60] flex flex-col bg-[#F8F9FC]">
      {/* top bar */}
      <header className="flex items-center gap-3 border-b border-[#EDEDF0] bg-white px-4 py-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-blue/10 text-blue">
          <Icon icon={huge(File02Icon)} size={18} stroke={1.6} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base leading-[1.3] font-semibold text-[#101D37]">
            {project}
          </p>
          <p className="text-xs text-body">
            Research case · {slides.length} slides ·{" "}
            {saved ? "Saved" : "Saving…"}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-0.5 overflow-x-auto">
          <ToolBtn icon={Add01Icon} onClick={() => insertAt(blankSlide())}>
            New slide
          </ToolBtn>
          <ToolBtn
            icon={ChartColumnIcon}
            onClick={() => insertAt(evidenceSlide())}
          >
            Add evidence slide
          </ToolBtn>
          <ToolBtn
            icon={Copy01Icon}
            onClick={() =>
              insertAt({ ...JSON.parse(JSON.stringify(slide)), id: uid("s") })
            }
          >
            Duplicate
          </ToolBtn>
          <ToolBtn
            icon={Delete02Icon}
            danger
            disabled={slides.length < 2}
            onClick={() => {
              update((l) => l.filter((_, j) => j !== i));
              setCur(Math.max(0, i - 1));
            }}
          >
            Delete
          </ToolBtn>
          <ToolBtn
            icon={ArrowUp02Icon}
            disabled={i === 0}
            onClick={() => move(-1)}
          >
            Move up
          </ToolBtn>
          <ToolBtn
            icon={ArrowDown02Icon}
            disabled={i === slides.length - 1}
            onClick={() => move(1)}
          >
            Move down
          </ToolBtn>
          {confirmReset ? (
            <span className="flex items-center gap-1.5 px-1 text-xs text-body">
              Rebuild from project?
              <button
                type="button"
                onClick={() => {
                  rebuild();
                  setConfirmReset(false);
                }}
                className="h-7 rounded-lg bg-[#D92D20] px-2 text-xs font-semibold text-white"
              >
                Rebuild
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs font-semibold text-[#101D37]"
              >
                Keep
              </button>
            </span>
          ) : (
            <ToolBtn icon={RefreshIcon} onClick={() => setConfirmReset(true)}>
              Rebuild
            </ToolBtn>
          )}
        </div>
        <button
          type="button"
          onClick={pptx}
          disabled={busy === "pptx"}
          title="Download as PowerPoint (.pptx)"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-sm font-semibold text-[#101D37] hover:border-blue/40 hover:text-blue disabled:opacity-60"
        >
          <Icon
            icon={huge(PresentationBarChart01Icon)}
            size={16}
            stroke={1.6}
          />
          {busy === "pptx" ? "Preparing…" : "PPTX"}
        </button>
        <button
          type="button"
          onClick={pdf}
          title="Opens print: choose “Save as PDF”"
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-blue px-3 text-sm font-semibold text-white"
        >
          <Icon icon={huge(Pdf02Icon)} size={16} stroke={1.6} />
          Generate PDF
        </button>
        <Link
          href={`/projects/${slug}`}
          aria-label="Close editor"
          title="Close"
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-body hover:bg-[#F2F4F7] hover:text-[#101D37]"
        >
          <Icon icon={huge(Cancel01Icon)} size={18} stroke={1.6} />
        </Link>
      </header>

      {/* format + insert bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#EDEDF0] bg-white px-4 py-1.5">
        <FormatBtn cmd="bold" label="Bold">
          <b>B</b>
        </FormatBtn>
        <FormatBtn cmd="italic" label="Italic">
          <i className="font-serif">I</i>
        </FormatBtn>
        <FormatBtn cmd="underline" label="Underline">
          <u>U</u>
        </FormatBtn>
        <FormatBtn cmd="insertUnorderedList" label="Bulleted list">
          • List
        </FormatBtn>
        <span className="mx-2 h-5 w-px bg-[#EDEDF0]" />
        <span className="mr-1 text-sm text-body">Insert</span>
        {(
          [
            ["text", "Text", TextIcon],
            ["bullets", "Bullets", LeftToRightListBulletIcon],
            ["table", "Table", Table01Icon],
            ["chart", "Chart", ChartColumnIcon],
            ["callout", "Callout", Alert02Icon],
          ] as const
        ).map(([t, label, ic]) => (
          <button
            key={t}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => addBlock(t)}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm text-[#101D37] hover:bg-[#F2F4F7]"
          >
            <Icon icon={huge(ic)} size={15} stroke={1.6} />
            {label}
          </button>
        ))}
        <span className="ml-auto hidden pl-4 text-xs whitespace-nowrap text-body lg:inline">
          Click any text on the slide to edit it
        </span>
      </div>

      {(stale || exportError) && (
        <div
          role="status"
          className={`flex flex-wrap items-center gap-3 border-b px-4 py-2 text-sm ${
            exportError
              ? "border-[#F04438]/20 bg-[#FEF3F2] text-[#B42318]"
              : "border-blue/20 bg-[#EEF2FD] text-[#101D37]"
          }`}
        >
          {exportError ? (
            <>
              {exportError}
              <button
                type="button"
                onClick={() => setExportError(null)}
                className="ml-auto text-xs font-semibold"
              >
                Dismiss
              </button>
            </>
          ) : (
            <>
              <span>
                This project’s details have changed since these slides were
                made.
              </span>
              <span className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeckSrc(sig);
                    setStale(false);
                  }}
                  className="h-8 rounded-[10px] px-2.5 text-xs font-semibold text-body hover:text-[#101D37]"
                >
                  Keep my version
                </button>
                <button
                  type="button"
                  onClick={rebuild}
                  className="h-8 rounded-[10px] bg-blue px-3 text-xs font-semibold text-white"
                >
                  Update slides from project
                </button>
              </span>
            </>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* thumbnails */}
        <aside className="hidden w-[212px] shrink-0 flex-col gap-3 overflow-y-auto border-r border-[#EDEDF0] bg-white p-3 md:flex">
          {slides.map((s, j) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCur(j)}
              aria-label={`Slide ${j + 1}: ${s.title.replace(/<[^>]*>/g, "")}`}
              aria-current={j === i}
              className={`relative shrink-0 overflow-hidden rounded-[10px] border-2 text-left transition-colors ${j === i ? "border-blue shadow-[0_6px_16px_0_rgba(40,92,224,0.18)]" : "border-[#EDEDF0] hover:border-[#D0D5DD]"}`}
            >
              <span className="pointer-events-none block">
                <Scaled width={180}>
                  <SlideView
                    slide={s}
                    index={j}
                    total={slides.length}
                    project={project}
                    edit={false}
                  />
                </Scaled>
              </span>
              <span
                className={`absolute bottom-1.5 left-1.5 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[11px] font-semibold ${j === i ? "bg-blue text-white" : "bg-[#101D37]/80 text-white"}`}
              >
                {j + 1}
              </span>
            </button>
          ))}
        </aside>

        {/* canvas */}
        <main
          ref={stage}
          className="flex min-w-0 flex-1 flex-col items-center justify-center overflow-auto px-6 py-6"
        >
          <div className="rounded-sm shadow-[0_14px_40px_0_rgba(16,29,55,0.12)]">
            <Scaled width={canvasW}>
              <SlideView
                key={slide.id}
                slide={slide}
                index={i}
                total={slides.length}
                project={project}
                edit
                onChange={setSlide}
              />
            </Scaled>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-body md:hidden">
            <button
              type="button"
              disabled={i === 0}
              onClick={() => setCur(i - 1)}
              className="h-8 rounded-lg border border-[#EDEDF0] bg-white px-3 disabled:opacity-40"
            >
              Previous
            </button>
            {i + 1} / {slides.length}
            <button
              type="button"
              disabled={i === slides.length - 1}
              onClick={() => setCur(i + 1)}
              className="h-8 rounded-lg border border-[#EDEDF0] bg-white px-3 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </main>
      </div>

      {/* print-only copy: one slide per PDF page */}
      {createPortal(
        <div className="deck-print" aria-hidden>
          {slides.map((s, j) => (
            <div key={s.id} className="deck-page">
              <SlideView
                slide={s}
                index={j}
                total={slides.length}
                project={project}
                edit={false}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
