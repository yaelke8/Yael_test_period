import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `אתה עוזר לימודי שמייצר סיכומי הרצאות בפורמט JSON מובנה.
עליך להחזיר JSON בלבד (ללא markdown, ללא בלוקים של קוד), בפורמט הבא:

{
  "contentBlocks": [
    // מערך בלוקים מסוג:
    // heading1 - נושא ראשי (צבע ציאן #1E88B5, מודגש, קו תחתון)
    // heading2 - תת-נושא (צבע ירוק #2E8B57, מודגש)
    // heading3 - כותרת משנה כמו "דוגמה מספרית" (צבע כתום בהיר #E08E2B, מודגש, קו תחתון)
    // paragraph - פסקת טקסט רגילה. השתמש ב-**טקסט** להדגשה. מונחים באנגלית בסוגריים.
    // bullet - רשימת תבליטים עם שדה items (מערך מחרוזות)
    // noteBox - תיבת הדגשה (דבר שהמרצה הדגיש)
    // formulaBox - תיבת נוסחה (רקע אפור, גופן monospace)
    // table - טבלה עם שדות headers (מערך) ו-rows (מערך של מערכים)
    // timeline - ציר זמן מספרי כטקסט פשוט עם שדה items
  ],
  "flashcards": [
    { "front": "שאלה", "back": "תשובה" }
  ],
  "quizQuestions": [
    {
      "type": "multiple_choice",
      "question": "שאלה",
      "options": ["א", "ב", "ג", "ד"],
      "correctAnswer": "א"
    },
    {
      "type": "open_short",
      "question": "שאלה פתוחה",
      "correctAnswer": "תשובה"
    }
  ]
}

כללי סגנון:
- כל הטקסט בעברית פשוטה. מונחים באנגלית בסוגריים.
- הדגשה על מושגי מפתח עם **מודגש**
- מבנה: נושאים → דגשים למבחן → מילון מושגים (table) → נוסחאות מרכזיות (בסוף)
- צירי זמן מספריים כטקסט פשוט (timeline), לא כטבלה
- ייצר 8-15 כרטיסיות (flashcards) ו-5-10 שאלות תרגול (quizQuestions)
- ודא שה-JSON תקין. אל תוסיף שום טקסט מחוץ ל-JSON.`;

export async function POST(request: NextRequest) {
  try {
    const { rawText, title } = await request.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "מפתח API של Anthropic לא הוגדר" },
        { status: 500 }
      );
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `סכם את ההרצאה הבאה בנושא "${title}":\n\n${rawText}`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "שגיאה בפענוח תגובת ה-AI", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "שגיאה ביצירת הסיכום" },
      { status: 500 }
    );
  }
}
