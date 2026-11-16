import { Mark, mergeAttributes, type Editor } from "@tiptap/core";
import Heading from "@tiptap/extension-heading";
import { Paragraph } from "@tiptap/extension-paragraph";
import { ReactNodeViewRenderer } from "@tiptap/react";
import HeadingView from "./HeadingView";

/** Inline mark that anchors a comment thread to a range of text. */
export const CommentMark = Mark.create({
  name: "comment",
  inclusive: false,
  excludes: "",
  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-comment-id"),
        renderHTML: (attrs) => ({ "data-comment-id": attrs.commentId }),
      },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-comment-id]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "doc-comment" }), 0];
  },
});

/** Headings with a React node view (adds the Figma "comment on section" button). */
export const SectionHeading = Heading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(HeadingView);
  },
});

/** Paragraph that keeps the Figma subtitle style under the document title. */
export const DocParagraph = Paragraph.extend({
  addAttributes() {
    return {
      subtitle: {
        default: false,
        parseHTML: (el) => el.getAttribute("data-subtitle") === "true",
        renderHTML: (attrs) => (attrs.subtitle ? { "data-subtitle": "true" } : {}),
      },
    };
  },
});

/** Find the document range covered by a comment mark. */
export function findCommentRange(editor: Editor, id: string) {
  let from = -1;
  let to = -1;
  editor.state.doc.descendants((node, pos) => {
    if (!node.isText) return;
    if (node.marks.some((m) => m.type.name === "comment" && m.attrs.commentId === id)) {
      if (from === -1) from = pos;
      to = pos + node.nodeSize;
    }
  });
  return from === -1 ? null : { from, to };
}
