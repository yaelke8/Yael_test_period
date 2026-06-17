"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, Trash2, Calendar } from "lucide-react";

interface Lecture {
  id: string;
  title: string;
  date: string;
  createdAt: string;
}

interface Course {
  id: string;
  name: string;
  color: string;
  examDate: string | null;
  lectures: Lecture[];
  _count: { lectures: number; flashcards: number; quizQuestions: number };
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setCourse(d);
        setLoading(false);
      });
  }, [id]);

  async function deleteLecture(lectureId: string) {
    if (!confirm("למחוק את ההרצאה?")) return;
    await fetch(`/api/lectures/${lectureId}`, { method: "DELETE" });
    setCourse((prev) =>
      prev
        ? { ...prev, lectures: prev.lectures.filter((l) => l.id !== lectureId) }
        : null
    );
  }

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/courses"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowRight size={16} />
        חזרה לקורסים
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: course.color }}>
          {course.name}
        </h1>
        <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
          <span>{course._count.lectures} הרצאות</span>
          <span>{course._count.flashcards} כרטיסיות</span>
          <span>{course._count.quizQuestions} שאלות תרגול</span>
          {course.examDate && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              מבחן: {new Date(course.examDate).toLocaleDateString("he-IL")}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-700">הרצאות</h2>
        <Link
          href={`/lectures/new?courseId=${course.id}`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          הרצאה חדשה
        </Link>
      </div>

      {course.lectures.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <FileText size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">עדיין אין הרצאות בקורס הזה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {course.lectures.map((l) => (
            <div
              key={l.id}
              className="group flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link href={`/lectures/${l.id}`} className="flex-1">
                <h3 className="font-semibold text-gray-800">{l.title}</h3>
                <p className="text-xs text-gray-400">
                  {new Date(l.date).toLocaleDateString("he-IL")}
                </p>
              </Link>
              <button
                onClick={() => deleteLecture(l.id)}
                className="rounded-lg p-2 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
