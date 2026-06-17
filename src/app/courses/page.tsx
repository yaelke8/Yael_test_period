"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle, Trash2, Edit2, BookOpen, Calendar } from "lucide-react";

interface Course {
  id: string;
  name: string;
  color: string;
  examDate: string | null;
  studyDaysPlanned: number | null;
  _count: { lectures: number };
  studyPlan: { dailyAssignments: { done?: boolean }[] } | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [examDate, setExamDate] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    const res = await fetch("/api/courses");
    const data = await res.json();
    setCourses(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = { name, color, examDate: examDate || null };
    if (editId) {
      await fetch(`/api/courses/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
    resetForm();
    fetchCourses();
  }

  function resetForm() {
    setName("");
    setColor("#3B82F6");
    setExamDate("");
    setShowForm(false);
    setEditId(null);
  }

  function startEdit(c: Course) {
    setEditId(c.id);
    setName(c.name);
    setColor(c.color);
    setExamDate(c.examDate ? c.examDate.split("T")[0] : "");
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק את הקורס? כל ההרצאות והכרטיסיות ימחקו")) return;
    await fetch(`/api/courses/${id}`, { method: "DELETE" });
    fetchCourses();
  }

  function getProgress(course: Course): number {
    const plan = course.studyPlan;
    if (!plan || !Array.isArray(plan.dailyAssignments)) return 0;
    const total = plan.dailyAssignments.length;
    if (total === 0) return 0;
    const done = plan.dailyAssignments.filter((d) => d.done).length;
    return Math.round((done / total) * 100);
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">הקורסים שלי</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <PlusCircle size={18} />
          קורס חדש
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                שם הקורס
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                צבע
              </label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-lg border"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                תאריך מבחן
              </label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {editId ? "עדכון" : "יצירה"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border px-6 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {courses.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500">עדיין אין קורסים</p>
          <p className="text-sm text-gray-400">לחצי על &quot;קורס חדש&quot; כדי להתחיל</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const progress = getProgress(c);
            return (
              <div
                key={c.id}
                className="group relative rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div
                  className="mb-3 h-2 w-full rounded-full"
                  style={{ backgroundColor: c.color + "30" }}
                >
                  {progress > 0 && (
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: c.color,
                      }}
                    />
                  )}
                </div>
                <Link href={`/courses/${c.id}`}>
                  <h2 className="text-lg font-bold" style={{ color: c.color }}>
                    {c.name}
                  </h2>
                </Link>
                <p className="mt-1 text-sm text-gray-500">
                  {c._count.lectures} הרצאות
                </p>
                {c.examDate && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                    <Calendar size={12} />
                    מבחן: {new Date(c.examDate).toLocaleDateString("he-IL")}
                  </p>
                )}
                {progress > 0 && (
                  <p className="mt-1 text-xs text-gray-400">
                    התקדמות: {progress}%
                  </p>
                )}
                <div className="absolute left-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
