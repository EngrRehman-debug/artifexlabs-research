import Image from "next/image";
import Link from "next/link";
import { Folder, Rows01 } from "@untitledui/icons";
import {
  ArrowUpRight01Icon,
  Calendar03Icon,
  Clock01Icon,
  FlashIcon,
  File02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import { StatusBadge } from "@/components/dashboard/ProjectUi";
import type { Priority } from "@/lib/projects";
import type { OverviewData } from "@/lib/createdProjects";

/* Figma priority chips: 28 high, radius 8, padding 4/6, gap 4, Inter 12 */
const PRIORITY: Record<Priority, string> = {
  High: "bg-[#FF2020]/10 text-[#FF2020]",
  Medium: "bg-[#FDEEEB] text-[#FF6720]",
  Low: "bg-[#2BCB23]/10 text-[#2BCB23]",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-7 items-center gap-1 rounded-lg border border-[#EDEDF0] bg-[#FAFAFA] px-1.5 py-1 text-xs leading-[1.5] tracking-[-0.02em] whitespace-nowrap text-body">
      {children}
    </span>
  );
}

/*
 * Work Packages table – column x-offsets from the row's outer-left edge in Figma:
 * Responsible 530, Status 742. Rows have 18.18px side padding.
 */
// At the Figma width (843px inside the card) the first column resolves to 511.82 / 530.
const ROW_GRID = "grid grid-cols-[minmax(0,1fr)_212px_80.8px] items-center";
const HEAD_GRID = "grid grid-cols-[minmax(0,1fr)_212px_101px] items-center";

/** Figma "Projects - Overview" page. No hooks, so it renders on the server (sample
 *  projects) and in the browser (projects created in the New Project chat). */
export default function ProjectOverview({
  project,
  stats,
  upcoming,
  workPackages,
  extra,
}: OverviewData & {
  /** shown under the stats (AI assessment of created projects) */
  extra?: React.ReactNode;
}) {
  const slug = project.slug;
  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel
        activeSlug={slug}
        newLabel="New Projects"
        showWorkPackages
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          current="Overview"
          trail={[{ label: "Projects", href: "/projects" }]}
        />

        <main className="px-4 pt-10 pb-16 sm:px-6 lg:px-10">
          {/* Figma: Frame 2147232172 – 885 wide at (515, 104), gap 20 */}
          <div className="flex w-full flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
                <span className="text-blue">{project.title[0]}</span>{" "}
                {project.title[1]}
              </h1>
              <Link
                href={`/projects/${slug}/report`}
                title="Open the research case slides and export them as PDF"
                className="flex h-9 items-center gap-1.5 rounded-[10px] bg-blue px-3 text-sm font-semibold text-white"
              >
                <Icon icon={huge(File02Icon)} size={16} stroke={1.6} />
                Research Case
              </Link>
            </div>

            {/* Stats – 4 cards, 212.25 wide, gap 12 */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {stats.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  className="flex flex-col gap-2 rounded-[20px] border border-[#EDEDF0] bg-white px-4 py-[26px] transition-colors hover:border-[#D7DBE3]"
                >
                  <span className="text-2xl leading-[17px] font-semibold tracking-[-0.02em] text-blue">
                    {s.value}
                  </span>
                  <span className="flex items-center justify-between gap-2 text-base leading-[1.5] font-medium tracking-[-0.02em] text-[#101D37]">
                    {s.label}
                    <Icon
                      icon={huge(ArrowUpRight01Icon)}
                      size={20}
                      stroke={1.8}
                      className="shrink-0"
                    />
                  </span>
                </a>
              ))}
            </div>

            {extra}

            {/* Upcoming – #FAFAFA card, radius 20, padding 20, gap 12 */}
            <section className="flex flex-col gap-3 rounded-[20px] border border-[#EDEDF0] bg-[#FAFAFA] p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.02)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]">
                  Upcoming
                </h2>
                <button
                  type="button"
                  className="flex h-[26px] items-center gap-[3.22px] rounded-lg border border-[#EDEDF0] bg-white px-[9.67px] py-[6.44px] text-[11.28px] leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]"
                >
                  <Icon icon={untitled(Rows01)} size={13} stroke={1.1} />
                  View More
                </button>
              </div>

              <ul className="flex flex-col gap-1.5">
                {upcoming.length === 0 && (
                  <li className="rounded-2xl border border-[#EDEDF0] bg-white px-4 py-5 text-sm text-body">
                    Nothing scheduled yet.
                  </li>
                )}
                {upcoming.map((u) => (
                  <li
                    key={u.title}
                    className="flex flex-col gap-3 rounded-2xl border border-[#EDEDF0] bg-white px-4 py-5"
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        icon={untitled(Folder)}
                        size={20}
                        className="mt-0.5 shrink-0 text-[#242C2C]"
                      />
                      <div className="min-w-0">
                        <p className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                          {u.title}
                        </p>
                        <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
                          {u.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="h-px w-full bg-[#EDEDF0]" />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Chip>
                        <Icon
                          icon={huge(Calendar03Icon)}
                          size={14}
                          stroke={1.2}
                        />
                        {u.start}
                      </Chip>
                      <Chip>
                        <Icon icon={huge(Clock01Icon)} size={14} stroke={1.2} />
                        {u.end}
                      </Chip>
                      <Chip>
                        <Image
                          src="/images/attendees.png"
                          alt=""
                          width={385}
                          height={183}
                          className="h-[17.47px] w-auto"
                        />
                        People Involved
                      </Chip>
                      <span
                        className={`flex h-7 items-center gap-1 rounded-lg px-1.5 py-1 text-xs leading-[1.5] tracking-[-0.02em] whitespace-nowrap ${PRIORITY[u.priority]}`}
                      >
                        <Icon icon={huge(FlashIcon)} size={14} stroke={1.2} />
                        {u.priority} Priority
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Work Packages */}
            <section className="flex flex-col gap-3">
              <h2 className="text-xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]">
                Work Packages
              </h2>

              <div className="rounded-[20px] border border-[#EDEDF0] bg-white p-5">
                {/* Mobile list */}
                <ul className="flex flex-col gap-2 md:hidden">
                  {workPackages.map((w) => (
                    <li
                      key={w.title}
                      className="flex flex-col gap-3 rounded-2xl border border-[#EDEDF0] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                          {w.title}
                        </p>
                        <StatusBadge status={w.status} radius={10} />
                      </div>
                      <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
                        {w.owner} · {w.team}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="-mx-5 hidden overflow-x-auto px-5 md:block">
                  <div className="flex min-w-[600px] flex-col gap-[14px]">
                    <div
                      className={`${HEAD_GRID} text-sm leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]`}
                    >
                      <span className="pl-[15.38px]">Work Package</span>
                      <span>Responsible</span>
                      <span>Status</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {workPackages.map((w) => (
                        <div
                          key={w.title}
                          className={`${ROW_GRID} min-h-[60.12px] rounded-2xl border border-[#EDEDF0] bg-white px-[18.18px] py-2.5`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Icon
                              icon={untitled(Folder)}
                              size={20}
                              className="shrink-0 text-[#242C2C]"
                            />
                            <div className="min-w-0">
                              <p className="truncate text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                                {w.title}
                              </p>
                              <p className="truncate text-xs leading-[1.5] tracking-[-0.02em] text-body">
                                {w.subtitle}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                              {w.owner}
                            </p>
                            <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
                              {w.team}
                            </p>
                          </div>
                          <div>
                            <StatusBadge status={w.status} radius={10} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
