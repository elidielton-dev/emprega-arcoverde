import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { isAdmin } from "@/lib/auth/rbac";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const applicationId = params.id;
    const formData = await req.formData();
    const newStatus = formData.get("status") as string;
    const notes = (formData.get("notes") as string)?.trim() || null;

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Candidatura não encontrada" }, { status: 404 });
    }

    // Verificar permissão da empresa
    if (session.role === "COMPANY_MEMBER" && application.job.companyId !== session.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
      }),
      prisma.applicationStatusHistory.create({
        data: {
          applicationId,
          status: newStatus,
          notes,
          changedById: session.userId,
        },
      }),
    ]);

    await logAudit({
      userId: session.userId,
      action: "APPLICATION_STATUS_UPDATED",
      resourceType: "Application",
      resourceId: applicationId,
      details: { newStatus, notes },
    });

    return formRedirect(new URL(`/empresa/vagas/${application.jobId}/candidaturas?sucesso=status_atualizado`, req.url));
  } catch (error) {
    console.error("Erro ao atualizar status da candidatura:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
