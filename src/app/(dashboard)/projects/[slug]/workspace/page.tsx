import { notFound } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import DocEditorLoader from "@/components/workspace/DocEditorLoader";
import { PROJECTS, isProjectSlug } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Projects - Workspace" – Word-style editor (Syncfusion Document Editor). */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isProjectSlug(slug)) notFound();

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
        <DocEditorLoader storageKey={`workspace:${slug}:storage-technology:sfdt`} title="Storage Technologies" />
      </div>
    </div>
  );
}
