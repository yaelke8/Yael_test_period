"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface Course {
  id: string;
  name: string;
  color: string;
}

export default function NewLecturePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
      <NewLectureContent />
    </Suspense>
  );
}

function NewLectureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        setCourses(d);
        if (!courseId && d.length > 0) setCourseId(d[0].id);
      });
  }, [courseId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawText.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const aiRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, title }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.json();
        throw new Error(err.error || "שגיאה ביצירת הסיכום");
      }

      const aiData = await aiRes.json();

      const lectureRes = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title,
          rawText,
          date,
          contentBlocks: aiData.contentBlocks,
          flashcards: aiData.flashcards,
          quizQuestions: aiData.quizQuestions,
        }),
      });

      if (!lectureRes.ok) throw new Error("שגיאה בשמירת ההרצאה");

      const lecture = await lectureRes.json();
      router.push(`/lectures/${lecture.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
      setGenerating(false);
    }
  }

  async function handleSaveWithoutAI() {
    if (!rawText.trim() || !title.trim()) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/lectures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, title, rawText, date, contentBlocks: [] }),
      });
      if (!res.ok) throw new Error("שגיאה בשמירה");
      const lecture = await res.json();
      router.push(`/lectures/${lecture.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה");
      setGenerating(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">הרצאה חדשה</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              קורס
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              כותרת ההרצאה
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              תאריך
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            טקסט ההרצאה (הדבקה)
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            required
            rows={12}
            placeholder="הדביקי כאן את טקסט ההרצאה..."
            className="w-full rounded-lg border px-3 py-3 text-right leading-relaxed focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={generating || !courseId}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {generating && <Loader2 size={18} className="animate-spin" />}
            {generating ? "מייצר סיכום..." : "יצירת סיכום עם AI"}
          </button>
          <button
            type="button"
            onClick={handleSaveWithoutAI}
            disabled={generating || !courseId || !title.trim()}
            className="rounded-lg border px-6 py-2.5 text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            שמירה ללא AI
          </button>
        </div>
      </form>

      {courses.length === 0 && (
        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          עדיין אין קורסים.{" "}
          <a href="/courses" className="font-semibold underline">
            צרי קורס חדש
          </a>{" "}
          לפני הוספת הרצאה.
        </div>
      )}
    </div>
  );
}
