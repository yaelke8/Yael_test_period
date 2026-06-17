import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { courseId, examDate, studyDays, practiceExams, syllabusText } =
      await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "מפתח API לא הוגדר" },
        { status: 500 }
      );
    }

    const lectures = await prisma.lecture.findMany({
      where: { courseId },
      select: { id: true, title: true, contentBlocks: true },
      orderBy: { date: "asc" },
    });

    const lectureSummary = lectures
      .map((l, i) => `${i + 1}. ${l.title} (id: ${l.id})`)
      .join("\n");

    const systemPrompt = `אתה עוזר לימודי שיוצר תוכניות לימוד לקראת מבחנים.
צור תוכנית לימוד יומית בפורמט JSON בלבד.

עקרונות:
- חזרה מרווחת (Spaced Repetition): חלוקת החזרות על פני מספר ימים
- שילוב נושאים (Interleaving): לא ללמוד נושא אחד ביום שלם
- יותר זמן לנושאים מורכבים
- מבחני תרגול קרוב יותר לתאריך המבחן
- מגוון סוגי למידה: חומר חדש, חזרה, ומבחן תרגול

החזר JSON בלבד בפורמט:
{
  "dailyAssignments": [
    {
      "day": 1,
      "date": "2025-01-15",
      "kind": "new|review|practice_exam",
      "description": "תיאור קצר של מה ללמוד",
      "lectureIds": ["id1", "id2"],
      "done": false
    }
  ]
}`;

    const userPrompt = `צור תוכנית לימוד:
- תאריך מבחן: ${examDate}
- מספר ימי לימוד: ${studyDays}
- מספר מבחני תרגול: ${practiceExams || 0}

הרצאות בקורס:
${lectureSummary || "אין הרצאות עדיין"}

${syllabusText ? `סילבוס נוסף:\n${syllabusText}` : ""}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Study plan generation error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת תוכנית הלימוד" },
      { status: 500 }
    );
  }
}
