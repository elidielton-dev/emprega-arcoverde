import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { scoreApplicationAgainstJob, serializeAtsResult } from "@/lib/matching/ats";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

/** Recalcula o ranking ATS de todas as candidaturas da vaga. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      applications: {
        include: {
          candidate: {
            include: {
              documents: true,
              resumeVersions: {
                where: { isCurrent: true },
                include: {
                  experiences: true,
                  educations: true,
                  courses: true,
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!job) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  if (session.role === "COMPANY_MEMBER" && job.companyId !== session.companyId) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  for (const app of job.applications) {
    const match = await scoreApplicationAgainstJob(app.candidate, job, { coverNote: app.coverNote });
    await prisma.application.update({
      where: { id: app.id },
      data: serializeAtsResult(match),
    });
  }

  await logAudit({
    userId: session.userId,
    action: "ATS_RANKING_REFRESHED",
    resourceType: "Job",
    resourceId: job.id,
    details: { applications: job.applications.length },
  });

  return formRedirect(new URL(`/empresa/vagas/${job.id}/candidaturas?sucesso=triagem_atualizada`, req.url));
}
