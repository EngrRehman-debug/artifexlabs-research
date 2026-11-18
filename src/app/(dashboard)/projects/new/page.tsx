"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import NewProjectFlow from "@/components/newproject/NewProjectFlow";

/**
 * Figma "New Projects" (prompt card) → "Create New Project" onboarding:
 * a 5-step stepper (Charter → Organization → Delivery → Controls → Review) above a
 * conversation card where the AI drafts each part of the project for the user to confirm.
 */
export default function NewProjectPage() {
  const [phase, setPhase] = useState<"prompt" | "chat" | "done">("prompt");

  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel newLabel="New Project" />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar current="New Projects" trail={[{ label: "Projects", href: "/projects" }]} />
        {/* one stable element so the flow keeps its state when the layout changes */}
        <main
          className={
            phase === "chat"
              ? "flex min-w-0 flex-1 flex-col px-4 pt-10 pb-14 sm:px-6 lg:px-10"
              : "flex justify-center px-4 pt-10 pb-16 sm:px-6 lg:px-10"
          }
        >
          <NewProjectFlow onPhase={setPhase} />
        </main>
      </div>
    </div>
  );
}
