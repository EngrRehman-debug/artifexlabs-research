import { notFound } from "next/navigation";
import ProjectShell from "@/components/projects/ProjectShell";
import TeamTable from "@/components/projects/TeamTable";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Projects - Hydrogen Energy Feasibility - Project Teams". */
export default async function TeamsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();

  return (
    <ProjectShell
      slug={slug}
      page="teams"
      crumb="Project Teams"
      title={
        <>
          Project <span className="text-blue">Teams</span>
        </>
      }
    >
      <TeamTable storageKey={`teams:${slug}:members`} />
    </ProjectShell>
  );
}
