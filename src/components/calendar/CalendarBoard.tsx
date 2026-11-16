"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  DotsHorizontal,
  DotsVertical,
  FilterLines,
  SearchMd,
} from "@untitledui/icons";
import { Add01Icon } from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import { StageBar } from "@/components/dashboard/ProjectUi";
import {
  INITIAL_EVENTS,
  STATUSES,
  STATUS_STYLE,
  formatRange,
  monthLabel,
  toDate,
  toIso,
  type CalEvent,
  type EventStatus,
} from "@/lib/events";

const STORE = "calendar:events";
const load = (): CalEvent[] | null => {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as CalEvent[]) : null;
  } catch {
    return null;
  }
};
const save = (list: CalEvent[]) => {
  try {
    localStorage.setItem(STORE, JSON.stringify(list));
  } catch {
    /* ignore */
  }
};

/* ---------------- shared bits ---------------- */

/** Two team avatars (24px) + "+N" counter (Figma "Attendee Avatars", 60.75 x 24). */
function People({ more, size = 24 }: { more: number; size?: number }) {
  return (
    <span className="flex items-center">
      <Image
        src="/images/team-avatars.png"
        alt=""
        width={281}
        height={171}
        style={{ height: size, width: "auto" }}
      />
      <span
        className="-ml-2 flex items-center justify-center rounded-full border-[1.13px] border-[#FDFCFC] bg-[#F6F4F3] font-semibold tracking-[-0.06em] text-[#242C2C]"
        style={{ width: size, height: size, fontSize: size * 0.33 }}
      >
        +{more}
      </span>
    </span>
  );
}

function StatusPill({ status, badge = false }: { status: EventStatus; badge?: boolean }) {
  return (
    <span
      className={`inline-flex h-6 items-center whitespace-nowrap text-xs leading-[1.5] font-medium tracking-[-0.02em] ${
        badge ? "rounded-md px-2 py-[3px] shadow-[0_1px_5px_0_rgba(0,0,0,0.05)]" : "rounded-lg px-3 py-1"
      } ${STATUS_STYLE[status].pill}`}
    >
      {status}
    </span>
  );
}

/* Figma "align-vertical" icon on the Kanban toggle: two column bars */
function KanbanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2" width="4" height="12" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="4" height="8.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function DragHandle() {
  return (
    <svg width="12" height="16" viewBox="0 0 12 16" aria-hidden className="text-body">
      {[3, 9].map((x) => [3, 8, 13].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />))}
    </svg>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-[33px] items-center gap-2 rounded-md border border-[#EDEDF0] px-3 py-1.5 text-sm leading-[1.5] tracking-[-0.02em] transition-colors ${
        active ? "bg-[#FAFAFA] font-medium text-[#101D37]" : "bg-white text-body hover:text-[#101D37]"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------- Kanban ---------------- */

/** Figma Kanban card: 239 wide, radius 12, padding 12, gap 10, shadow 0 1 5 #000 5% */
function KanbanCard({ ev, onDragStart }: { ev: CalEvent; onDragStart: (id: string) => void }) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", ev.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(ev.id);
      }}
      className="flex cursor-grab flex-col gap-2.5 rounded-xl border border-[#EDEDF0] bg-white p-3 shadow-[0_1px_5px_0_rgba(0,0,0,0.05)] active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="truncate text-sm leading-[1.4] font-medium tracking-[-0.02em] text-[#101D37]">
            {ev.title}
          </h3>
          <p className="text-xs leading-[1.5] font-medium tracking-[-0.02em] text-body">
            {formatRange(ev.start, ev.end)}
          </p>
        </div>
        <button type="button" aria-label="Event options" className="shrink-0 text-[#101D37]">
          <Icon icon={untitled(DotsVertical)} size={16} />
        </button>
      </div>
      <div className="flex items-center justify-between">
        <People more={ev.more} />
        <StageBar value={ev.progress} scale={0.93} />
      </div>
    </article>
  );
}

