import { notFound } from "next/navigation";
import ProjectShell from "@/components/projects/ProjectShell";
import ProjectChat from "@/components/projects/ProjectChat";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Projects - Hydrogen Energy Feasibility - Project Chats". */
export default async function ChatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();

  return (
    <ProjectShell slug={slug} page="chats" crumb="Chats" title="Project Chats" showWorkPackages>
      <ProjectChat storageKey={`chats:${slug}:messages`} />
    </ProjectShell>
  );
}
