import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const lectures = await prisma.lecture.findMany({
    where: {
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { rawText: { contains: q, mode: "insensitive" } },
      ],
    },
    include: { course: { select: { name: true, color: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(lectures);
}
