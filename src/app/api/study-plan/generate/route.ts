import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const apiKey = process.env.ANTHROPIC_API_KEY || "";
const isOpenRouter = apiKey.startsWith("sk-or-");
const anthropic = new Anthropic({
  apiKey,
  ...(isOpenRouter && { baseURL: "https://openrouter.ai/api" }),
});

interface MaterialInput {
  fileName: string;
  type: "syllabus" | "exam" | "homework";
  text: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      courseId,
      examDate,
      studyDays,
      practiceExams,
      examOnlyDays,
      syllabusText,
      materials,
    } = (await request.json()) as {
      courseId: string;
      examDate: string;
      studyDays: number;
      practiceExams: number;
      examOnlyDays?: number;
      syllabusText?: string;
      materials?: MaterialInput[];
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "מפתח API לא הוגדר" },
        { status: 500 }
      );
    }

    const lectures = await prisma.lecture.findMany({
      where: { courseId },
      select: { id: true, title: true },
      orderBy: { date: "asc" },
    });

    const lectureSummary = lectures
      .map((l, i) => `${i + 1}. ${l.title} (id: ${l.id})`)
      .join("\n");

    // Build materials sections for the prompt
    const syllabusMaterials = (materials || []).filter(
      (m) => m.type === "syllabus"
    );
    const examMaterials = (materials || []).filter((m) => m.type === "exam");
    const homeworkMaterials = (materials || []).filter(
      (m) => m.type === "homework"
    );

    const effectiveExamOnlyDays = examOnlyDays ?? 3;

    const systemPrompt = `אתה עוזר לימודי מומחה שיוצר תוכניות לימוד מפורטות לקראת מבחנים.
צור תוכנית לימוד יומית בפורמט JSON בלבד.

## כללים קריטיים לתזמון:

1. **${effectiveExamOnlyDays} הימים האחרונים לפני המבחן מוקדשים למבחנים בלבד** — רק פתרון מבחנים לדוגמה, חזרה על מבחנים שכבר נפתרו, ותרגול בתנאי מבחן. אסור לשבץ חומר חדש או חזרה רגילה בימים אלו.

2. **נושאי הסילבוס** — אם סופק סילבוס, חלקי את כל הנושאים שבו לימי הלימוד (לא כולל ימי המבחנים בסוף). כל נושא מהסילבוס חייב להופיע לפחות פעם אחת כחומר חדש ופעם אחת כחזרה.

3. **תרגילים ושיעורי בית** — שבצי פתרון תרגילים בימים שאחרי לימוד הנושא הרלוונטי. תרגילים עוזרים להעמיק הבנה.

4. **מבחנים לדוגמה** — שבצי ${practiceExams || 0} מבחני תרגול. כולם חייבים להיות ב-${effectiveExamOnlyDays} הימים האחרונים.

5. **חזרה מרווחת (Spaced Repetition)** — כל נושא חדש צריך חזרה 2-3 ימים אחריו.

6. **שילוב נושאים (Interleaving)** — לא ללמוד נושא אחד יום שלם. לשלב 2-3 נושאים ביום.

7. **נושאים מורכבים** — הקדישי להם יותר זמן. אם ניתן לזהות נושאים מורכבים מהחומרים, תני להם עדיפות.

## סוגי ימים (kind):
- "new" — לימוד חומר חדש (נושא מהסילבוס/הרצאה)
- "review" — חזרה על חומר שנלמד
- "homework" — פתרון תרגיל / שיעורי בית
- "practice_exam" — פתרון מבחן לדוגמה (רק ב-${effectiveExamOnlyDays} ימים אחרונים!)
- "syllabus_review" — מעבר ממוקד על נושאי סילבוס

## פורמט JSON:
{
  "dailyAssignments": [
    {
      "day": 1,
      "date": "2025-01-15",
      "kind": "new|review|homework|practice_exam|syllabus_review",
      "description": "תיאור מפורט של מה ללמוד / לתרגל, כולל שמות הנושאים",
      "lectureIds": ["id1", "id2"],
      "done": false
    }
  ]
}

החזר JSON בלבד. אל תוסיף טקסט מחוץ ל-JSON.`;

    // Build user prompt with all materials
    let userPrompt = `צור תוכנית לימוד:
- תאריך מבחן: ${examDate}
- מספר ימי לימוד: ${studyDays}
- מספר מבחני תרגול: ${practiceExams || 0}
- ימים לפני המבחן שמוקדשים למבחנים בלבד: ${effectiveExamOnlyDays}

הרצאות בקורס:
${lectureSummary || "אין הרצאות עדיין"}`;

    if (syllabusMaterials.length > 0) {
      userPrompt += "\n\n--- סילבוס (מקבצים שהועלו) ---";
      for (const m of syllabusMaterials) {
        userPrompt += `\n\n### קובץ: ${m.fileName}\n${m.text.slice(0, 8000)}`;
      }
    }

    if (syllabusText) {
      userPrompt += `\n\n--- סילבוס (טקסט חופשי) ---\n${syllabusText}`;
    }

    if (examMaterials.length > 0) {
      userPrompt += "\n\n--- מבחנים לדוגמה ---";
      for (const m of examMaterials) {
        userPrompt += `\n\n### קובץ: ${m.fileName}\n${m.text.slice(0, 6000)}`;
      }
      userPrompt += `\n\nיש ${examMaterials.length} מבחנים לדוגמה. שבצי אותם ב-${effectiveExamOnlyDays} הימים האחרונים לפני המבחן.`;
    }

    if (homeworkMaterials.length > 0) {
      userPrompt += "\n\n--- תרגילים / שיעורי בית ---";
      for (const m of homeworkMaterials) {
        userPrompt += `\n\n### קובץ: ${m.fileName}\n${m.text.slice(0, 4000)}`;
      }
      userPrompt += `\n\nיש ${homeworkMaterials.length} תרגילים. שבצי אותם אחרי הנושאים הרלוונטיים.`;
    }

    const message = await anthropic.messages.create({
      model: isOpenRouter ? "anthropic/claude-sonnet-4" : "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
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
