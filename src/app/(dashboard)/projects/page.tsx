"use client";

import Link from "next/link";
import { FilterLines, Folder } from "@untitledui/icons";
import { Add01Icon } from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import { StageBar, StatusBadge } from "@/components/dashboard/ProjectUi";
import { PROJECTS } from "@/lib/projects";

/*
 * Column x-offsets measured from the row's outer-left edge in Figma:
 * Lead 346.88, Work Package 483, Stage 607, Status 741.82.
 * Rows have 18.18px side padding; at the Figma width the flexible first
 * column resolves to 328.7 (rows) / 346.88 (header).
 */
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_136.12px_124px_134.82px_83px] items-center";
const HEAD_GRID =
  "grid grid-cols-[minmax(0,1fr)_136.12px_124px_134.82px_101.2px] items-center";

export default function ProjectsPage() {
  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar current="Projects" />

        <main className="flex flex-col gap-5 px-4 pt-10 pb-16 sm:px-6 lg:px-10">
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
            Projects
          </h1>

          {/* Card – Figma: 885 wide, radius 20, padding 20, border #EDEDF0 */}
          <section className="flex w-full max-w-[885px] flex-col gap-[6.06px] rounded-[20px] border border-[#EDEDF0] bg-white p-5">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-xl">
                Projects Research Initiatives
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] px-3 py-2 text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]"
                >
                  <Icon icon={untitled(FilterLines)} size={16} />
                  Filter
                </button>
                <Link
                  href="/projects/new"
                  className="flex h-9 items-center gap-1.5 rounded-[10px] bg-blue px-3 py-2 text-sm leading-5 font-semibold tracking-[-0.02em] text-white"
                >
                  <Icon icon={huge(Add01Icon)} size={16} />
                  Add New Project
                </Link>
              </div>
            </div>

            {/* Mobile: stacked cards (not in Figma – desktop-only design) */}
            <ul className="mt-3 flex flex-col gap-2 md:hidden">
              {PROJECTS.map((p) => (
                <li key={p.code}>
                  <Link
                    href={`/projects/${p.slug}`}
                    className="flex flex-col gap-3 rounded-[7.88px] border border-[#EDEDF0] bg-[#FAFAFA] p-4"
                  >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon icon={untitled(Folder)} size={20} className="shrink-0 text-[#242C2C]" />
                      <div className="min-w-0">
                        <p className="text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                          {p.name}
                        </p>
                        <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
                          {p.code}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs leading-[1.5] tracking-[-0.02em] text-body">
                    <span className="whitespace-nowrap">
                      Lead: <span className="text-[#242C2C]">{p.lead}</span>
                    </span>
                    <span className="whitespace-nowrap">
                      WP: <span className="text-[#242C2C]">{p.workPackages}</span>
                    </span>
                    <StageBar value={p.progress} />
                  </div>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="-mx-5 hidden overflow-x-auto px-5 md:block">
              <div className="flex min-w-[760px] flex-col gap-5 pt-[13.94px]">
                {/* Header */}
                <div
                  className={`${HEAD_GRID} text-sm leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37]`}
                >
                  <span className="pl-[15.37px]">Projects</span>
                  <span>Lead</span>
                  <span>Work Package</span>
                  <span>Stage</span>
                  <span>Status</span>
                </div>

                {/* Rows */}
                <div className="flex flex-col gap-2">
                  {PROJECTS.map((p) => (
                    <Link
                      key={p.code}
                      href={`/projects/${p.slug}`}
                      className={`${ROW_GRID} min-h-[59px] rounded-[7.88px] border border-[#EDEDF0] bg-[#FAFAFA] px-[18.18px] py-2.5 transition-colors hover:border-[#D7DBE3]`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon icon={untitled(Folder)} size={20} className="shrink-0 text-[#242C2C]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm leading-[1.5] font-semibold tracking-[-0.02em] text-[#242C2C]">
                            {p.name}
                          </p>
                          <p className="text-xs leading-[1.5] tracking-[-0.02em] text-body">
                            {p.code}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm leading-[1.5] tracking-[-0.02em] text-[#242C2C]">
                        {p.lead}
                      </span>
                      <span className="text-sm leading-[1.5] tracking-[-0.02em] text-[#242C2C]">
                        {p.workPackages}
                      </span>
                      <StageBar value={p.progress} />
                      <div>
                        <StatusBadge status={p.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
