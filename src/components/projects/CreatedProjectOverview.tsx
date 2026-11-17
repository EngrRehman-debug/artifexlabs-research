"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import ProjectOverview from "./ProjectOverview";
import { slugFor, toOverview, useCreatedProjects } from "@/lib/createdProjects";

const noop = () => () => {};

/** Overview for a project created in the New Project chat (stored in this browser). */
export default function CreatedProjectOverview({ slug }: { slug: string }) {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const created = useCreatedProjects();
  if (!hydrated) return <div className="flex-1" />;

  const index = created.findIndex((p) => slugFor(p) === slug);
  if (index < 0)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-[#101D37]">Project not found</h1>
        <p className="max-w-sm text-sm text-body">
          It may have been created in another browser. Projects made in the New Project chat are saved only in the
          browser where they were created.
        </p>
        <Link href="/projects" className="mt-2 flex h-9 items-center rounded-[10px] bg-blue px-4 text-sm font-semibold text-white">
          Back to Projects
        </Link>
      </div>
    );

  return <ProjectOverview {...toOverview(created[index], index)} />;
}
