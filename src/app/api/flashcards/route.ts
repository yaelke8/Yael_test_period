import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");
  const lectureId = request.nextUrl.searchParams.get("lectureId");

  const where: Record<string, string> = {};
  if (courseId) where.courseId = courseId;
  if (lectureId) where.lectureId = lectureId;

  const flashcards = await prisma.flashcard.findMany({
    where,
    include: { lecture: { select: { title: true } }, course: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(flashcards);
}

export async function PUT(request: NextRequest) {
  const { id, lastResult } = await request.json();
  const updated = await prisma.flashcard.update({
    where: { id },
    data: { lastResult },
  });
  return NextResponse.json(updated);
}
