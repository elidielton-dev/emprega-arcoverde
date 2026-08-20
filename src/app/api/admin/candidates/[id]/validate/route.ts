import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canValidateCurriculum } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canValidateCurriculum(session.role)) {
    return NextResponse.json({ error: "Sem permissão para validar currículos" }, { status: 403 });
  }

  const formData = await req.formData();
  const status = String(formData.get("status") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  if (!["VALIDATED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Situação inválida" }, { status: 400 });
  }

  const profile = await prisma.candidateProfile.update({
    where: { id: params.id },
    data: {
      validationStatus: status,
      validationNotes: notes,
      validatedAt: new Date(),
      validatedById: session.userId,
    },
  });

  await logAudit({
    userId: session.userId,
    action: status === "VALIDATED" ? "CURRICULUM_VALIDATED" : "CURRICULUM_REJECTED",
    resourceType: "CandidateProfile",
    resourceId: profile.id,
    details: { status, notes },
  });

  const { notifyUser } = await import("@/lib/notifications/notify");
  await notifyUser({
    userId: profile.userId,
    title: status === "VALIDATED" ? "Currículo validado" : "Currículo precisa de ajustes",
    message:
      status === "VALIDATED"
        ? "Seu currículo foi validado pela equipe institucional."
        : `Seu currículo foi marcado para revisão.${notes ? ` ${notes}` : ""}`,
    type: "SYSTEM",
    link: "/painel/curriculo",
  });

  return formRedirect(new URL("/admin/candidatos?sucesso=validacao_atualizada", req.url));
}
