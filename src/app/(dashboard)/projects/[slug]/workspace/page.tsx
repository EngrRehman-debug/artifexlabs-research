import { notFound } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import Workspace from "@/components/workspace/Workspace";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Projects - Workspace" (1440 x 1157). */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();

  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel
        activeSlug={slug}
        newLabel="New Projects"
        showWorkPackages
        activeSection="workspace"
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar current="Workspace" trail={[{ label: "Projects", href: "/projects" }]} />
        <Workspace storageKey={`workspace:${slug}:storage-technology`} />
      </div>
    </div>
  );
}
