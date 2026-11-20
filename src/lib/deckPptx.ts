/*
 * Research case → PowerPoint (.pptx) with real, editable PowerPoint elements:
 * text boxes, bullet lists, tables and native bar charts. pptxgenjs loads only on click.
 */
import type { Block, Slide } from "./deck";

type Run = { text: string; options?: Record<string, unknown> };

const BLUE = "285CE0";
const DARK = "101D37";
const BODY = "344054";
const FONT = "Arial";

/* slides are designed at 960 × 540 px; PowerPoint 16:9 is 10 × 5.625 in */
const IN = (px: number) => px / 96;

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

export const plain = (html: string) =>
  decode(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "")).trim();

/** simple HTML (b / i / u / br) → text runs */
function runs(html: string, base: Record<string, unknown> = {}): Run[] {
  const out: Run[] = [];
  let b = 0;
  let i = 0;
  let u = 0;
  const re = /<(\/?)(b|strong|i|em|u)\b[^>]*>|<br\s*\/?>|<[^>]+>|([^<]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (m[3] !== undefined) {
      const text = decode(m[3]);
      if (text)
        out.push({
          text,
          options: {
            ...base,
            bold: b > 0 || !!base.bold,
            italic: i > 0,
            underline: u > 0 ? { style: "sng" } : undefined,
          },
        });
    } else if (/^<br/i.test(m[0])) {
      out.push({ text: "", options: { ...base, breakLine: true } });
    } else if (m[2]) {
      const d = m[1] ? -1 : 1;
      const t = m[2].toLowerCase();
      if (t === "b" || t === "strong") b = Math.max(0, b + d);
      else if (t === "i" || t === "em") i = Math.max(0, i + d);
      else u = Math.max(0, u + d);
    }
  }
  return out.length ? out : [{ text: "", options: base }];
}

/* same grid as the editor: two columns when there is more than one block,
 * a first table/text block spans both columns when the count is odd */
function layout(blocks: Block[]) {
  const many = blocks.length > 1;
  const cells: { b: Block; col: number; span: number; row: number }[] = [];
  let row = 0;
  let col = 0;
  blocks.forEach((b, idx) => {
    const span =
      many &&
      (b.type === "table" || b.type === "text") &&
      idx === 0 &&
      blocks.length % 2 === 1
        ? 2
        : many
          ? 1
          : 2;
    if (col + span > 2) {
      row++;
      col = 0;
    }
    cells.push({ b, col, span, row });
    col += span;
    if (col >= 2) {
      row++;
      col = 0;
    }
  });
  const rows = Math.max(
    1,
    cells.reduce((m, c) => Math.max(m, c.row + 1), 0),
  );
  return { cells, rows };
}

