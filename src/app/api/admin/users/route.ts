import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

const ALLOWED_ROLES = ["ASSISTED_OPERATOR", "ACA_ADMIN", "MUNICIPAL_ADMIN"];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canManageUsers(session.role)) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const data = await req.formData();
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const password = String(data.get("password") || "");
  const role = String(data.get("role") || "");
  if (!name || !email || password.length < 8 || !ALLOWED_ROLES.includes(role)) {
    return formRedirect(new URL("/admin/usuarios?erro=dados_invalidos", req.url));
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return formRedirect(new URL("/admin/usuarios?erro=email_existente", req.url));
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role,
      isEmailVerified: true,
    },
  });
  await logAudit({
    userId: session.userId,
    action: "ADMIN_USER_CREATED",
    resourceType: "User",
    resourceId: user.id,
    details: { role },
  });
  return formRedirect(new URL("/admin/usuarios?sucesso=usuario_criado", req.url));
}
