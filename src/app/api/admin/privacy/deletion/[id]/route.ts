import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canDeleteCurriculum } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { notifyUser } from "@/lib/notifications/notify";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canDeleteCurriculum(session.role)) {
    return NextResponse.json({ error: "Sem permissão para processar exclusão LGPD" }, { status: 403 });
  }

  const formData = await req.formData();
  const action = String(formData.get("action") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!["PROCESS", "REJECT"].includes(action)) {
    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  }

  const request = await prisma.deletionRequest.findUnique({ where: { id: params.id } });
  if (!request || request.status !== "PENDING") {
    return NextResponse.json({ error: "Solicitação pendente não encontrada" }, { status: 404 });
  }

  const subjectUserId = request.userId;

  await prisma.$transaction(async (tx) => {
    if (action === "PROCESS") {
      const profile = await tx.candidateProfile.findUnique({
        where: { userId: subjectUserId },
        include: { documents: true },
      });

      if (profile) {
        await tx.candidateDocument.deleteMany({ where: { candidateId: profile.id } });
        await tx.candidateProfile.delete({ where: { id: profile.id } });
      }

      await tx.notification.deleteMany({ where: { userId: subjectUserId } });
      await tx.notificationPreference.deleteMany({ where: { userId: subjectUserId } });
      await tx.consent.deleteMany({ where: { userId: subjectUserId } });

      const anonEmail = `anonimizado-${subjectUserId.slice(-8)}@removido.local`;
      await tx.user.update({
        where: { id: subjectUserId },
        data: {
          name: "Titular anonimizado (LGPD)",
          email: anonEmail,
          passwordHash: null,
          supabaseUserId: null,
          avatarUrl: null,
          resetPasswordToken: null,
          resetPasswordExpires: null,
          emailVerifyToken: null,
          isEmailVerified: false,
        },
      });
    }

    await tx.deletionRequest.update({
      where: { id: request.id },
      data: {
        status: action === "PROCESS" ? "PROCESSED" : "REJECTED",
        processedAt: new Date(),
        notes,
      },
    });
  });

  await logAudit({
    userId: session.userId,
    action: action === "PROCESS" ? "DATA_DELETION_PROCESSED" : "DATA_DELETION_REJECTED",
    resourceType: "DeletionRequest",
    resourceId: request.id,
    details: { subjectUserId, notes },
  });

  if (action !== "PROCESS") {
    await notifyUser({
      userId: subjectUserId,
      title: "Solicitação LGPD não atendida",
      message: `Sua solicitação de exclusão não foi processada.${notes ? ` ${notes}` : ""}`,
      type: "SYSTEM",
      link: "/painel/privacidade",
    });
  }

  return formRedirect(new URL("/admin/auditoria?sucesso=solicitacao_processada", req.url));
}