export async function exportPptx(slides: Slide[], project: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = `${project} – Research Case`;
  pptx.company = "Artifex Labs";

  slides.forEach((sl, n) => {
    const s = pptx.addSlide();
    if (sl.layout === "cover") {
      s.background = { color: "1F4FCB" };
      s.addShape(pptx.ShapeType.ellipse, {
        x: 7.4,
        y: -1.2,
        w: 3.8,
        h: 3.8,
        fill: { color: "FFFFFF", transparency: 92 },
        line: { type: "none" },
      });
      s.addText(plain(sl.eyebrow).toUpperCase(), {
        x: IN(80),
        y: 1.45,
        w: 8.4,
        h: 0.35,
        fontFace: FONT,
        fontSize: 12,
        bold: true,
        color: "DCE5FB",
        charSpacing: 2,
      });
      s.addText(plain(sl.title), {
        x: IN(80),
        y: 1.85,
        w: 8.6,
        h: 1.2,
        fontFace: FONT,
        fontSize: 38,
        bold: true,
        color: "FFFFFF",
        valign: "top",
        fit: "shrink",
      });
      if (sl.subtitle)
        s.addText(plain(sl.subtitle), {
          x: IN(80),
          y: 3.1,
          w: 8.6,
          h: 0.45,
          fontFace: FONT,
          fontSize: 16,
          color: "F2F4F7",
        });
      (sl.meta ?? []).forEach((m, k) => {
        s.addText(plain(m), {
          x: IN(80) + k * 2.85,
          y: 4.6,
          w: 2.75,
          h: 0.4,
          fontFace: FONT,
          fontSize: 12,
          color: "FFFFFF",
        });
      });
      return;
    }

    /* content slide frame */
    s.background = { color: "FFFFFF" };
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 10,
      h: 0.06,
      fill: { color: BLUE },
      line: { type: "none" },
    });
    s.addText(plain(sl.eyebrow).toUpperCase(), {
      x: IN(56),
      y: 0.42,
      w: 8.8,
      h: 0.28,
      fontFace: FONT,
      fontSize: 10,
      bold: true,
      color: BLUE,
      charSpacing: 2,
    });
    s.addText(plain(sl.title), {
      x: IN(56),
      y: 0.68,
      w: 8.8,
      h: 0.55,
      fontFace: FONT,
      fontSize: 24,
      bold: true,
      color: DARK,
      fit: "shrink",
    });
    s.addText(`Artifex Labs · ${project}`, {
      x: IN(56),
      y: 5.22,
      w: 6,
      h: 0.25,
      fontFace: FONT,
      fontSize: 8,
      color: "98A2B3",
    });
    s.addText(`${n + 1} / ${slides.length}`, {
      x: 8.4,
      y: 5.22,
      w: 1,
      h: 0.25,
      fontFace: FONT,
      fontSize: 8,
      color: "98A2B3",
      align: "right",
    });

    const X0 = IN(56);
    const W = 10 - 2 * X0;
    const Y0 = 1.45;
    const H = 5.05 - Y0;
    const GAP = 0.25;
    const { cells, rows } = layout(sl.blocks);
    const rowH = (H - GAP * (rows - 1)) / rows;
    const colW = (W - GAP) / 2;

    for (const { b, col, span, row } of cells) {
      const x = X0 + col * (colW + GAP);
      const w = span === 2 ? W : colW;
      const y = Y0 + row * (rowH + GAP);
      const h = rowH;
      switch (b.type) {
        case "text":
          s.addText(
            runs(b.html, { fontFace: FONT, fontSize: 13, color: BODY }),
            { x, y, w, h, valign: "top", fit: "shrink", paraSpaceAfter: 4 },
          );
          break;
        case "callout":
          s.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w,
            h: Math.min(h, 1.2),
            fill: { color: "EEF2FD" },
            line: { type: "none" },
          });
          s.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w: 0.05,
            h: Math.min(h, 1.2),
            fill: { color: BLUE },
            line: { type: "none" },
          });
          s.addText(
            runs(b.html, { fontFace: FONT, fontSize: 12, color: DARK }),
            {
              x: x + 0.15,
              y,
              w: w - 0.25,
              h: Math.min(h, 1.2),
              valign: "middle",
              fit: "shrink",
            },
          );
          break;
        case "bullets": {
          const paras: Run[] = [];
          b.items.forEach((it) => {
            const r = runs(it, { fontFace: FONT, fontSize: 12, color: BODY });
            r[0].options = {
              ...r[0].options,
              bullet: { code: "2022" },
              indentLevel: 0,
            };
            r[r.length - 1].options = {
              ...r[r.length - 1].options,
              breakLine: true,
            };
            paras.push(...r);
          });
          s.addText(paras, {
            x,
            y,
            w,
            h,
            valign: "top",
            fit: "shrink",
            paraSpaceAfter: 6,
          });
          break;
        }
        case "table": {
          const tbl = b.rows.map((r, ri) =>
            r.map((cell) => ({
              text: plain(cell),
              options: {
                bold: ri === 0,
                color: ri === 0 ? DARK : BODY,
                fill: {
                  color: ri === 0 ? "F2F4F7" : ri % 2 ? "FFFFFF" : "FAFAFA",
                },
              },
            })),
          );
          s.addTable(tbl, {
            x,
            y,
            w,
            fontFace: FONT,
            fontSize: b.rows.length > 7 ? 8 : 10,
            border: { type: "solid", pt: 0.5, color: "EDEDF0" },
            margin: 0.05,
            autoPage: false,
          });
          break;
        }
        case "chart":
          s.addChart(
            pptx.ChartType.bar,
            [
              {
                name: plain(b.title) || "Series",
                labels: b.bars.map((x) => plain(x.label)),
                values: b.bars.map((x) => x.value),
              },
            ],
            {
              x,
              y,
              w,
              h,
              barDir: "col",
              chartColors: [BLUE],
              showValue: true,
              dataLabelFontSize: 9,
              dataLabelColor: DARK,
              catAxisLabelFontSize: 8,
              catAxisLabelColor: "667085",
              valAxisHidden: true,
              valGridLine: { style: "none" },
              showLegend: false,
              showTitle: true,
              title: plain(b.title),
              titleFontSize: 11,
              titleColor: DARK,
            },
          );
          break;
      }
    }
  });

  const safe = project.replace(/[\\/:*?"<>|]+/g, "").trim() || "Research case";
  await pptx.writeFile({ fileName: `${safe} – Research Case.pptx` });
}
