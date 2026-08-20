import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canDeleteCurriculum } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canDeleteCurriculum(session.role)) {
    return NextResponse.json({ error: "Somente a gestão municipal pode excluir currículos" }, { status: 403 });
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!profile) return NextResponse.json({ error: "Currículo não encontrado" }, { status: 404 });

  await prisma.candidateProfile.delete({ where: { id: profile.id } });
  await logAudit({
    userId: session.userId,
    action: "CURRICULUM_DELETED",
    resourceType: "CandidateProfile",
    resourceId: profile.id,
    details: { candidateUserId: profile.userId },
  });

  return formRedirect(new URL("/admin/candidatos?sucesso=curriculo_excluido", req.url));
}
