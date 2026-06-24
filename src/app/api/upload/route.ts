import { NextRequest, NextResponse } from "next/server";
import { fileToMarkdown } from "@/lib/fileToMarkdown";

const SUPPORTED_EXTENSIONS = ["pdf", "docx", "doc", "pptx", "ppt", "txt"];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "לא נבחר קובץ" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    const ext = name.split(".").pop() || "";

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: "פורמט קובץ לא נתמך. נתמכים: PDF, Word, PowerPoint, TXT" },
        { status: 400 }
      );
    }

    let text = "";

    if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else {
      text = await fileToMarkdown(buffer, file.name);
    }

    text = text.trim();
    if (!text) {
      return NextResponse.json(
        { error: "לא הצלחנו לחלץ טקסט מהקובץ" },
        { status: 400 }
      );
    }

    return NextResponse.json({ text, fileName: file.name });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד הקובץ" },
      { status: 500 }
    );
  }
}
