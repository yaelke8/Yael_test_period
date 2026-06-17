"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  PlusCircle,
  Layers,
  HelpCircle,
  Search,
  CalendarDays,
} from "lucide-react";

const links = [
  { href: "/courses", label: "קורסים", icon: BookOpen },
  { href: "/lectures/new", label: "הרצאה חדשה", icon: PlusCircle },
  { href: "/flashcards", label: "כרטיסיות", icon: Layers },
  { href: "/quiz", label: "תרגול", icon: HelpCircle },
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/study-plan", label: "תוכנית לימוד", icon: CalendarDays },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <aside className="hidden md:flex fixed right-0 top-0 h-full w-64 flex-col border-l bg-white shadow-sm z-30">
      <div className="flex h-16 items-center justify-center border-b">
        <h1 className="text-xl font-bold text-gray-800">📚 סיכומי לימוד</h1>
      </div>
      <nav className="flex-1 py-4">
        {links.map((l) => {
          const active = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <l.icon size={20} />
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
