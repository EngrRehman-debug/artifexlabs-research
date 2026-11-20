"use client";

import { useMemo } from "react";
import NotFoundCard from "@/components/dashboard/NotFoundCard";
import { slugFor, toOverview, useCreatedProjects } from "@/lib/createdProjects";
import DeckEditor from "./DeckEditor";

/** Projects made in the New Project chat live in this browser: build their deck here. */
export default function CreatedDeck({ slug }: { slug: string }) {
  const list = useCreatedProjects();
  const index = list.findIndex((p) => slugFor(p) === slug);
  const draft = index >= 0 ? list[index] : undefined;
  const data = useMemo(
    () => (draft ? toOverview(draft, index) : null),
    [draft, index],
  );
  if (!draft || !data) return <NotFoundCard />;
  return <DeckEditor slug={slug} data={data} draft={draft} />;
}
