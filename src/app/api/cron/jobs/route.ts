import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/audit/audit";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const urlSecret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.CRON_SECRET || "cron-secret-arcoverde-key-987654";

  const isAuthorized =
    authHeader === `Bearer ${expectedSecret}` || urlSecret === expectedSecret;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Chave CRON_SECRET inválida" }, { status: 401 });
  }

  const now = new Date();

  try {
    // 1. Encerrar vagas com prazo limite expirado
    const expiredJobsResult = await prisma.job.updateMany({
      where: {
        status: "PUBLISHED",
        applicationDeadline: {
          lt: now,
        },
      },
      data: {
        status: "CLOSED",
        closedAt: now,
      },
    });

    // 2. Atualizar status de cursos com inscrições expiradas
    const expiredCoursesResult = await prisma.course.updateMany({
      where: {
        status: "ACTIVE",
        enrollmentEnd: {
          lt: now,
        },
      },
      data: {
        status: "EXPIRED",
      },
    });

    // Auditoria da rotina programada
    await logAudit({
      action: "CRON_JOB_EXECUTED",
      resourceType: "Cron",
      details: {
        closedJobsCount: expiredJobsResult.count,
        expiredCoursesCount: expiredCoursesResult.count,
        executedAt: now.toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      closedJobs: expiredJobsResult.count,
      expiredCourses: expiredCoursesResult.count,
    });
  } catch (error) {
    console.error("Erro na execução do CRON:", error);
    return NextResponse.json({ error: "Falha na execução do agendador" }, { status: 500 });
  }
}
