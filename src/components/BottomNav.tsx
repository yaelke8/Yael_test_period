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
  { href: "/lectures/new", label: "חדש", icon: PlusCircle },
  { href: "/flashcards", label: "כרטיסיות", icon: Layers },
  { href: "/quiz", label: "תרגול", icon: HelpCircle },
  { href: "/search", label: "חיפוש", icon: Search },
  { href: "/study-plan", label: "תוכנית", icon: CalendarDays },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-white py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      {links.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 text-[10px] ${
              active ? "text-blue-700 font-semibold" : "text-gray-500"
            }`}
          >
            <l.icon size={20} />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
