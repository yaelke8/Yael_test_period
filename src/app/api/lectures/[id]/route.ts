import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lecture = await prisma.lecture.findUnique({
    where: { id },
    include: { course: true },
  });
  if (!lecture) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(lecture);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const lecture = await prisma.lecture.update({
    where: { id },
    data: { contentBlocks: body.contentBlocks },
  });
  return NextResponse.json(lecture);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.lecture.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
