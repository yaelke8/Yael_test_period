"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, FileText, X } from "lucide-react";

interface Course {
  id: string;
  name: string;
  color: string;
}

const ACCEPTED_TYPES = ".pdf,.docx,.doc,.pptx,.ppt,.txt";
const FILE_TYPE_LABELS: Record<string, string> = {
  pdf: "PDF",
  docx: "Word",
  doc: "Word",
  pptx: "PowerPoint",
  ppt: "PowerPoint",
  txt: "טקסט",
};

export default function NewLecturePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <NewLectureContent />
    </Suspense>
  );
}

function NewLectureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get("courseId") || "";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(preselectedCourseId);
  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        setCourses(d);
        if (!courseId && d.length > 0) setCourseId(d[0].id);
      });
  }, [courseId]);

  async function handleFileUpload(file: File) {
    setUploading(true);
    setError("");

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!Object.keys(FILE_TYPE_LABELS).includes(ext)) {
      setError("פורמט קובץ לא נתמך. נתמכים: PDF, Word, PowerPoint, TXT");
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה בעיבוד הקובץ");
      }

      const data = await res.json();
      setRawText(data.text);
      setUploadedFileName(data.fileName);

      if (!title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setTitle(nameWithoutExt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ");
    }
    setUploading(false);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  }

  function clearUploadedFile() {
    setUploadedFileName("");
    setRawText("");
  }

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
        body: JSON.stringify({
          courseId,
          title,
          rawText,
          date,
          contentBlocks: [],
        }),
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

        {/* File Upload Area */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            העלאת קובץ
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50 hover:border-gray-400"
            }`}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">מעבד את הקובץ...</p>
              </div>
            ) : uploadedFileName ? (
              <div className="flex items-center justify-center gap-3">
                <FileText size={24} className="text-green-500" />
                <span className="text-sm font-medium text-gray-700">
                  {uploadedFileName}
                </span>
                <button
                  type="button"
                  onClick={clearUploadedFile}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={32} className="text-gray-400" />
                <p className="text-sm text-gray-600">
                  גררי קובץ לכאן, או{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-semibold text-blue-600 hover:text-blue-700"
                  >
                    בחרי קובץ
                  </button>
                </p>
                <p className="text-xs text-gray-400">
                  PDF, Word, PowerPoint, TXT
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">או הדביקי טקסט ידנית</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        {/* Raw Text */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            טקסט ההרצאה
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            required
            rows={12}
            placeholder="הדביקי כאן את טקסט ההרצאה, או העלי קובץ למעלה..."
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
            disabled={generating || !courseId || uploading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {generating && <Loader2 size={18} className="animate-spin" />}
            {generating ? "מייצר סיכום..." : "יצירת סיכום עם AI"}
          </button>
          <button
            type="button"
            onClick={handleSaveWithoutAI}
            disabled={generating || !courseId || !title.trim() || uploading}
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
