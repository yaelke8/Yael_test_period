import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { lectures: true } },
      studyPlan: { select: { dailyAssignments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(courses);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const course = await prisma.course.create({
    data: {
      name: body.name,
      color: body.color || "#3B82F6",
      examDate: body.examDate ? new Date(body.examDate) : null,
      studyDaysPlanned: body.studyDaysPlanned || null,
    },
  });
  return NextResponse.json(course, { status: 201 });
}
