import type { ReactNode } from "react";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel, {
  type ProjectPage,
} from "@/components/dashboard/ProjectsPanel";

/** Shared layout of the project screens: projects panel, top bar, two-tone page title. */
export default function ProjectShell({
  slug,
  page,
  crumb,
  title,
  showWorkPackages,
  newLabel = "New Research Study",
  children,
}: {
  slug: string;
  page: ProjectPage;
  crumb: string;
  /** page heading; wrap the highlighted words in <span className="text-blue"> */
  title: ReactNode;
  showWorkPackages?: boolean;
  /** label of the "+ New …" link under the projects list (differs per Figma frame) */
  newLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel
        activeSlug={slug}
        newLabel={newLabel}
        showWorkPackages={showWorkPackages}
        activePage={page}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          current={crumb}
          trail={[{ label: "Projects", href: "/projects" }]}
        />
        <main className="flex flex-col gap-5 px-4 pt-10 pb-16 sm:px-6 lg:px-10">
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
            {title}
          </h1>
          {children}
        </main>
      </div>
    </div>
  );
}
