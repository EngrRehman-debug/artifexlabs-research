import { notFound } from "next/navigation";
import DeckEditor from "@/components/report/DeckEditor";
import CreatedDeck from "@/components/report/CreatedDeck";
import {
  PROJECTS,
  STATS,
  UPCOMING,
  WORK_PACKAGES,
  getProject,
  isProjectSlug,
} from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** "Final Research Case": slides built from the project, editable, exported as PDF. */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isProjectSlug(slug)) notFound();
  const project = getProject(slug);
  if (!project) return <CreatedDeck slug={slug} />;
  return (
    <DeckEditor
      slug={slug}
      data={{
        project,
        stats: STATS,
        upcoming: UPCOMING,
        workPackages: WORK_PACKAGES,
      }}
    />
  );
}
