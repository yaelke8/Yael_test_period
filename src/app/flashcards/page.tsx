"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ThumbsUp, ThumbsDown, Filter } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  lastResult: string | null;
  lecture: { title: string };
  course: { name: string };
}

interface Course {
  id: string;
  name: string;
}

export default function FlashcardsPage() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = courseFilter
      ? `/api/flashcards?courseId=${courseFilter}`
      : "/api/flashcards";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setCards(shuffleArray(d));
        setCurrentIndex(0);
        setFlipped(false);
        setLoading(false);
      });
  }, [courseFilter]);

  function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  async function markResult(result: "knew" | "didnt_know") {
    const card = cards[currentIndex];
    await fetch("/api/flashcards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, lastResult: result }),
    });

    setFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function restart() {
    setCards(shuffleArray(cards));
    setCurrentIndex(0);
    setFlipped(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const card = cards[currentIndex];
  const isFinished = cards.length > 0 && currentIndex >= cards.length - 1 && flipped;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">כרטיסיות</h1>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">כל הקורסים</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-lg text-gray-500">אין כרטיסיות</p>
          <p className="text-sm text-gray-400">כרטיסיות נוצרות אוטומטית עם סיכום הרצאה</p>
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-center text-sm text-gray-500">
            {currentIndex + 1} / {cards.length}
          </p>

          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer rounded-2xl border bg-white p-8 shadow-md transition-all hover:shadow-lg min-h-[200px] flex flex-col items-center justify-center"
          >
            <p className="mb-2 text-xs text-gray-400">
              {card.course.name} • {card.lecture.title}
            </p>
            <p className="text-center text-lg font-medium text-gray-800">
              {flipped ? card.back : card.front}
            </p>
            <p className="mt-4 text-xs text-gray-400">
              {flipped ? "תשובה" : "לחצי להפוך"}
            </p>
          </div>

          {flipped && (
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={() => markResult("knew")}
                className="flex items-center gap-2 rounded-lg bg-green-500 px-6 py-2.5 font-semibold text-white hover:bg-green-600"
              >
                <ThumbsUp size={18} />
                ידעתי
              </button>
              <button
                onClick={() => markResult("didnt_know")}
                className="flex items-center gap-2 rounded-lg bg-red-500 px-6 py-2.5 font-semibold text-white hover:bg-red-600"
              >
                <ThumbsDown size={18} />
                לא ידעתי
              </button>
            </div>
          )}

          {isFinished && (
            <div className="mt-6 text-center">
              <p className="mb-3 text-lg font-semibold text-gray-700">
                סיימת! 🎉
              </p>
              <button
                onClick={restart}
                className="flex items-center gap-2 mx-auto rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw size={16} />
                התחלה מחדש
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
