"use client";

import { useState } from "react";
import Link from "next/link";
import { Search as SearchIcon } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  date: string;
  rawText: string;
  course: { name: string; color: string };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data);
    setSearched(true);
    setLoading(false);
  }

  function getSnippet(text: string): string {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, 200) + "...";
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + query.length + 80);
    return (
      (start > 0 ? "..." : "") +
      text.slice(start, end) +
      (end < text.length ? "..." : "")
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">חיפוש</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש בסיכומים..."
          className="flex-1 rounded-lg border px-4 py-2.5 text-right focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          autoFocus
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <SearchIcon size={18} />
          חיפוש
        </button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : searched && results.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-gray-500">לא נמצאו תוצאות עבור &quot;{query}&quot;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <Link
              key={r.id}
              href={`/lectures/${r.id}`}
              className="block rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="rounded px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: r.course.color }}
                >
                  {r.course.name}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(r.date).toLocaleDateString("he-IL")}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{r.title}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {getSnippet(r.rawText)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
