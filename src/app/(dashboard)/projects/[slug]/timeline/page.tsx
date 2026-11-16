import { notFound } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import PlanTimeline from "@/components/timeline/PlanTimeline";
import { PROJECTS, getProject } from "@/lib/projects";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Integrated Plan & Timeline" – title at (515, 104), card at (515, 160). */
export default async function TimelinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!getProject(slug)) notFound();

  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel activeSlug={slug} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          current="Integrated Plan & Timeline"
          trail={[{ label: "Projects", href: "/projects" }]}
        />
        <main className="flex flex-col gap-5 px-4 pt-10 pb-16 sm:px-6 lg:px-10">
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
            Integrated Plan &amp; <span className="text-blue">Timeline</span>
          </h1>
          <PlanTimeline />
        </main>
      </div>
    </div>
  );
}
