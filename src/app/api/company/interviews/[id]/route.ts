import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { generateInterviewInviteEmail, sendEmail } from "@/lib/mail/mailer";

const MODALITIES = ["PRESENCIAL", "ONLINE", "HIBRIDO"] as const;
const STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;

async function loadOwnedInterview(id: string, session: { role: string; companyId?: string | null }) {
  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          job: true,
          candidate: { include: { user: true } },
        },
      },
    },
  });
  if (!interview) return { error: NextResponse.json({ error: "Entrevista não encontrada" }, { status: 404 }) };
  if (
    session.role === "COMPANY_MEMBER" &&
    interview.application.job.companyId !== session.companyId
  ) {
    return { error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
  }
  return { interview };
}

/** Atualiza entrevista: reagendar, status, feedback. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const loaded = await loadOwnedInterview(params.id, session);
    if ("error" in loaded && loaded.error) return loaded.error;
    const interview = loaded.interview!;

    const formData = await req.formData();
    const action = String(formData.get("action") || "update").trim();

    if (action === "reschedule") {
      const scheduledAtValue = String(formData.get("scheduledAt") || "").trim();
      const location = String(formData.get("location") || "").trim() || null;
      const instructions = String(formData.get("instructions") || "").trim() || null;
      const modalityRaw = String(formData.get("modality") || interview.modality).trim().toUpperCase();
      const interviewer = String(formData.get("interviewer") || "").trim() || null;
      const modality = MODALITIES.includes(modalityRaw as (typeof MODALITIES)[number])
        ? modalityRaw
        : interview.modality;
      const scheduledAt = scheduledAtValue ? new Date(scheduledAtValue) : null;
      if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) {
        return NextResponse.json({ error: "Informe data e hora válidas" }, { status: 400 });
      }

      await prisma.interview.update({
        where: { id: interview.id },
        data: {
          scheduledAt,
          location,
          instructions,
          modality,
          interviewer,
          status: "SCHEDULED",
          feedback: null,
          rating: null,
          completedAt: null,
        },
      });

      await logAudit({
        userId: session.userId,
        action: "INTERVIEW_RESCHEDULED",
        resourceType: "Interview",
        resourceId: interview.id,
        details: { scheduledAt: scheduledAt.toISOString() },
      });

      if (formData.get("sendInvite") !== "0") {
        await sendEmail({
          to: interview.application.candidate.user.email,
          subject: `Entrevista reagendada: ${interview.application.job.title}`,
          html: generateInterviewInviteEmail(
            interview.application.candidate.fullName,
            interview.application.job.title,
            scheduledAt,
            location,
            instructions,
          ),
        });
      }

      return formRedirect(new URL("/empresa/entrevistas?sucesso=reagendada", req.url));
    }

    if (action === "feedback") {
      const feedback = String(formData.get("feedback") || "").trim() || null;
      const ratingRaw = String(formData.get("rating") || "").trim();
      const rating = ratingRaw ? Number(ratingRaw) : null;
      if (rating !== null && (Number.isNaN(rating) || rating < 1 || rating > 5)) {
        return NextResponse.json({ error: "Nota deve ser de 1 a 5" }, { status: 400 });
      }
      const nextAppStatus = String(formData.get("applicationStatus") || "").trim();

      await prisma.$transaction(async (tx) => {
        await tx.interview.update({
          where: { id: interview.id },
          data: {
            feedback,
            rating,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        if (nextAppStatus === "APPROVED" || nextAppStatus === "NOT_SELECTED") {
          await tx.application.update({
            where: { id: interview.applicationId },
            data: { status: nextAppStatus },
          });
          await tx.applicationStatusHistory.create({
            data: {
              applicationId: interview.applicationId,
              status: nextAppStatus,
              notes: feedback ? `Feedback da entrevista: ${feedback}` : "Feedback da entrevista registrado",
              changedById: session.userId,
            },
          });
        }
      });

      await logAudit({
        userId: session.userId,
        action: "INTERVIEW_FEEDBACK",
        resourceType: "Interview",
        resourceId: interview.id,
        details: { rating, nextAppStatus: nextAppStatus || null },
      });

      return formRedirect(new URL("/empresa/entrevistas?sucesso=feedback", req.url));
    }

    if (action === "status") {
      const status = String(formData.get("status") || "").trim().toUpperCase();
      if (!STATUSES.includes(status as (typeof STATUSES)[number])) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }

      await prisma.interview.update({
        where: { id: interview.id },
        data: {
          status,
          completedAt: status === "COMPLETED" || status === "NO_SHOW" ? new Date() : interview.completedAt,
        },
      });

      await logAudit({
        userId: session.userId,
        action: "INTERVIEW_STATUS_UPDATED",
        resourceType: "Interview",
        resourceId: interview.id,
        details: { status },
      });

      return formRedirect(new URL("/empresa/entrevistas?sucesso=status", req.url));
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Erro ao atualizar entrevista:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
