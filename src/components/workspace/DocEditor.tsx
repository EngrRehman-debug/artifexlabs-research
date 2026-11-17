"use client";

import "@syncfusion/ej2-tailwind3-theme/styles/document-editor-container/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { registerLicense } from "@syncfusion/ej2-base";
import {
  DocumentEditorContainerComponent,
  Ribbon,
  Toolbar,
  type CommentElementBox,
  type DocumentEditor,
} from "@syncfusion/ej2-react-documenteditor";
import { File02, MessageTextSquare02, PresentationChart01 } from "@untitledui/icons";
import { BinocularsIcon } from "@hugeicons/core-free-icons";
import Icon, { huge, untitled, type AnyIcon } from "@/components/dashboard/Icon";
import CommentsPanel from "./CommentsPanel";
import { INITIAL_SFDT } from "@/lib/workspaceSfdt";
import { CURRENT_USER, type Comment } from "@/lib/workspaceDoc";

DocumentEditorContainerComponent.Inject(Toolbar, Ribbon);

/* Free Syncfusion Community License key goes in .env.local as NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY.
 * Without it the editor still works but shows Syncfusion's license notice. */
const LICENSE = process.env.NEXT_PUBLIC_SYNCFUSION_LICENSE_KEY;
if (LICENSE) registerLicense(LICENSE);

const AVATARS: Record<string, string> = {
  "Ibrahim Ghatila": "/images/avatar-ibrahim.png",
  "Omar Patel": "/images/avatar-omar.png",
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false; // storage full or blocked – keep editing in memory
  }
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
  const today = new Date().toDateString() === d.toDateString();
  return `${today ? "Today" : d.toLocaleDateString([], { day: "numeric", month: "short" })}, ${time}`;
};

/* Figma right rail: 50 wide, #101D37; buttons 32 x 32, radius 6, active #285CE0 */
const RAIL: { id: "comments" | "review" | "document" | "present"; label: string; icon: AnyIcon }[] = [
  { id: "comments", label: "Comments", icon: untitled(MessageTextSquare02) },
  { id: "review", label: "Track changes", icon: huge(BinocularsIcon) },
  { id: "document", label: "Formatting pane", icon: untitled(File02) },
  { id: "present", label: "Read-only view", icon: untitled(PresentationChart01) },
];

/** Word-style document editor (Syncfusion, runs fully in the browser – no server)
 *  with the Figma comments panel + dark rail instead of Syncfusion's own comment pane. */
