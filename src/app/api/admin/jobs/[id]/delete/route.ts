import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const job = await prisma.job.delete({
      where: { id: params.id },
      select: { id: true, title: true, companyId: true },
    });

    await logAudit({
      userId: session.userId,
      action: "JOB_DELETED",
      resourceType: "Job",
      resourceId: job.id,
      details: { title: job.title, companyId: job.companyId },
    });

    return formRedirect(new URL("/admin/vagas?sucesso=vaga_excluida", req.url));
  } catch (error) {
    console.error("Erro ao excluir vaga:", error);
    return formRedirect(new URL("/admin/vagas?erro=falha_exclusao", req.url));
  }
}
