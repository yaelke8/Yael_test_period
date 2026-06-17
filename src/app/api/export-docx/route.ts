import { NextRequest, NextResponse } from "next/server";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
  BorderStyle,
  HeadingLevel,
  LevelFormat,
} from "docx";
import { STYLE } from "@/lib/colors";

interface ContentBlock {
  type: string;
  text?: string;
  items?: string[];
  rows?: string[][];
  headers?: string[];
}

function hexToDocxColor(hex: string): string {
  return hex.replace("#", "");
}

function rtlParagraph(
  options: {
    text?: string;
    bold?: boolean;
    color?: string;
    size?: number;
    underline?: boolean;
    heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
    bullet?: { level: number };
    font?: string;
    shading?: string;
    children?: TextRun[];
  } = {}
): Paragraph {
  const runs = options.children || [
    new TextRun({
      text: (options.text || "").replace(/\*\*/g, ""),
      bold: options.bold,
      color: options.color ? hexToDocxColor(options.color) : undefined,
      size: options.size,
      underline: options.underline ? {} : undefined,
      font: options.font || "Rubik",
      rightToLeft: true,
    }),
  ];

  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    bidirectional: true,
    heading: options.heading,
    bullet: options.bullet,
    shading: options.shading
      ? {
          type: ShadingType.CLEAR,
          fill: hexToDocxColor(options.shading),
          color: "auto",
        }
      : undefined,
    spacing: { after: 120 },
    children: runs,
  });
}

function buildDocxContent(blocks: ContentBlock[]): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "heading1":
        elements.push(
          rtlParagraph({
            text: block.text,
            bold: true,
            color: STYLE.heading1.color,
            size: 32,
            underline: true,
            heading: HeadingLevel.HEADING_1,
          })
        );
        break;

      case "heading2":
        elements.push(
          rtlParagraph({
            text: block.text,
            bold: true,
            color: STYLE.heading2.color,
            size: 28,
            heading: HeadingLevel.HEADING_2,
          })
        );
        break;

      case "heading3":
        elements.push(
          rtlParagraph({
            text: block.text,
            bold: true,
            color: STYLE.heading3.color,
            size: 24,
            underline: true,
            heading: HeadingLevel.HEADING_3,
          })
        );
        break;

      case "paragraph": {
        const parts = (block.text || "").split(/(\*\*.*?\*\*)/);
        const runs = parts.map((part) => {
          const isBold = part.startsWith("**") && part.endsWith("**");
          return new TextRun({
            text: isBold ? part.slice(2, -2) : part,
            bold: isBold,
            font: "Rubik",
            size: 22,
            rightToLeft: true,
          });
        });
        elements.push(rtlParagraph({ children: runs }));
        break;
      }

      case "bullet":
        for (const item of block.items || []) {
          elements.push(
            rtlParagraph({
              text: item,
              bullet: { level: 0 },
            })
          );
        }
        break;

      case "noteBox":
        elements.push(
          rtlParagraph({
            text: `📌 ${block.text}`,
            shading: STYLE.noteBox.bg,
            bold: true,
          })
        );
        break;

      case "formulaBox":
        elements.push(
          rtlParagraph({
            text: block.text,
            font: "Courier New",
            shading: STYLE.formulaBox.bg,
          })
        );
        break;

      case "table": {
        const rows: TableRow[] = [];
        if (block.headers) {
          rows.push(
            new TableRow({
              children: block.headers.map(
                (h) =>
                  new TableCell({
                    width: { size: Math.floor(9000 / (block.headers!.length)), type: WidthType.DXA },
                    shading: {
                      type: ShadingType.CLEAR,
                      fill: hexToDocxColor(STYLE.tableHeader.bg),
                      color: "auto",
                    },
                    children: [
                      rtlParagraph({ text: h, bold: true, size: 20 }),
                    ],
                  })
              ),
            })
          );
        }
        for (const row of block.rows || []) {
          rows.push(
            new TableRow({
              children: row.map(
                (cell) =>
                  new TableCell({
                    width: {
                      size: Math.floor(9000 / (block.headers?.length || row.length)),
                      type: WidthType.DXA,
                    },
                    children: [rtlParagraph({ text: cell, size: 20 })],
                  })
              ),
            })
          );
        }
        if (rows.length > 0) {
          elements.push(
            new Table({
              rows,
              width: { size: 9000, type: WidthType.DXA },
            })
          );
          elements.push(rtlParagraph({ text: "" }));
        }
        break;
      }

      case "timeline":
        for (let i = 0; i < (block.items || []).length; i++) {
          elements.push(
            rtlParagraph({
              text: `${i + 1}. ${block.items![i]}`,
            })
          );
        }
        break;

      default:
        if (block.text) {
          elements.push(rtlParagraph({ text: block.text }));
        }
    }
  }

  return elements;
}

export async function POST(request: NextRequest) {
  try {
    const { contentBlocks, title, courseName } = await request.json();

    const doc = new Document({
      numbering: {
        config: [
          {
            reference: "bullet-list",
            levels: [
              {
                level: 0,
                format: LevelFormat.BULLET,
                text: "•",
                alignment: AlignmentType.RIGHT,
              },
            ],
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1000, right: 1200, bottom: 1000, left: 1200 },
            },
          },
          children: [
            rtlParagraph({
              text: title,
              bold: true,
              color: STYLE.mainTitle.color,
              size: 40,
              heading: HeadingLevel.TITLE,
            }),
            rtlParagraph({
              text: courseName,
              color: "666666",
              size: 24,
            }),
            rtlParagraph({ text: "" }),
            ...buildDocxContent(contentBlocks || []),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="Summary_${courseName}_${title}.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX export error:", error);
    return NextResponse.json({ error: "שגיאה ביצוא" }, { status: 500 });
  }
}
