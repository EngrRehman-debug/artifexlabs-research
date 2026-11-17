"use client";

import { useSyncExternalStore } from "react";
import type { Draft } from "./newProject";
import { PROJECTS, type Priority, type Project, type Status } from "./projects";

/* Projects made in the New Project chat live in this browser's localStorage (no backend yet). */
export const CREATED_KEY = "projects:created";
const EVENT = "projects:created-change";

export type CreatedProject = Draft & { id: string; createdAt: string };

export type OverviewData = {
  project: Project;
  stats: { value: number; label: string }[];
  upcoming: { title: string; subtitle: string; start: string; end: string; priority: Priority }[];
  workPackages: { title: string; subtitle: string; owner: string; team: string; status: Status }[];
};

const readRaw = (): string => {
  try {
    return localStorage.getItem(CREATED_KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

const parse = (raw: string): CreatedProject[] => {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((p) => p && typeof p.id === "string" && typeof p.name === "string") : [];
  } catch {
    return [];
  }
};

export function readCreated(): CreatedProject[] {
  return parse(readRaw());
}

export function addCreated(d: Draft): CreatedProject {
  const p: CreatedProject = { ...d, id: `p${Date.now()}`, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(CREATED_KEY, JSON.stringify([...readCreated(), p]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage full or blocked */
  }
  return p;
}

export const slugFor = (p: Pick<CreatedProject, "id">) => `new-${p.id}`;

export function toProject(p: CreatedProject, index: number): Project {
  const words = p.name.trim().split(/\s+/);
  return {
    slug: slugFor(p),
    name: p.name,
    title: words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [words[0] ?? "", ""],
    code: `P-${String(13 + index).padStart(3, "0")}`,
    lead: p.lead || "Not assigned",
    workPackages: p.workstreams.length,
    progress: 0,
    status: "Pending",
  };
}

const fmt = (iso: string) =>
  iso ? new Date(iso + "T00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "TBD";
const PRIORITY: Record<string, Priority> = { Critical: "High", High: "High", Normal: "Medium" };

/** Overview page content built from what the user answered in the chat. */
export function toOverview(p: CreatedProject, index: number): OverviewData {
  const project = toProject(p, index);
  const priority = PRIORITY[p.priority] ?? "Medium";
  return {
    project,
    stats: [
      { value: p.workstreams.length, label: "Work Packages" },
      { value: p.gates.length, label: "Decision Gates" },
      { value: p.risks.filter((r) => r.risk.trim()).length, label: "Risks" },
      { value: p.departments.length, label: "Departments" },
    ],
    upcoming: p.gates
      .filter((g) => g.name.trim())
      .map((g) => ({
        title: g.name,
        subtitle: `${p.name} · Approver: ${g.approver || "Not assigned"}`,
        start: fmt(p.start),
        end: fmt(g.date),
        priority,
      })),
    workPackages: p.workstreams.map((w) => ({
      title: w.name || "Untitled workstream",
      subtitle: w.output || w.department,
      owner: w.owner || "Not assigned",
      team: w.team || w.department,
      status: "Pending",
    })),
  };
}

/* ---- live list for client components (updates after a create, also across tabs) ---- */
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};

/** Raw JSON string keeps the snapshot stable between renders. */
function useCreatedRaw() {
  return useSyncExternalStore(subscribe, readRaw, () => "[]");
}

export function useCreatedProjects(): CreatedProject[] {
  const raw = useCreatedRaw();
  // parse is cheap; the list is small
  return parse(raw);
}

/** Sample projects followed by the ones created in this browser. */
export function useAllProjects(): Project[] {
  return [...PROJECTS, ...useCreatedProjects().map(toProject)];
}
