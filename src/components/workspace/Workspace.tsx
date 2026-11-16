"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import ImageExt from "@tiptap/extension-image";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { Placeholder } from "@tiptap/extensions";
import {
  File02,
  MessageTextSquare02,
  PresentationChart01,
} from "@untitledui/icons";
import { Add01Icon, BinocularsIcon } from "@hugeicons/core-free-icons";
import Icon, { huge, untitled, type AnyIcon } from "@/components/dashboard/Icon";
import Toolbar from "./Toolbar";
import CommentsPanel from "./CommentsPanel";
import { CommentMark, DocParagraph, SectionHeading, findCommentRange } from "./extensions";
import {
  CURRENT_USER,
  INITIAL_COMMENTS,
  INITIAL_DOC,
  type Comment,
} from "@/lib/workspaceDoc";

type Saved = { html: string; comments: Comment[] };

const load = (key: string): Saved | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
};
const save = (key: string, data: Saved) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* storage unavailable – keep working in memory */
  }
};

const now = () =>
  `Today, ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }).replace(":", ".")}`;

/* Figma right rail: 50 wide, #101D37; buttons 32 x 32, radius 6, active #285CE0 */
const RAIL: { id: string; label: string; icon: AnyIcon }[] = [
  { id: "comments", label: "Comments", icon: untitled(MessageTextSquare02) },
  { id: "review", label: "Review", icon: huge(BinocularsIcon) },
  { id: "document", label: "Document", icon: untitled(File02) },
  { id: "present", label: "Present", icon: untitled(PresentationChart01) },
];

