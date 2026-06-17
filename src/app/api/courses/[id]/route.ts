import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      lectures: { orderBy: { date: "desc" } },
      _count: { select: { lectures: true, flashcards: true, quizQuestions: true } },
    },
  });
  if (!course) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(course);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const course = await prisma.course.update({
    where: { id },
    data: {
      name: body.name,
      color: body.color,
      examDate: body.examDate ? new Date(body.examDate) : null,
      studyDaysPlanned: body.studyDaysPlanned || null,
    },
  });
  return NextResponse.json(course);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.course.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