export default function DocEditor({ storageKey, title }: { storageKey: string; title: string }) {
  const ref = useRef<DocumentEditorContainerComponent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = useRef(false);
  const quotes = useRef<Record<string, string>>({});
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draftQuote, setDraftQuote] = useState<string | null>(null);
  const draftRef = useRef<string | null>(null);
  const [panel, setPanel] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [props, setProps] = useState(false);
  const [readOnly, setReadOnly] = useState(false);

  const de = (): DocumentEditor | null => ref.current?.documentEditor ?? null;
  const boxes = (): CommentElementBox[] => de()?.documentHelper.comments ?? [];
  const findBox = (id: string) => boxes().find((b) => b.commentId === id);

  /* keep Syncfusion's own comment pane closed – the Figma panel replaces it */
  const hidePane = () => {
    const e = de();
    if (e && e.showComments) e.showComments = false;
  };

  const sync = useCallback(() => {
    setComments(
      boxes().map((b) => ({
        id: b.commentId,
        author: b.author,
        avatar: AVATARS[b.author] ?? "",
        time: fmtTime(b.date),
        quote: quotes.current[b.commentId] ?? "",
        body: b.text,
        resolved: b.isResolved,
        replies: b.replyComments.map((r) => ({
          id: r.commentId,
          author: r.author,
          avatar: AVATARS[r.author] ?? "",
          time: fmtTime(r.date),
          body: r.text,
        })),
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* text each comment is anchored to – read once by selecting the range */
  const readQuotes = () => {
    const e = de();
    if (!e) return;
    for (const b of boxes()) {
      try {
        e.selection.selectComment(b);
        quotes.current[b.commentId] = e.selection.text.trim();
      } catch {
        /* comment without a range */
      }
    }
    e.selection.moveToDocumentStart();
    hidePane();
  };

  const scheduleSave = () => {
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const e = de();
      if (!e) return;
      setStatus(write(storageKey, e.serialize()) ? "saved" : "unsaved");
    }, 700);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onCreated = () => {
    const c = ref.current;
    if (!c) return;
    const saved = read(storageKey);
    try {
      c.documentEditor.open(saved || INITIAL_SFDT);
    } catch {
      c.documentEditor.open(INITIAL_SFDT); // corrupt saved copy – start from the template
    }
    c.documentEditor.documentName = title;
    c.ribbon?.showTab("Developer", false);    readQuotes();
    sync();
    setActiveId(boxes().find((b) => !b.isResolved)?.commentId ?? null);
    ready.current = true;
  };

  const onChange = () => {
    if (!ready.current) return;
    hidePane();
    sync();
    scheduleSave();
  };

  /* while composing a comment, the quote follows the user's selection */
  const onSelection = () => {
    const e = de();
    if (!e || draftRef.current === null) return;
    const t = e.selection.text.trim();
    if (t) {
      draftRef.current = t;
      setDraftQuote(t);
    }
  };

  const startNew = () => {
    setPanel(true);
    const t = de()?.selection.text.trim() ?? "";
    draftRef.current = t;
    setDraftQuote(t);
  };

  const cancelNew = () => {
    draftRef.current = null;
    setDraftQuote(null);
  };

  const create = (body: string) => {
    const e = de();
    if (!e || !e.selection.text.trim()) return;
    const before = new Set(boxes().map((b) => b.commentId));
    const quote = e.selection.text.trim();
    e.editor.insertComment(body, { author: CURRENT_USER.name, dateTime: new Date() });
    const added = boxes().find((b) => !before.has(b.commentId));
    if (added) {
      quotes.current[added.commentId] = quote;
      setActiveId(added.commentId);
    }
    hidePane();
    cancelNew();
    sync();
    scheduleSave();
  };

  const reply = (id: string, body: string) => {
    const e = de();
    const b = findBox(id);
    if (!e || !b) return;
    e.editor.replyComment(b, body);
    hidePane();
    sync();
    scheduleSave();
  };

  const resolve = (id: string) => {
    const e = de();
    const b = findBox(id);
    if (!e || !b) return;
    e.editor.resolveComment(b);
    hidePane();
    if (activeId === id) setActiveId(null);
    sync();
    scheduleSave();
  };

  const focusComment = (id: string) => {
    setActiveId(id);
    const e = de();
    const b = findBox(id);
    if (!e || !b) return;
    e.selection.selectComment(b);
    hidePane();
  };

  const rail = (id: (typeof RAIL)[number]["id"]) => {
    const c = ref.current;
    if (!c) return;
    if (id === "comments") setPanel((v) => !v);
    if (id === "review") {
      c.enableTrackChanges = !tracking;
      setTracking(!tracking);
    }
    if (id === "document") {
      c.showPropertiesPane = !props;
      setProps(!props);
    }
    if (id === "present") {
      c.restrictEditing = !readOnly;
      setReadOnly(!readOnly);
    }
  };
  const railOn = { comments: panel, review: tracking, document: props, present: readOnly };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-end justify-between gap-3 px-4 pt-6 pb-4 sm:px-6 lg:px-10">
        <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
          Work <span className="text-blue">Package</span>
        </h1>
        <span className="pb-1 text-[10px] leading-[1.5] tracking-[-0.02em] text-body" aria-live="polite">
          {readOnly && "Read-only · "}
          {tracking && "Tracking changes · "}
          {status === "saving" ? "Saving…" : status === "unsaved" ? "Couldn't save – storage full" : "All changes saved"}
        </span>
      </div>
      {/* the editor needs a fixed height: viewport minus top bar (64) and title row */}
      <div className="flex h-[calc(100dvh-140px)] min-h-[560px] border-t border-[#EDEDF0]">
        <div className="doc-editor-host min-w-0 flex-1">
          <DocumentEditorContainerComponent
            ref={ref}
            height="100%"
            toolbarMode="Ribbon"
            ribbonLayout="Classic"
            fileMenuItems={["New", "Export", "Print"]}
            enableToolbar
            showPropertiesPane={false}
            enableComment
            currentUser={CURRENT_USER.name}
            created={onCreated}
            contentChange={onChange}
            selectionChange={onSelection}
          />
        </div>
        <div className="hidden shrink-0 lg:flex">
          {panel && (
            <CommentsPanel
              comments={comments}
              activeId={activeId}
              draftQuote={draftQuote}
              onFocus={focusComment}
              onStartNew={startNew}
              onCancelNew={cancelNew}
              onCreate={create}
              onReply={reply}
              onResolve={resolve}
            />
          )}
          <nav className="flex w-[50px] flex-col items-center gap-2 bg-[#101D37] pt-3">
            {RAIL.map((r) => (
              <button
                key={r.id}
                type="button"
                title={r.label}
                aria-label={r.label}
                aria-pressed={railOn[r.id]}
                onClick={() => rail(r.id)}
                className={`flex size-8 items-center justify-center rounded-md ${
                  railOn[r.id] ? "bg-blue text-white" : "text-white/90 hover:bg-white/10"
                }`}
              >
                <Icon icon={r.icon} size={16} stroke={1.3} />
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
