"use client";

import { STYLE } from "@/lib/colors";

export interface ContentBlock {
  type:
    | "heading1"
    | "heading2"
    | "heading3"
    | "paragraph"
    | "bullet"
    | "noteBox"
    | "formulaBox"
    | "table"
    | "timeline";
  text?: string;
  items?: string[];
  rows?: string[][];
  headers?: string[];
}

export function ContentBlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading1":
      return (
        <h2
          className="text-xl font-bold underline mt-6"
          style={{ color: STYLE.heading1.color }}
        >
          {block.text}
        </h2>
      );
    case "heading2":
      return (
        <h3
          className="text-lg font-bold mt-4"
          style={{ color: STYLE.heading2.color }}
        >
          {block.text}
        </h3>
      );
    case "heading3":
      return (
        <h4
          className="text-base font-bold underline mt-3"
          style={{ color: STYLE.heading3.color }}
        >
          {block.text}
        </h4>
      );
    case "paragraph":
      return (
        <p
          className="leading-relaxed text-gray-800"
          dangerouslySetInnerHTML={{
            __html: (block.text || "").replace(
              /\*\*(.*?)\*\*/g,
              "<strong>$1</strong>"
            ),
          }}
        />
      );
    case "bullet":
      return (
        <ul className="list-disc pr-6 space-y-1 text-gray-800">
          {(block.items || []).map((item, i) => (
            <li
              key={i}
              dangerouslySetInnerHTML={{
                __html: item.replace(
                  /\*\*(.*?)\*\*/g,
                  "<strong>$1</strong>"
                ),
              }}
            />
          ))}
        </ul>
      );
    case "noteBox":
      return (
        <div
          className="rounded-lg p-4 border border-yellow-300"
          style={{ backgroundColor: STYLE.noteBox.bg }}
        >
          <p className="text-sm font-semibold text-yellow-800 mb-1">📌 שימו לב</p>
          <p className="text-gray-800">{block.text}</p>
        </div>
      );
    case "formulaBox":
      return (
        <div
          className="rounded-lg p-4 font-mono text-sm"
          style={{ backgroundColor: STYLE.formulaBox.bg }}
        >
          <pre className="whitespace-pre-wrap" dir="ltr">
            {block.text}
          </pre>
        </div>
      );
    case "table":
      return (
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            {block.headers && (
              <thead>
                <tr style={{ backgroundColor: STYLE.tableHeader.bg }}>
                  {block.headers.map((h, i) => (
                    <th key={i} className="border px-3 py-2 font-semibold text-right">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(block.rows || []).map((row, ri) => (
                <tr key={ri} className="even:bg-gray-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="border px-3 py-2 text-right">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "timeline":
      return (
        <div className="pr-4 border-r-2 border-blue-300 space-y-2">
          {(block.items || []).map((item, i) => (
            <p key={i} className="text-gray-800">
              <span className="font-semibold text-blue-600">{i + 1}.</span> {item}
            </p>
          ))}
        </div>
      );
    default:
      return <p className="text-gray-600">{block.text}</p>;
  }
}
