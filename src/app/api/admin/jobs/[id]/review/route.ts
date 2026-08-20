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
    const action = formData.get("action") as string;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const selectionResult = (formData.get("selectionResult") as string)?.trim() || null;
    const filledRaw = (formData.get("filledVacanciesCount") as string)?.trim();
    const filledVacanciesCount = filledRaw ? Math.max(0, parseInt(filledRaw, 10) || 0) : null;
    const allowedActions = ["APPROVE", "PUBLISH", "REOPEN", "REJECT", "PAUSE", "CLOSE", "SELECTION_RESULT"];
    if (!allowedActions.includes(action)) {
      return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    }

    let newStatus = "PUBLISHED";
    if (action === "APPROVE" || action === "PUBLISH" || action === "REOPEN") {
      newStatus = "PUBLISHED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
    } else if (action === "PAUSE") {
      newStatus = "PAUSED";
    } else if (action === "CLOSE" || action === "SELECTION_RESULT") {
      newStatus = "CLOSED";
    }

    if (action === "SELECTION_RESULT" && !["FILLED", "NOT_FILLED", "CANCELLED"].includes(selectionResult || "")) {
      return NextResponse.json({ error: "Resultado da seleção inválido" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.job.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          rejectionReason: action === "REJECT" ? notes : null,
          publishedAt: newStatus === "PUBLISHED" ? new Date() : undefined,
          closedAt: newStatus === "CLOSED" ? new Date() : newStatus === "PUBLISHED" ? null : undefined,
          selectionResult: action === "SELECTION_RESULT" ? selectionResult : action === "REOPEN" ? null : undefined,
          filledVacanciesCount: action === "SELECTION_RESULT" ? filledVacanciesCount : action === "REOPEN" ? null : undefined,
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
      details: { action, newStatus, notes, selectionResult, filledVacanciesCount },
    });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { title: true, companyId: true },
    });
    if (job && ["APPROVE", "PUBLISH", "REOPEN", "REJECT", "PAUSE", "CLOSE"].includes(action)) {
      const { notifyCompanyMembers } = await import("@/lib/notifications/notify");
      const messages: Record<string, string> = {
        APPROVE: `A vaga "${job.title}" foi aprovada e publicada.`,
        PUBLISH: `A vaga "${job.title}" foi publicada.`,
        REOPEN: `A vaga "${job.title}" foi reaberta.`,
        REJECT: `A vaga "${job.title}" foi rejeitada.${notes ? ` Motivo: ${notes}` : ""}`,
        PAUSE: `A vaga "${job.title}" foi pausada.`,
        CLOSE: `A vaga "${job.title}" foi encerrada.`,
      };
      await notifyCompanyMembers(job.companyId, {
        title: "Moderação de vaga",
        message: messages[action] || `Status atualizado: ${newStatus}`,
        type: "JOB_ALERT",
        link: "/empresa/vagas",
      });
    }

    return formRedirect(new URL(`/admin/vagas?sucesso=moderacao_concluida`, req.url));
  } catch (error) {
    console.error("Erro na moderação da vaga:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
