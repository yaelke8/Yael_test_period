"use client";

import { useEffect, useState } from "react";
import { Filter, CheckCircle, XCircle, RotateCcw } from "lucide-react";

interface QuizQuestion {
  id: string;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  lecture: { title: string };
  course: { name: string };
}

interface Course {
  id: string;
  name: string;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseFilter, setCourseFilter] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [openAnswer, setOpenAnswer] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then(setCourses);
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = courseFilter
      ? `/api/quiz?courseId=${courseFilter}`
      : "/api/quiz";
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(shuffleArray(d));
        setCurrentIndex(0);
        setSelectedAnswer("");
        setOpenAnswer("");
        setShowResult(false);
        setScore(0);
        setAnswered(0);
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

  function checkAnswer() {
    const q = questions[currentIndex];
    const userAnswer =
      q.type === "multiple_choice" ? selectedAnswer : openAnswer.trim();
    const isCorrect =
      q.type === "multiple_choice"
        ? userAnswer === q.correctAnswer
        : userAnswer.toLowerCase().includes(q.correctAnswer.toLowerCase());
    if (isCorrect) setScore(score + 1);
    setAnswered(answered + 1);
    setShowResult(true);
  }

  function nextQuestion() {
    setShowResult(false);
    setSelectedAnswer("");
    setOpenAnswer("");
    setCurrentIndex(currentIndex + 1);
  }

  function restart() {
    setQuestions(shuffleArray(questions));
    setCurrentIndex(0);
    setSelectedAnswer("");
    setOpenAnswer("");
    setShowResult(false);
    setScore(0);
    setAnswered(0);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const q = questions[currentIndex];
  const isFinished = currentIndex >= questions.length;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">תרגול</h1>
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

      {questions.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-lg text-gray-500">אין שאלות תרגול</p>
          <p className="text-sm text-gray-400">
            שאלות נוצרות אוטומטית עם סיכום הרצאה
          </p>
        </div>
      ) : isFinished ? (
        <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-md">
          <p className="mb-2 text-4xl">🎉</p>
          <p className="text-xl font-bold text-gray-800">סיימת!</p>
          <p className="mt-2 text-lg text-gray-600">
            ציון: {score}/{answered} ({answered > 0 ? Math.round((score / answered) * 100) : 0}
            %)
          </p>
          <button
            onClick={restart}
            className="mt-4 flex items-center gap-2 mx-auto rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw size={16} />
            התחלה מחדש
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-lg">
          <p className="mb-3 text-center text-sm text-gray-500">
            שאלה {currentIndex + 1} / {questions.length} • ציון: {score}/{answered}
          </p>

          <div className="rounded-2xl border bg-white p-6 shadow-md">
            <p className="mb-1 text-xs text-gray-400">
              {q.course.name} • {q.lecture.title}
            </p>
            <p className="mb-4 text-lg font-medium text-gray-800">
              {q.question}
            </p>

            {q.type === "multiple_choice" && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isCorrect = showResult && opt === q.correctAnswer;
                  const isWrong =
                    showResult &&
                    opt === selectedAnswer &&
                    opt !== q.correctAnswer;
                  return (
                    <button
                      key={i}
                      onClick={() => !showResult && setSelectedAnswer(opt)}
                      disabled={showResult}
                      className={`w-full rounded-lg border p-3 text-right transition-colors ${
                        isCorrect
                          ? "border-green-500 bg-green-50 text-green-700"
                          : isWrong
                          ? "border-red-500 bg-red-50 text-red-700"
                          : selectedAnswer === opt
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isCorrect && <CheckCircle size={16} />}
                        {isWrong && <XCircle size={16} />}
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <input
                  value={openAnswer}
                  onChange={(e) => setOpenAnswer(e.target.value)}
                  disabled={showResult}
                  placeholder="הקלידי תשובה..."
                  className="w-full rounded-lg border px-3 py-2 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                {showResult && (
                  <p className="mt-2 text-sm text-gray-600">
                    תשובה נכונה: <strong>{q.correctAnswer}</strong>
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {!showResult ? (
                <button
                  onClick={checkAnswer}
                  disabled={
                    q.type === "multiple_choice"
                      ? !selectedAnswer
                      : !openAnswer.trim()
                  }
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  בדיקה
                </button>
              ) : (
                <button
                  onClick={nextQuestion}
                  className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  {currentIndex < questions.length - 1 ? "הבא" : "סיום"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
