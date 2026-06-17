import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!courseId) {
    const plans = await prisma.studyPlan.findMany({
      include: { course: { select: { name: true, color: true } } },
    });
    return NextResponse.json(plans);
  }
  const plan = await prisma.studyPlan.findUnique({ where: { courseId } });
  return NextResponse.json(plan);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const plan = await prisma.studyPlan.upsert({
    where: { courseId: body.courseId },
    create: {
      courseId: body.courseId,
      examDate: new Date(body.examDate),
      studyDays: body.studyDays,
      dailyAssignments: body.dailyAssignments,
    },
    update: {
      examDate: new Date(body.examDate),
      studyDays: body.studyDays,
      dailyAssignments: body.dailyAssignments,
    },
  });
  return NextResponse.json(plan);
}

export async function PUT(request: NextRequest) {
  const { courseId, dailyAssignments } = await request.json();
  const plan = await prisma.studyPlan.update({
    where: { courseId },
    data: { dailyAssignments },
  });
  return NextResponse.json(plan);
}
