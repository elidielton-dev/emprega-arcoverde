import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const jobId = params.id;
    const formData = await req.formData();
    const action = formData.get("action") as string; // APPROVE, REJECT, PAUSE, CLOSE, PUBLISH
    const notes = (formData.get("notes") as string)?.trim() || null;

    let newStatus = "PUBLISHED";
    if (action === "APPROVE" || action === "PUBLISH") {
      newStatus = "PUBLISHED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "PAUSE") {
      newStatus = "PAUSED";
    } else if (action === "CLOSE") {
      newStatus = "CLOSED";
    }

    await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          rejectionReason: action === "REJECT" ? notes : null,
          publishedAt: newStatus === "PUBLISHED" ? new Date() : undefined,
          closedAt: newStatus === "CLOSED" ? new Date() : undefined,
        },
      }),
      prisma.jobPublicationReview.create({
        data: {
          jobId,
          reviewerId: session.userId,
          status: action,
          notes,
        },
      }),
    ]);

    await logAudit({
      userId: session.userId,
      action: `JOB_MODERATION_${action}`,
      resourceType: "Job",
      resourceId: jobId,
      details: { action, newStatus, notes },
    });

    return formRedirect(new URL(`/admin/vagas?sucesso=moderacao_concluida`, req.url));
  } catch (error) {
    console.error("Erro na moderação da vaga:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
