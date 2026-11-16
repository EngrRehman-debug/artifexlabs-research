"use client";

import { useRef, useState } from "react";
import { Database01, Send03 } from "@untitledui/icons";
import {
  Add01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  Image02Icon,
  Mic01Icon,
  Pdf02Icon,
} from "@hugeicons/core-free-icons";
import Icon, { huge, untitled } from "@/components/dashboard/Icon";
import TopBar from "@/components/dashboard/TopBar";
import ProjectsPanel from "@/components/dashboard/ProjectsPanel";

/**
 * Figma frame "New Projects" (1440 x 1091).
 * Content: Frame 2147232151 – 885 wide at (515, 104), gap 30.
 * Card: white, radius 20, padding 20, gap 16, shadow 0 14 30 #285CE0 10%.
 * Input: #FAFAFA, radius 14, border #EDEDF0, padding 16; text Inter 16/24 #667085;
 *        attachments row (gap 10) of 60 x 60 tiles, radius 10, border, 30px icon.
 */
export default function NewProjectPage() {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const imageInput = useRef<HTMLInputElement>(null);
  const pdfInput = useRef<HTMLInputElement>(null);

  const addFiles = (list: FileList | null) =>
    list && setFiles((f) => [...f, ...Array.from(list)]);

  return (
    <div className="flex min-w-0 flex-1">
      <ProjectsPanel />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          current="New Projects"
          trail={[{ label: "Projects", href: "/projects" }]}
        />

        <main className="px-4 pt-10 pb-16 sm:px-6 lg:px-10">
          <div className="flex w-full max-w-[885px] flex-col gap-[30px]">
            <h1 className="text-center text-2xl leading-[1.2] font-semibold tracking-[-0.02em] text-[#101D37] sm:text-[30px]">
              Create <span className="text-blue">New Project</span>
            </h1>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col gap-4 rounded-[20px] border border-[#EDEDF0] bg-white p-5 shadow-[0_14px_30px_0_rgba(40,92,224,0.10)]"
            >
              <div className="flex flex-col gap-5 rounded-[14px] border border-[#EDEDF0] bg-[#FAFAFA] p-4">
                <label className="flex items-start gap-2">
                  <Icon
                    icon={huge(Add01Icon)}
                    size={16}
                    className="mt-1 shrink-0 text-body"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={5}
                    placeholder="Describe the project: the question, research objective or decision to make, scope, stakeholders and timeline…"
                    className="min-h-[120px] w-full resize-none bg-transparent text-base leading-6 tracking-[-0.02em] text-[#101D37] outline-none placeholder:text-body"
                  />
                </label>

                <div className="flex flex-wrap items-center gap-[10px] pl-6">
                  <button
                    type="button"
                    aria-label="Attach image"
                    onClick={() => imageInput.current?.click()}
                    className="flex size-[60px] items-center justify-center rounded-[10px] border border-[#EDEDF0] bg-white p-2.5 text-[#101D37]"
                  >
                    <Icon icon={huge(Image02Icon)} size={30} stroke={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label="Attach PDF"
                    onClick={() => pdfInput.current?.click()}
                    className="flex size-[60px] items-center justify-center rounded-[10px] border border-[#EDEDF0] bg-white p-2.5 text-[#101D37]"
                  >
                    <Icon icon={huge(Pdf02Icon)} size={30} stroke={1.5} />
                  </button>
                  {files.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="flex h-[60px] max-w-[220px] items-center gap-2 rounded-[10px] border border-[#EDEDF0] bg-white px-3 text-xs leading-[1.5] tracking-[-0.02em] text-[#242C2C]"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${f.name}`}
                        onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                        className="text-body"
                      >
                        <Icon icon={huge(Cancel01Icon)} size={14} stroke={1.2} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={(e) => addFiles(e.target.files)}
                  />
                  <input
                    ref={pdfInput}
                    type="file"
                    accept="application/pdf"
                    multiple
                    hidden
                    onChange={(e) => addFiles(e.target.files)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2.5">
                <button
                  type="button"
                  className="flex h-9 items-center gap-1 rounded-[10px] border border-[#EDEDF0] p-2.5 text-sm leading-[1.5] tracking-[-0.02em] text-body"
                >
                  <Icon icon={untitled(Database01)} size={16} />
                  Evidence Sources
                  <Icon icon={huge(ArrowDown01Icon)} size={16} />
                </button>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label="Voice input"
                    className="flex size-9 items-center justify-center rounded-[10px] border border-[#EDEDF0] text-body"
                  >
                    <Icon icon={huge(Mic01Icon)} size={16} />
                  </button>
                  <button
                    type="submit"
                    aria-label="Create project"
                    className="flex size-9 items-center justify-center rounded-[10px] bg-blue text-white"
                  >
                    <Icon icon={untitled(Send03)} size={16} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
