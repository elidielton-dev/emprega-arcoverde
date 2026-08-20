import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  if (params.id === session.userId) {
    return NextResponse.json({ error: "Você não pode excluir a própria conta" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { role: true } });
  if (!target || !["ASSISTED_OPERATOR", "ACA_ADMIN", "MUNICIPAL_ADMIN"].includes(target.role)) {
    return NextResponse.json({ error: "Usuário administrativo não encontrado" }, { status: 404 });
  }
  await prisma.user.delete({ where: { id: params.id } });
  await logAudit({ userId: session.userId, action: "ADMIN_USER_DELETED", resourceType: "User", resourceId: params.id });
  return formRedirect(new URL("/admin/usuarios?sucesso=usuario_excluido", req.url));
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const data = await req.formData();
  if (data.get("_method") !== "DELETE") return NextResponse.json({ error: "Método inválido" }, { status: 405 });
  return DELETE(req, context);
}
