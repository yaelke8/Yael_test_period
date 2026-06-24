"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  CalendarDays,
  Check,
  Upload,
  X,
  FileText,
} from "lucide-react";

interface Course {
  id: string;
  name: string;
  color: string;
  examDate: string | null;
}

interface DayAssignment {
  day: number;
  date: string;
  kind: string;
  description: string;
  lectureIds: string[];
  done: boolean;
}

interface StudyPlan {
  courseId: string;
  examDate: string;
  studyDays: number;
  dailyAssignments: DayAssignment[];
}

interface UploadedMaterial {
  fileName: string;
  type: "syllabus" | "exam" | "homework";
  text: string;
}

const MATERIAL_TYPES = [
  { value: "syllabus", label: "סילבוס" },
  { value: "exam", label: "מבחן / מבחן לדוגמה" },
  { value: "homework", label: "תרגיל / שיעורי בית" },
] as const;

const ACCEPTED_FILES = ".pdf,.docx,.doc,.pptx,.ppt,.txt";

export default function StudyPlanPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyDays, setStudyDays] = useState(14);
  const [practiceExams, setPracticeExams] = useState(2);
  const [examOnlyDays, setExamOnlyDays] = useState(3);
  const [syllabusText, setSyllabusText] = useState("");
  const [materials, setMaterials] = useState<UploadedMaterial[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingType, setPendingType] = useState<UploadedMaterial["type"]>("syllabus");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((d) => {
        setCourses(d);
        if (d.length > 0) {
          setCourseId(d[0].id);
          if (d[0].examDate) setExamDate(d[0].examDate.split("T")[0]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!courseId) return;
    fetch(`/api/study-plan?courseId=${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.dailyAssignments) setPlan(d);
        else setPlan(null);
      });
    const course = courses.find((c) => c.id === courseId);
    if (course?.examDate) setExamDate(course.examDate.split("T")[0]);
  }, [courseId, courses]);

  async function handleFileUpload(file: File) {
    setUploadingFile(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "שגיאה בעיבוד הקובץ");
      }
      const data = await res.json();
      setMaterials((prev) => [
        ...prev,
        { fileName: data.fileName, type: pendingType, text: data.text },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בהעלאת הקובץ");
    }
    setUploadingFile(false);
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  function getMaterialTypeLabel(type: UploadedMaterial["type"]) {
    return MATERIAL_TYPES.find((t) => t.value === type)?.label || type;
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/study-plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          examDate,
          studyDays,
          practiceExams,
          examOnlyDays,
          syllabusText,
          materials: materials.map((m) => ({
            fileName: m.fileName,
            type: m.type,
            text: m.text,
          })),
        }),
      });
      if (!res.ok) throw new Error("שגיאה ביצירת תוכנית");
      const data = await res.json();

      await fetch("/api/study-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          examDate,
          studyDays,
          dailyAssignments: data.dailyAssignments,
        }),
      });

      setPlan({
        courseId,
        examDate,
        studyDays,
        dailyAssignments: data.dailyAssignments,
      });
    } catch {
      setError("שגיאה ביצירת תוכנית הלימוד");
    }
    setGenerating(false);
  }

  async function toggleDone(dayIndex: number) {
    if (!plan) return;
    const updated = [...plan.dailyAssignments];
    updated[dayIndex] = { ...updated[dayIndex], done: !updated[dayIndex].done };
    setPlan({ ...plan, dailyAssignments: updated });

    await fetch("/api/study-plan", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, dailyAssignments: updated }),
    });
  }

  function getKindLabel(kind: string) {
    switch (kind) {
      case "new":
        return "חומר חדש";
      case "review":
        return "חזרה";
      case "practice_exam":
        return "מבחן תרגול";
      case "homework":
        return "תרגיל";
      case "syllabus_review":
        return "מעבר על סילבוס";
      default:
        return kind;
    }
  }

  function getKindColor(kind: string) {
    switch (kind) {
      case "new":
        return "bg-blue-100 text-blue-700";
      case "review":
        return "bg-green-100 text-green-700";
      case "practice_exam":
        return "bg-purple-100 text-purple-700";
      case "homework":
        return "bg-orange-100 text-orange-700";
      case "syllabus_review":
        return "bg-cyan-100 text-cyan-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">תוכנית לימוד</h1>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm space-y-5">
        {/* Basic settings */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              קורס
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none"
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
              תאריך מבחן
            </label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ימי לימוד
            </label>
            <input
              type="number"
              min={1}
              max={60}
              value={studyDays}
              onChange={(e) => setStudyDays(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              מבחני תרגול
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={practiceExams}
              onChange={(e) => setPracticeExams(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              ימי מבחנים בלבד (לפני המבחן)
            </label>
            <input
              type="number"
              min={0}
              max={10}
              value={examOnlyDays}
              onChange={(e) => setExamOnlyDays(Number(e.target.value))}
              className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* File upload section */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            העלאת חומרים (סילבוס, מבחנים, תרגילים)
          </label>

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <select
              value={pendingType}
              onChange={(e) =>
                setPendingType(e.target.value as UploadedMaterial["type"])
              }
              className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              className="flex items-center gap-2 rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-blue-500 hover:text-blue-600 disabled:opacity-50"
            >
              {uploadingFile ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              {uploadingFile ? "מעבד..." : "העלאת קובץ"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILES}
              onChange={handleFileInputChange}
              className="hidden"
            />
            <span className="text-xs text-gray-400">
              PDF, Word, PowerPoint, TXT
            </span>
          </div>

          {/* Uploaded materials list */}
          {materials.length > 0 && (
            <div className="space-y-2">
              {materials.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border bg-gray-50 px-3 py-2"
                >
                  <FileText size={16} className="shrink-0 text-gray-400" />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {m.fileName}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      m.type === "syllabus"
                        ? "bg-cyan-100 text-cyan-700"
                        : m.type === "exam"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {getMaterialTypeLabel(m.type)}
                  </span>
                  <span className="text-xs text-gray-400">
                    {Math.round(m.text.length / 100) * 100 > 0
                      ? `~${Math.round(m.text.length / 1000)}K תווים`
                      : "קצר"}
                  </span>
                  <button
                    onClick={() => removeMaterial(i)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Free text syllabus */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            סילבוס / הערות נוספות (אופציונלי)
          </label>
          <textarea
            value={syllabusText}
            onChange={(e) => setSyllabusText(e.target.value)}
            rows={3}
            placeholder="הדביקי כאן סילבוס או מידע נוסף..."
            className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !courseId || !examDate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generating && <Loader2 size={18} className="animate-spin" />}
          {generating
            ? "מייצר תוכנית..."
            : plan
            ? "יצירת תוכנית מחדש"
            : "יצירת תוכנית לימוד"}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      {plan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays size={20} />
              התוכנית שלך
            </h2>
            <p className="text-sm text-gray-500">
              {plan.dailyAssignments.filter((d) => d.done).length}/
              {plan.dailyAssignments.length} הושלמו
            </p>
          </div>

          {plan.dailyAssignments.map((day, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-all ${
                day.done ? "opacity-60" : ""
              }`}
            >
              <button
                onClick={() => toggleDone(i)}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  day.done
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 hover:border-green-400"
                }`}
              >
                {day.done && <Check size={14} />}
              </button>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-700">
                    יום {day.day}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(day.date).toLocaleDateString("he-IL")}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${getKindColor(
                      day.kind
                    )}`}
                  >
                    {getKindLabel(day.kind)}
                  </span>
                </div>
                <p
                  className={`text-sm text-gray-600 ${
                    day.done ? "line-through" : ""
                  }`}
                >
                  {day.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
