"use client";

import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { MessageTextSquare02 } from "@untitledui/icons";
import Icon, { untitled } from "@/components/dashboard/Icon";

/**
 * Figma section heading row: heading text + 19px comment icon on the right (gap 10).
 * The icon shows on numbered sections (as in Figma) and on hover for the others.
 * Clicking it selects the heading and dispatches "workspace:comment-section".
 */
export default function HeadingView({ node, editor, getPos }: NodeViewProps) {
  const level = node.attrs.level as number;
  const Tag = (`h${level}` as "h1" | "h2" | "h3");
  const numbered = /^\d+\./.test(node.textContent);

  const comment = () => {
    const pos = typeof getPos === "function" ? getPos() : undefined;
    if (pos == null) return;
    editor
      .chain()
      .focus()
      .setTextSelection({ from: pos + 1, to: pos + 1 + node.content.size })
      .run();
    window.dispatchEvent(new CustomEvent("workspace:comment-section"));
  };

  return (
    <NodeViewWrapper className="group/heading flex items-center justify-between gap-2.5">
      <NodeViewContent as={Tag as unknown as "div"} className="min-w-0 flex-1" />
      {level === 2 && (
        <button
          type="button"
          contentEditable={false}
          onClick={comment}
          aria-label="Comment on this section"
          className={`flex size-[19px] shrink-0 items-center justify-center text-body transition-opacity hover:text-blue ${
            numbered ? "opacity-100" : "opacity-0 group-hover/heading:opacity-100"
          }`}
        >
          <Icon icon={untitled(MessageTextSquare02)} size={16} stroke={1.2} />
        </button>
      )}
    </NodeViewWrapper>
  );
}
