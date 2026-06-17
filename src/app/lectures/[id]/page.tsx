"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Download, Loader2 } from "lucide-react";
import {
  ContentBlockRenderer,
  ContentBlock,
} from "@/components/ContentBlockRenderer";
import { STYLE } from "@/lib/colors";

interface Lecture {
  id: string;
  title: string;
  date: string;
  rawText: string;
  contentBlocks: ContentBlock[];
  course: { id: string; name: string; color: string };
}

export default function LectureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/lectures/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLecture(d);
        setLoading(false);
      });
  }, [id]);

  async function handleRegenerate() {
    if (!lecture) return;
    setRegenerating(true);
    try {
      const aiRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: lecture.rawText, title: lecture.title }),
      });
      if (!aiRes.ok) throw new Error("שגיאה");
      const aiData = await aiRes.json();

      await fetch(`/api/lectures/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBlocks: aiData.contentBlocks }),
      });

      setLecture({ ...lecture, contentBlocks: aiData.contentBlocks });
    } catch {
      alert("שגיאה ביצירת סיכום מחדש");
    }
    setRegenerating(false);
  }

  async function handleDownload() {
    if (!lecture) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentBlocks: lecture.contentBlocks,
          title: lecture.title,
          courseName: lecture.course.name,
        }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Summary_${lecture.course.name}_${lecture.title}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("שגיאה בהורדה");
    }
    setDownloading(false);
  }

  if (loading || !lecture) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const hasContent =
    Array.isArray(lecture.contentBlocks) && lecture.contentBlocks.length > 0;

  return (
    <div>
      <Link
        href={`/courses/${lecture.course.id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} />
        חזרה ל{lecture.course.name}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: STYLE.mainTitle.color }}
          >
            {lecture.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {lecture.course.name} •{" "}
            {new Date(lecture.date).toLocaleDateString("he-IL")}
          </p>
        </div>
        <div className="flex gap-2">
          {hasContent && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              הורדה כ-Word
            </button>
          )}
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {regenerating && <Loader2 size={16} className="animate-spin" />}
            {regenerating ? "מייצר..." : "יצירת סיכום מחדש"}
          </button>
        </div>
      </div>

      {hasContent ? (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <ContentBlockRenderer blocks={lecture.contentBlocks} />
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="mb-3 text-gray-500">
            עדיין לא נוצר סיכום להרצאה הזו
          </p>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {regenerating ? "מייצר..." : "יצירת סיכום"}
          </button>
        </div>
      )}

      {!hasContent && lecture.rawText && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            הצג טקסט מקורי
          </summary>
          <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {lecture.rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
