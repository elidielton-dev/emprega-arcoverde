import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const courseId = params.id;

  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.redirect(new URL("/cursos", req.url));
    }

    // Registrar evento e incrementar métrica
    await Promise.all([
      prisma.course.update({
        where: { id: courseId },
        data: { clicksCount: { increment: 1 } },
      }),
      prisma.courseClickEvent.create({
        data: {
          courseId,
          referrer: req.headers.get("referer") || null,
          userAgent: req.headers.get("user-agent") || null,
        },
      }),
    ]).catch(() => {});

    return NextResponse.redirect(new URL(course.externalUrl));
  } catch (error) {
    console.error("Erro ao registrar clique no curso:", error);
    return NextResponse.redirect(new URL("/cursos", req.url));
  }
}