export default function Workspace({ storageKey }: { storageKey: string }) {
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
  const [activeId, setActiveId] = useState<string | null>("c2");
  const [draftQuote, setDraftQuote] = useState<string | null>(null);
  const [panel, setPanel] = useState<string>("comments");
  const [saved, setSaved] = useState<"saved" | "saving">("saved");
  const pendingRange = useRef<{ from: number; to: number } | null>(null);
  const loaded = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        paragraph: false,
        link: { openOnClick: false, autolink: true },
      }),
      DocParagraph,
      SectionHeading.configure({ levels: [1, 2, 3] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageExt.configure({ allowBase64: true }),
      TextStyle,
      FontSize,
      Placeholder.configure({ placeholder: "Start writing…" }),
      CommentMark,
    ],
    content: INITIAL_DOC,
    editorProps: { attributes: { class: "doc-editor", spellcheck: "true" } },
  });

  /* Load saved document + comments once the editor exists */
  useEffect(() => {
    if (!editor || loaded.current) return;
    loaded.current = true;
    const data = load(storageKey);
    if (data) {
      editor.commands.setContent(data.html, { emitUpdate: false });
      setComments(data.comments);
    }
  }, [editor, storageKey]);

  /* Autosave (debounced) */
  const persist = useCallback(
    (list: Comment[]) => {
      if (!editor) return;
      save(storageKey, { html: editor.getHTML(), comments: list });
      setSaved("saved");
    },
    [editor, storageKey],
  );

  useEffect(() => {
    if (!editor) return;
    let t: ReturnType<typeof setTimeout>;
    const onUpdate = () => {
      setSaved("saving");
      clearTimeout(t);
      t = setTimeout(() => persist(comments), 600);
    };
    const onSelection = () => {
      const mark = editor.getAttributes("comment");
      if (mark.commentId) setActiveId(mark.commentId as string);
    };
    editor.on("update", onUpdate);
    editor.on("selectionUpdate", onSelection);
    return () => {
      clearTimeout(t);
      editor.off("update", onUpdate);
      editor.off("selectionUpdate", onSelection);
    };
  }, [editor, comments, persist]);

  const updateComments = (fn: (c: Comment[]) => Comment[]) =>
    setComments((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });

  const startNew = useCallback(() => {
    if (!editor) return;
    setPanel("comments");
    const { from, to, empty } = editor.state.selection;
    if (empty) {
      pendingRange.current = null;
      setDraftQuote("");
      return;
    }
    pendingRange.current = { from, to };
    setDraftQuote(editor.state.doc.textBetween(from, to, " "));
  }, [editor]);

  /* "comment on section" buttons inside headings */
  useEffect(() => {
    const h = () => startNew();
    window.addEventListener("workspace:comment-section", h);
    return () => window.removeEventListener("workspace:comment-section", h);
  }, [startNew]);

  /* Keep the composer quote in sync if the user selects text after clicking "New" */
  useEffect(() => {
    if (!editor || draftQuote !== "") return;
    const onSel = () => {
      const { from, to, empty } = editor.state.selection;
      if (empty) return;
      pendingRange.current = { from, to };
      setDraftQuote(editor.state.doc.textBetween(from, to, " "));
    };
    editor.on("selectionUpdate", onSel);
    return () => {
      editor.off("selectionUpdate", onSel);
    };
  }, [editor, draftQuote]);

  const create = (body: string) => {
    if (!editor || !pendingRange.current) return;
    const id = `c${Date.now()}`;
    const { from, to } = pendingRange.current;
    editor.chain().focus().setTextSelection({ from, to }).setMark("comment", { commentId: id }).run();
    updateComments((c) => [
      {
        id,
        author: CURRENT_USER.name,
        avatar: CURRENT_USER.avatar,
        time: now(),
        quote: draftQuote || "",
        body,
        replies: [],
        resolved: false,
      },
      ...c,
    ]);
    setActiveId(id);
    setDraftQuote(null);
    pendingRange.current = null;
  };

  const focusComment = (id: string) => {
    setActiveId(id);
    if (!editor) return;
    const range = findCommentRange(editor, id);
    if (!range) return;
    editor.chain().focus().setTextSelection(range).scrollIntoView().run();
  };

  const reply = (id: string, body: string) =>
    updateComments((list) =>
      list.map((c) =>
        c.id === id
          ? {
              ...c,
              replies: [
                ...c.replies,
                { id: `r${Date.now()}`, author: CURRENT_USER.name, avatar: CURRENT_USER.avatar, time: now(), body },
              ],
            }
          : c,
      ),
    );

  const resolve = (id: string) => {
    if (editor) {
      const range = findCommentRange(editor, id);
      if (range) editor.chain().setTextSelection(range).unsetMark("comment").run();
    }
    updateComments((list) => list.map((c) => (c.id === id ? { ...c, resolved: true } : c)));
    if (activeId === id) setActiveId(null);
  };

  const addSection = () =>
    editor
      ?.chain()
      .focus("end")
      .insertContent("<h2>New Section</h2><p></p>")
      .run();

  return (
    <div className="flex min-w-0 flex-1">
      {/* Editor column – Figma 700 wide (475 → 1175) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-end justify-between gap-3 px-4 pt-10 sm:px-6 lg:px-10">
          <h1 className="text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
            Work <span className="text-blue">Package</span>
          </h1>
          <span className="pb-1 text-[10px] leading-[1.5] tracking-[-0.02em] text-body" aria-live="polite">
            {saved === "saving" ? "Saving…" : "All changes saved"}
          </span>
        </div>

        <div className="mt-[31px]">
          <Toolbar editor={editor} />
        </div>

        <div className="flex justify-center px-4 pt-10 pb-16 sm:px-6">
          {/* Figma "A4 - 1": 595 x 842, white, border #EDEDF0, content 515 at (40, 40) */}
          <div className="min-h-[842px] w-full max-w-[595px] border border-[#EDEDF0] bg-white p-6 sm:p-10">
            <EditorContent editor={editor} />
            <button
              type="button"
              onClick={addSection}
              className="mt-[30px] flex items-center gap-1.5 text-xs leading-[1.5] font-medium tracking-[-0.02em] text-blue"
            >
              <Icon icon={huge(Add01Icon)} size={13} stroke={1.1} />
              Add Section
            </button>
          </div>
        </div>
      </div>

      {/* Comments panel + rail (desktop) */}
      <div className="sticky top-16 hidden h-[calc(100dvh-64px)] shrink-0 lg:flex">
        {panel === "comments" && (
          <CommentsPanel
            comments={comments}
            activeId={activeId}
            draftQuote={draftQuote}
            onFocus={focusComment}
            onStartNew={startNew}
            onCancelNew={() => {
              setDraftQuote(null);
              pendingRange.current = null;
            }}
            onCreate={create}
            onReply={reply}
            onResolve={resolve}
          />
        )}
        <nav className="flex w-[50px] flex-col items-center gap-2 border-r border-[#EDEDF0] bg-[#101D37] pt-3">
          {RAIL.map((r) => (
            <button
              key={r.id}
              type="button"
              title={r.label}
              aria-label={r.label}
              aria-pressed={panel === r.id}
              onClick={() => setPanel(panel === r.id ? "" : r.id)}
              className={`flex size-8 items-center justify-center rounded-md ${
                panel === r.id ? "bg-blue text-white" : "text-white/90 hover:bg-white/10"
              }`}
            >
              <Icon icon={r.icon} size={16} stroke={1.3} />
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
