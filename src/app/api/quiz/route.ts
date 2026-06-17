import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");

  const where: Record<string, string> = {};
  if (courseId) where.courseId = courseId;

  const questions = await prisma.quizQuestion.findMany({
    where,
    include: { lecture: { select: { title: true } }, course: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(questions);
}
