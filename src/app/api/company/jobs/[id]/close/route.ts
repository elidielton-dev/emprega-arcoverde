import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canEditJobAsCompany } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !canEditJobAsCompany(session.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const formData = await req.formData();
  const selectionResult = (formData.get("selectionResult") as string)?.trim() || null;
  if (selectionResult && !["FILLED", "NOT_FILLED", "CANCELLED"].includes(selectionResult)) {
    return NextResponse.json({ error: "Resultado inválido" }, { status: 400 });
  }
  const filledRaw = (formData.get("filledVacanciesCount") as string)?.trim();
  const filledVacanciesCount = filledRaw ? Math.max(0, parseInt(filledRaw, 10) || 0) : null;

  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      status: "PUBLISHED",
      company: { members: { some: { userId: session.userId } } },
    },
  });
  if (!job) return NextResponse.json({ error: "Vaga publicada não encontrada" }, { status: 404 });

  await prisma.job.update({
    where: { id: job.id },
    data: { status: "CLOSED", closedAt: new Date(), selectionResult, filledVacanciesCount },
  });
  await logAudit({
    userId: session.userId,
    action: "JOB_CLOSED_BY_COMPANY",
    resourceType: "Job",
    resourceId: job.id,
    details: { companyId: job.companyId, selectionResult, filledVacanciesCount },
  });

  return formRedirect(new URL("/empresa/vagas?sucesso=selecao_encerrada", req.url));
}
