import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const token = String(data.get("token") || "");
  const password = String(data.get("password") || "");
  const confirmation = String(data.get("passwordConfirmation") || "");
  if (!token || password.length < 8 || password !== confirmation) {
    return formRedirect(new URL(`/redefinir-senha?token=${encodeURIComponent(token)}&erro=dados_invalidos`, req.url));
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await prisma.user.findFirst({
    where: { resetPasswordToken: tokenHash, resetPasswordExpires: { gt: new Date() } },
  });
  if (!user) return formRedirect(new URL("/redefinir-senha?erro=link_invalido", req.url));

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
  await logAudit({ userId: user.id, action: "PASSWORD_RESET", resourceType: "User", resourceId: user.id });
  return formRedirect(new URL("/entrar?sucesso=senha_redefinida", req.url));
}
