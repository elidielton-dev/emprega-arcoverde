import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { generateInterviewInviteEmail } from "@/lib/mail/mailer";
import { sendEmailIfAllowed } from "@/lib/notifications/preferences";

const MODALITIES = ["PRESENCIAL", "ONLINE", "HIBRIDO"] as const;

/** Agenda (ou reagenda) entrevista a partir de uma candidatura. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const applicationId = String(formData.get("applicationId") || "").trim();
    const scheduledAtValue = String(formData.get("scheduledAt") || "").trim();
    const location = String(formData.get("location") || "").trim() || null;
    const instructions = String(formData.get("instructions") || "").trim() || null;
    const modalityRaw = String(formData.get("modality") || "PRESENCIAL").trim().toUpperCase();
    const interviewer = String(formData.get("interviewer") || "").trim() || null;
    const sendInvite = formData.get("sendInvite") !== "0";

    const modality = MODALITIES.includes(modalityRaw as (typeof MODALITIES)[number])
      ? modalityRaw
      : "PRESENCIAL";

    const scheduledAt = scheduledAtValue ? new Date(scheduledAtValue) : null;
    if (!applicationId || !scheduledAt || Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Candidatura e data/hora são obrigatórios" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { include: { user: true } },
        interview: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Candidatura não encontrada" }, { status: 404 });
    }
    if (session.role === "COMPANY_MEMBER" && application.job.companyId !== session.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.interview.upsert({
        where: { applicationId },
        update: {
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
        create: {
          applicationId,
          scheduledAt,
          location,
          instructions,
          modality,
          interviewer,
          status: "SCHEDULED",
        },
      });

      if (application.status !== "INTERVIEW_SCHEDULED") {
        await tx.application.update({
          where: { id: applicationId },
          data: { status: "INTERVIEW_SCHEDULED" },
        });
        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            status: "INTERVIEW_SCHEDULED",
            notes: application.interview ? "Entrevista reagendada" : "Entrevista agendada",
            changedById: session.userId,
          },
        });
      }
    });

    await logAudit({
      userId: session.userId,
      action: application.interview ? "INTERVIEW_RESCHEDULED" : "INTERVIEW_SCHEDULED",
      resourceType: "Interview",
      resourceId: applicationId,
      details: { scheduledAt: scheduledAt.toISOString(), modality, interviewer, location },
    });

    if (sendInvite) {
      await sendEmailIfAllowed(application.candidate.userId, {
        to: application.candidate.user.email,
        subject: `Entrevista agendada: ${application.job.title}`,
        html: generateInterviewInviteEmail(
          application.candidate.fullName,
          application.job.title,
          scheduledAt,
          location,
          instructions,
        ),
        kind: "status",
      });
    }

    return formRedirect(new URL("/empresa/entrevistas?sucesso=agendada", req.url));
  } catch (error) {
    console.error("Erro ao agendar entrevista:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
