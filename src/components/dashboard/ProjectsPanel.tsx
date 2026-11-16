"use client";

import Link from "next/link";
import { useState } from "react";
import { Folder } from "@untitledui/icons";
import {
  Add01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "./Icon";
import { PANEL_WORK_PACKAGES, PROJECTS } from "@/lib/projects";

/**
 * Figma "Group 3": secondary panel, 215 wide, white, right border #EDEDF0.
 *  - "Total Projects" Inter 600 16 #101D37 + count #285CE0, top 20
 *  - search 183 x 40, radius 6, #FAFAFA, top 82
 *  - project list (Inter 12, #667085, gap 20) at top 142; active item 600 #101D37
 *  - "+ New …" link Inter 500 12 #285CE0
 *  - Overview frame only: "Work Packages" section (Inter 600 16) with sub items
 */
const WP_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "workspace", label: "Workspace" },
  { key: "evidence", label: "Evidence" },
  { key: "findings", label: "Findings" },
  { key: "reviews", label: "Reviews & Decisions" },
  { key: "reports", label: "Reports" },
] as const;

export default function ProjectsPanel({
  activeSlug,
  newLabel = "New Research Study",
  showWorkPackages = false,
  activeSection,
}: {
  activeSlug?: string;
  newLabel?: string;
  showWorkPackages?: boolean;
  /** Workspace frame: expands "Storage Technology" with its sections */
  activeSection?: "overview" | "workspace";
}) {
  const [query, setQuery] = useState("");
  const list = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <aside className="sticky top-0 hidden h-dvh w-[215px] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-[#EDEDF0] bg-white px-4 xl:flex">
      <div className="flex h-16 shrink-0 items-start justify-between pt-5">
        <h2 className="text-base leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
          Total Projects
        </h2>
        <span className="pr-0.5 text-base leading-[1.5] font-semibold tracking-[-0.02em] text-blue">
          {PROJECTS.length}
        </span>
      </div>

      <label className="mt-[18px] flex h-10 w-[183px] shrink-0 items-center gap-2 rounded-md border border-[#EDEDF0] bg-[#FAFAFA] px-3 py-2.5">
        <Icon icon={huge(Search01Icon)} size={14} stroke={1.2} className="shrink-0 text-[#101D37]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a project"
          className="w-full min-w-0 bg-transparent text-xs leading-[1.5] tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
        />
      </label>

      <ul className="mt-5 flex w-[186px] flex-col gap-5">
        {list.map((p) => {
          const active = p.slug === activeSlug;
          return (
            <li key={p.slug}>
              <Link
                href={`/projects/${p.slug}`}
                className={`flex items-center gap-2 text-xs leading-[1.5] tracking-[-0.02em] hover:text-[#101D37] ${
                  active ? "font-semibold text-[#101D37]" : "text-body"
                }`}
              >
                <Icon icon={untitled(Folder)} size={13} stroke={1.1} className="shrink-0" />
                <span className="truncate">{p.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/projects/new"
        className="mt-[17px] flex items-center gap-2 text-xs leading-[1.5] font-medium tracking-[-0.02em] text-blue"
      >
        <Icon icon={huge(Add01Icon)} size={13} stroke={1.1} />
        {newLabel}
      </Link>

      {showWorkPackages && (
        <div className="mt-5 -mx-4 flex flex-col border-t border-[#EDEDF0] px-4 pt-5 pb-6">
          <h3 className="text-base leading-[1.5] font-semibold tracking-[-0.02em] text-[#101D37]">
            Work Packages
          </h3>
          <ul className="mt-5 flex w-[186px] flex-col gap-[10px]">
            {PANEL_WORK_PACKAGES.map((wp, i) => (
              <li key={wp}>
                <Link
                  href={i === 0 && activeSlug ? `/projects/${activeSlug}/workspace` : "#"}
                  className="flex items-center gap-2 text-xs leading-[1.5] tracking-[-0.02em] text-body hover:text-[#101D37]"
                >
                  <Icon icon={untitled(Folder)} size={13} stroke={1.1} className="shrink-0" />
                  <span className="truncate">{wp}</span>
                </Link>
                {/* Figma Frame 2147232168: 164 wide at x 298, gap 10, dividers */}
                {i === 0 && activeSection && activeSlug && (
                  <ul className="mt-[10px] ml-[22px] flex w-[164px] flex-col gap-[10px]">
                    {WP_SECTIONS.map((sec, j) => {
                      const href =
                        sec.key === "overview"
                          ? `/projects/${activeSlug}`
                          : sec.key === "workspace"
                            ? `/projects/${activeSlug}/workspace`
                            : "#";
                      const on = sec.key === activeSection;
                      return (
                        <li key={sec.key} className="flex flex-col gap-[10px]">
                          {j > 0 && <div className="h-px w-full bg-[#EDEDF0]" />}
                          <Link
                            href={href}
                            className={`text-xs leading-[1.5] tracking-[-0.02em] hover:text-[#101D37] ${
                              on ? "font-semibold text-[#101D37]" : "text-body"
                            }`}
                          >
                            {sec.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <Link
            href="/projects/new"
            className="mt-[17px] flex items-center gap-2 text-xs leading-[1.5] font-medium tracking-[-0.02em] text-blue"
          >
            <Icon icon={huge(Add01Icon)} size={13} stroke={1.1} />
            New Research Study
          </Link>
          <Link
            href={activeSlug ? `/projects/${activeSlug}/timeline` : "#"}
            className="mt-[14px] flex items-center gap-2 text-xs leading-[1.5] font-medium tracking-[-0.02em] text-body hover:text-[#101D37]"
          >
            <Icon icon={huge(UserGroupIcon)} size={13} stroke={1.1} />
            Teams &amp; Timeline
          </Link>
        </div>
      )}
    </aside>
  );
}
