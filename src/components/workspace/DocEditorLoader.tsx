"use client";

import dynamic from "next/dynamic";

/* Syncfusion touches `window` on import, so it only loads in the browser. */
const DocEditor = dynamic(() => import("./DocEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center py-20 text-sm text-body">Loading editor…</div>
  ),
});

export default function DocEditorLoader(props: { storageKey: string; title: string }) {
  return <DocEditor {...props} />;
}
