import ProjectOverview from "@/components/projects/ProjectOverview";
import CreatedProjectOverview from "@/components/projects/CreatedProjectOverview";
import { PROJECTS, STATS, UPCOMING, WORK_PACKAGES, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma "Projects - Overview". Projects created in the chat exist only in the browser,
 *  so unknown slugs are resolved client-side from localStorage. */
export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return <CreatedProjectOverview slug={slug} />;
  return <ProjectOverview project={project} stats={STATS} upcoming={UPCOMING} workPackages={WORK_PACKAGES} />;
}
