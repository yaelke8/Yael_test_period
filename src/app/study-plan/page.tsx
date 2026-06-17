"use client";

import { useEffect, useState } from "react";
import { Loader2, CalendarDays, Check } from "lucide-react";

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

export default function StudyPlanPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [studyDays, setStudyDays] = useState(14);
  const [practiceExams, setPracticeExams] = useState(2);
  const [syllabusText, setSyllabusText] = useState("");
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
          syllabusText,
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

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            סילבוס נוסף (אופציונלי)
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
          className="mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generating && <Loader2 size={18} className="animate-spin" />}
          {generating
            ? "מייצר תוכנית..."
            : plan
            ? "יצירת תוכנית מחדש"
            : "יצירת תוכנית לימוד"}
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
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