function Kanban({
  events,
  onMove,
}: {
  events: CalEvent[];
  onMove: (id: string, status: EventStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<EventStatus | null>(null);

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-1">
      <div className="grid min-w-[900px] grid-cols-4 gap-4">
        {STATUSES.map((status) => {
          const list = events.filter((e) => e.status === status);
          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(status);
              }}
              onDragLeave={() => setOver((o) => (o === status ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain") || dragId;
                if (id) onMove(id, status);
                setOver(null);
                setDragId(null);
              }}
              className={`flex flex-col gap-4 self-start rounded-xl border bg-[#FAFAFA] p-3 transition-colors ${
                over === status ? "border-blue/40 bg-blue/[0.03]" : "border-[#EDEDF0]"
              }`}
            >
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-[13px]">
                  <DragHandle />
                  <StatusPill status={status} />
                  <span className="text-xs leading-[1.5] font-semibold tracking-[-0.02em] text-body">
                    {list.length}
                  </span>
                </div>
                <button type="button" aria-label={`${status} options`} className="text-[#101D37]">
                  <Icon icon={untitled(DotsHorizontal)} size={16} />
                </button>
              </header>
              {list.map((ev) => (
                <KanbanCard key={ev.id} ev={ev} onDragStart={setDragId} />
              ))}
              {list.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#EDEDF0] py-6 text-center text-xs text-body">
                  Drop events here
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Month calendar ---------------- */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Segment = { ev: CalEvent; col: number; span: number; lane: number };

function buildWeeks(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - offset);
  const last = new Date(year, month + 1, 0);
  const totalDays = offset + last.getDate();
  const weeks = Math.ceil(totalDays / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
  );
}

function layoutWeek(week: Date[], events: CalEvent[]): Segment[] {
  const ws = toIso(week[0]);
  const we = toIso(week[6]);
  const segs = events
    .filter((e) => e.start <= we && e.end >= ws)
    .sort((a, b) => a.start.localeCompare(b.start) || b.end.localeCompare(a.end))
    .map((ev) => {
      const s = ev.start < ws ? ws : ev.start;
      const e = ev.end > we ? we : ev.end;
      const col = week.findIndex((d) => toIso(d) === s);
      const endCol = week.findIndex((d) => toIso(d) === e);
      return { ev, col, span: endCol - col + 1, lane: 0 };
    });
  const lanes: number[] = []; // last occupied column per lane
  for (const seg of segs) {
    let lane = lanes.findIndex((lastCol) => lastCol < seg.col);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(-1);
    }
    lanes[lane] = seg.col + seg.span - 1;
    seg.lane = lane;
  }
  return segs;
}

function EventCard({ seg }: { seg: Segment }) {
  const { ev, span } = seg;
  const bar = STATUS_STYLE[ev.status].bar;
  if (span >= 2) {
    /* Figma big card: 281 wide (2 days), radius 12, padding 12, gap 20 */
    return (
      <article className="flex flex-col gap-5 rounded-xl border border-[#EDEDF0] bg-white p-3 shadow-[0_1px_5px_0_rgba(0,0,0,0.05)]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-stretch gap-2">
            <span className="w-1 shrink-0 rounded-full" style={{ background: bar }} />
            <div className="min-w-0">
              <h3 className="truncate text-sm leading-[1.4] font-medium tracking-[-0.02em] text-[#101D37]">
                {ev.title}
              </h3>
              <p className="text-xs leading-[1.5] font-medium tracking-[-0.02em] text-body">
                {formatRange(ev.start, ev.end)}
              </p>
            </div>
          </div>
          <Icon icon={untitled(DotsVertical)} size={16} className="shrink-0 text-[#101D37]" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <People more={ev.more} />
            <StatusPill status={ev.status} badge />
          </div>
          <StageBar value={ev.progress} scale={0.93} />
        </div>
      </article>
    );
  }
  /* Figma small card: 1 day, title Inter 500 12/140 (2 lines), date 10 */
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-[#EDEDF0] bg-white p-3 shadow-[0_1px_5px_0_rgba(0,0,0,0.05)]">
      <div className="flex items-stretch gap-2">
        <span className="w-1 shrink-0 rounded-full" style={{ background: bar }} />
        <h3 className="line-clamp-2 text-xs leading-[1.4] font-medium tracking-[-0.02em] text-[#101D37]">
          {ev.title}
        </h3>
      </div>
      <p className="text-[10px] leading-[1.5] font-medium tracking-[-0.02em] text-body">
        {formatRange(ev.start, ev.end)}
      </p>
      <div className="flex items-center justify-between gap-1">
        <People more={ev.more} size={16} />
        <StageBar value={ev.progress} scale={0.55} />
      </div>
    </article>
  );
}

function MonthView({
  year,
  month,
  events,
  selected,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  events: CalEvent[];
  selected: string;
  onSelect: (iso: string) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const weeks = useMemo(() => buildWeeks(year, month), [year, month]);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4">
        <div className="min-w-[900px]">
          {/* Figma "Day" header cells: 152.57 x 44, border #EDEDF0, Inter 500 14 #101D37 */}
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="-ml-px flex h-11 items-center justify-center border border-[#EDEDF0] bg-white text-sm leading-[1.5] font-medium tracking-[-0.02em] text-[#101D37] first:ml-0"
              >
                {d}
              </div>
            ))}
          </div>

          {weeks.map((week) => {
            const segs = layoutWeek(week, events);
            const lanes = segs.reduce((m, s) => Math.max(m, s.lane + 1), 0);
            const isSelectedWeek = week.some((d) => toIso(d) === selected);
            return (
              <div key={toIso(week[0])} className="relative -mt-px">
                {/* day cells: 148.4 tall, #FAFAFA, border #EDEDF0, padding 4/12 */}
                <div className="absolute inset-0 grid grid-cols-7">
                  {week.map((d) => {
                    const iso = toIso(d);
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => onSelect(iso)}
                        aria-label={iso}
                        className="-ml-px border border-[#EDEDF0] bg-[#FAFAFA] first:ml-0"
                        style={
                          isSelectedWeek
                            ? {
                                backgroundColor: "#F3F4F6",
                                backgroundImage:
                                  "repeating-linear-gradient(135deg, #EDEDF0 0 1.4px, transparent 1.4px 6px)",
                              }
                            : undefined
                        }
                      />
                    );
                  })}
                </div>
                <div
                  className="pointer-events-none relative grid grid-cols-7 gap-y-2 px-0 pb-3"
                  style={{ minHeight: 148.4, gridTemplateRows: `29px repeat(${Math.max(lanes, 1)}, auto)` }}
                >
                  {week.map((d, i) => (
                    <span
                      key={toIso(d)}
                      className="px-3 pt-1 text-sm leading-[1.5] font-medium tracking-[-0.02em] text-body"
                      style={{ gridColumn: i + 1, gridRow: 1 }}
                    >
                      {d.getDate()}
                    </span>
                  ))}
                  {segs.map((seg) => (
                    <div
                      key={`${seg.ev.id}-${toIso(week[0])}`}
                      className="pointer-events-auto px-3"
                      style={{ gridColumn: `${seg.col + 1} / span ${seg.span}`, gridRow: seg.lane + 2 }}
                    >
                      <EventCard seg={seg} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Figma "Pagination": two 30px buttons, gap 8 */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          aria-label="Previous month"
          className="flex size-[30px] items-center justify-center rounded-md border border-[#EDEDF0] bg-white text-[#101D37]"
        >
          <Icon icon={untitled(ArrowLeft)} size={16} />
        </button>
        <span className="min-w-[110px] text-center text-xs font-medium text-body">{monthLabel(year, month)}</span>
        <button
          type="button"
          onClick={onNext}
          aria-label="Next month"
          className="flex size-[30px] items-center justify-center rounded-md border border-[#EDEDF0] bg-white text-[#101D37]"
        >
          <Icon icon={untitled(ArrowRight)} size={16} />
        </button>
      </div>
    </div>
  );
}

/* ---------------- Add event dialog ---------------- */

function AddEventDialog({
  defaultDate,
  onClose,
  onAdd,
}: {
  defaultDate: string;
  onClose: () => void;
  onAdd: (ev: Omit<CalEvent, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(defaultDate);
  const [end, setEnd] = useState(defaultDate);
  const [status, setStatus] = useState<EventStatus>("Scheduled");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101D37]/40 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onAdd({ title: title.trim(), start, end: end < start ? start : end, status, progress: 0, more: 0 });
        }}
        className="flex w-full max-w-[400px] flex-col gap-4 rounded-[20px] border border-[#EDEDF0] bg-white p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.10)]"
      >
        <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]">Add Event</h2>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#101D37]">
          Title
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Partner evidence discussion"
            className="h-10 rounded-[10px] border border-[#EDEDF0] px-3 text-sm font-normal outline-none placeholder:text-body focus:border-blue"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#101D37]">
            Start
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-10 rounded-[10px] border border-[#EDEDF0] px-3 text-sm font-normal outline-none focus:border-blue" />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[#101D37]">
            End
            <input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} className="h-10 rounded-[10px] border border-[#EDEDF0] px-3 text-sm font-normal outline-none focus:border-blue" />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-[#101D37]">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as EventStatus)} className="h-10 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-sm font-normal outline-none focus:border-blue">
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-9 rounded-[10px] border border-[#EDEDF0] px-3 text-sm font-semibold text-[#242C2C]">
            Cancel
          </button>
          <button type="submit" className="h-9 rounded-[10px] bg-blue px-3 text-sm font-semibold text-white">
            Add Event
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------- Board (header + views) ---------------- */

export default function CalendarBoard() {
  const router = useRouter();
  const params = useSearchParams();
  const view = params.get("view") === "kanban" ? "kanban" : "calendar";

  const [events, setEvents] = useState<CalEvent[]>(INITIAL_EVENTS);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<EventStatus[]>([...STATUSES]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [ym, setYm] = useState({ y: 2025, m: 6 }); // July 2025 – the month shown in Figma
  const [selected, setSelected] = useState("2025-07-15");

  useEffect(() => {
    const saved = load();
    if (saved) setEvents(saved);
  }, []);

  const update = (fn: (l: CalEvent[]) => CalEvent[]) =>
    setEvents((prev) => {
      const next = fn(prev);
      save(next);
      return next;
    });

  const visible = events.filter(
    (e) => filter.includes(e.status) && e.title.toLowerCase().includes(query.toLowerCase()),
  );

  const setView = (v: "kanban" | "calendar") =>
    router.replace(v === "kanban" ? "/calendar?view=kanban" : "/calendar", { scroll: false });

  const shiftMonth = (d: number) =>
    setYm(({ y, m }) => {
      const t = new Date(y, m + d, 1);
      return { y: t.getFullYear(), m: t.getMonth() };
    });

  return (
    /* Figma "Calender" card: 1100 wide, radius 12, padding 16, gap 16, white, border */
    <section className="flex w-full max-w-[1100px] flex-col gap-4 rounded-xl border border-[#EDEDF0] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
          Deadlines, Reviews, Meetings..
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <ToolbarButton active={view === "kanban"} onClick={() => setView("kanban")}>
            <KanbanIcon />
            Kanban
          </ToolbarButton>
          <ToolbarButton active={view === "calendar"} onClick={() => setView("calendar")}>
            <Icon icon={untitled(Calendar)} size={16} />
            Calendar
          </ToolbarButton>
          <div className="relative">
            <ToolbarButton active={filter.length !== STATUSES.length} onClick={() => setFilterOpen((o) => !o)}>
              <Icon icon={untitled(FilterLines)} size={16} />
              Filter
            </ToolbarButton>
            {filterOpen && (
              <div className="absolute top-10 right-0 z-30 flex w-44 flex-col gap-1 rounded-[10px] border border-[#EDEDF0] bg-white p-2 shadow-[0_14px_30px_0_rgba(16,29,55,0.12)]">
                {STATUSES.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[#F8F9FC]">
                    <input
                      type="checkbox"
                      checked={filter.includes(s)}
                      onChange={() =>
                        setFilter((f) => (f.includes(s) ? f.filter((x) => x !== s) : [...f, s]))
                      }
                      className="accent-blue"
                    />
                    <StatusPill status={s} />
                  </label>
                ))}
              </div>
            )}
          </div>
          <label className="flex h-[33px] w-[228px] items-center gap-2 rounded-md border border-[#EDEDF0] bg-[#FAFAFA] px-3">
            <Icon icon={untitled(SearchMd)} size={16} className="shrink-0 text-body" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="w-full min-w-0 bg-transparent text-sm leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
            />
          </label>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-[33px] items-center gap-[4.83px] rounded-[8.06px] bg-blue px-[9.67px] py-[6.44px] text-xs leading-[1.5] font-semibold tracking-[-0.02em] text-white"
          >
            <Icon icon={huge(Add01Icon)} size={14} stroke={1.3} />
            Add Event
          </button>
        </div>
      </div>

      {view === "kanban" ? (
        <Kanban events={visible} onMove={(id, status) => update((l) => l.map((e) => (e.id === id ? { ...e, status } : e)))} />
      ) : (
        <MonthView
          year={ym.y}
          month={ym.m}
          events={visible}
          selected={selected}
          onSelect={setSelected}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
      )}

      {adding && (
        <AddEventDialog
          defaultDate={selected}
          onClose={() => setAdding(false)}
          onAdd={(ev) => {
            update((l) => [...l, { ...ev, id: `e${Date.now()}` }]);
            setAdding(false);
            const d = toDate(ev.start);
            setYm({ y: d.getFullYear(), m: d.getMonth() });
          }}
        />
      )}
    </section>
  );
}
