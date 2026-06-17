import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const lecture = await prisma.lecture.create({
    data: {
      courseId: body.courseId,
      title: body.title,
      rawText: body.rawText,
      contentBlocks: body.contentBlocks || [],
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  if (body.flashcards?.length) {
    await prisma.flashcard.createMany({
      data: body.flashcards.map((f: { front: string; back: string }) => ({
        lectureId: lecture.id,
        courseId: body.courseId,
        front: f.front,
        back: f.back,
      })),
    });
  }

  if (body.quizQuestions?.length) {
    await prisma.quizQuestion.createMany({
      data: body.quizQuestions.map(
        (q: {
          type: string;
          question: string;
          options?: string[];
          correctAnswer: string;
        }) => ({
          lectureId: lecture.id,
          courseId: body.courseId,
          type: q.type,
          question: q.question,
          options: q.options || null,
          correctAnswer: q.correctAnswer,
        })
      ),
    });
  }

  return NextResponse.json(lecture, { status: 201 });
}
