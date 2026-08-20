import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { isAdmin } from "@/lib/auth/rbac";
import { formRedirect } from "@/lib/http/form-redirect";
import { generateInterviewInviteEmail, sendEmail } from "@/lib/mail/mailer";

const ALLOWED_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "CONTACT_SELECTED",
  "INTERVIEW_SCHEDULED",
  "APPROVED",
  "NOT_SELECTED",
  "WITHDRAWN",
];

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
    const scheduledAtValue = (formData.get("scheduledAt") as string)?.trim();
    const location = (formData.get("location") as string)?.trim() || null;
    const instructions = (formData.get("instructions") as string)?.trim() || null;
    const modalityRaw = ((formData.get("modality") as string) || "PRESENCIAL").trim().toUpperCase();
    const interviewer = (formData.get("interviewer") as string)?.trim() || null;
    const modality = ["PRESENCIAL", "ONLINE", "HIBRIDO"].includes(modalityRaw)
      ? modalityRaw
      : "PRESENCIAL";

    if (!ALLOWED_STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }
    const scheduledAt = scheduledAtValue ? new Date(scheduledAtValue) : null;
    if (newStatus === "INTERVIEW_SCHEDULED" && (!scheduledAt || Number.isNaN(scheduledAt.getTime()))) {
      return NextResponse.json({ error: "Informe data e hora válidas para a entrevista" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: { include: { user: true } },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Candidatura não encontrada" }, { status: 404 });
    }

    // Verificar permissão da empresa
    if (session.role === "COMPANY_MEMBER" && application.job.companyId !== session.companyId) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.application.update({
        where: { id: applicationId },
        data: { status: newStatus },
      });
      await tx.applicationStatusHistory.create({
        data: {
          applicationId,
          status: newStatus,
          notes,
          changedById: session.userId,
        },
      });
      if (newStatus === "INTERVIEW_SCHEDULED" && scheduledAt) {
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
          },
        });
      }
    });

    await logAudit({
      userId: session.userId,
      action: "APPLICATION_STATUS_UPDATED",
      resourceType: "Application",
      resourceId: applicationId,
      details: { newStatus, notes, scheduledAt: scheduledAt?.toISOString(), location },
    });

    if (newStatus === "INTERVIEW_SCHEDULED" && scheduledAt) {
      await sendEmail({
        to: application.candidate.user.email,
        subject: `Entrevista agendada: ${application.job.title}`,
        html: generateInterviewInviteEmail(
          application.candidate.fullName,
          application.job.title,
          scheduledAt,
          location,
          instructions,
        ),
      });
    }

    return formRedirect(
      new URL(
        `/empresa/candidatos?vaga=${application.jobId}&app=${applicationId}&sucesso=status_atualizado`,
        req.url,
      ),
    );
  } catch (error) {
    console.error("Erro ao atualizar status da candidatura:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
