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
  const message = (formData.get("message") as string)?.trim();
  if (!message) {
    return formRedirect(new URL(`/empresa/vagas/${params.id}/editar?erro=mensagem_obrigatoria`, req.url));
  }

  const job = await prisma.job.findFirst({
    where: { id: params.id, company: { members: { some: { userId: session.userId } } } },
    select: { id: true, companyId: true },
  });
  if (!job) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });

  const request = await prisma.jobChangeRequest.create({
    data: { jobId: job.id, requestedById: session.userId, message, status: "PENDING" },
  });
  await logAudit({
    userId: session.userId,
    action: "JOB_CHANGE_REQUESTED",
    resourceType: "JobChangeRequest",
    resourceId: request.id,
    details: { jobId: job.id, companyId: job.companyId },
  });

  return formRedirect(new URL("/empresa/vagas?sucesso=alteracao_solicitada", req.url));
}
