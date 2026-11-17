import { notFound } from "next/navigation";
import { SearchList01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { huge } from "@/components/dashboard/Icon";
import ProjectShell from "@/components/projects/ProjectShell";
import DetailRows, { SectionTitle } from "@/components/projects/DetailRows";
import ReviewChecker from "@/components/projects/ReviewChecker";
import { PROJECTS, isProjectSlug } from "@/lib/projects";
import { BASELINE_SUMMARY } from "@/lib/projectScreens";

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

/** Figma frame "Project Baseline & Approvals". */
export default async function BaselinePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isProjectSlug(slug)) notFound();

  /* Decision Record: the approved baselines of the projects (Figma lists the sample projects) */
  const decisions = PROJECTS.slice(0, 3).map((p) => ({ title: p.name, href: `/projects/${p.slug}` }));

  return (
    <ProjectShell
      slug={slug}
      page="baseline"
      crumb="Project Baseline & Approvals"
      title={
        <>
          Project <span className="text-blue">Baseline &amp; Approvals</span>
        </>
      }
    >
      <section className="flex w-full max-w-[885px] flex-col gap-6 rounded-[20px] border border-[#EDEDF0] bg-[#FAFAFA] p-5">
        <div className="grid gap-[19px] md:grid-cols-2">
          <div className="flex flex-col gap-2.5">
            <SectionTitle>Baseline Summary</SectionTitle>
            <DetailRows items={BASELINE_SUMMARY} icon={huge(SearchList01Icon)} />
          </div>
          <div className="flex flex-col gap-2.5">
            <SectionTitle>Decision Record</SectionTitle>
            <DetailRows items={decisions} icon={huge(Tick02Icon)} />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionTitle>Review Checker</SectionTitle>
          <ReviewChecker storageKey={`baseline:${slug}:decisions`} />
        </div>
      </section>
    </ProjectShell>
  );
}
