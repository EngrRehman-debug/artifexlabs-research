"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";
import NewProjectFlow from "@/components/newproject/NewProjectFlow";

/**
 * Figma "New Projects" + "New Projects Generating Process":
 * the prompt card starts a chat that asks every project field one question at a time
 * (fields from the reference wizard: Charter → Organization → Delivery → Controls → Review).
 * During the chat the projects panel gives way to a live "Project draft" preview.
 */
export default function NewProjectPage() {
  const [phase, setPhase] = useState<"prompt" | "chat" | "done">("prompt");
  const chatting = phase === "chat";

  return (
    <div className="flex min-w-0 flex-1">
      {!chatting && <ProjectsPanel />}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar current="New Projects" trail={[{ label: "Projects", href: "/projects" }]} />
        {/* one stable element so the flow keeps its state when the layout changes */}
        <main className={chatting ? "flex min-w-0 flex-1" : "flex justify-center px-4 pt-10 pb-16 sm:px-6 lg:px-10"}>
          <NewProjectFlow onPhase={setPhase} />
        </main>
      </div>
    </div>
  );
}
