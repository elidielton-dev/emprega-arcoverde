import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!isMunicipalOrSuperAdmin(session.role)) {
    return NextResponse.json({ error: "Acesso restrito à gestão municipal" }, { status: 403 });
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

  await prisma.$transaction(async (tx) => {
    if (action === "PROCESS") {
      await tx.candidateProfile.deleteMany({ where: { userId: request.userId } });
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
    details: { subjectUserId: request.userId, notes },
  });

  return formRedirect(new URL("/admin/auditoria?sucesso=solicitacao_processada", req.url));
}
