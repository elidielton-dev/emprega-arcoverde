import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { attachSessionCookie } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { UserRole } from "@/lib/auth/rbac";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;
    const redirectTo = (formData.get("redirect") as string) || "";

    if (!email || !password) {
      return formRedirect(new URL("/entrar?erro=dados_invalidos", req.url));
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        companyMemberships: { take: 1 },
      },
    });

    if (!user) {
      return formRedirect(new URL("/entrar?erro=credenciais_invalidas", req.url));
    }

    if (!user.passwordHash) {
      return formRedirect(new URL("/entrar?erro=oauth_somente", req.url));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return formRedirect(new URL("/entrar?erro=credenciais_invalidas", req.url));
    }

    const companyId = user.companyMemberships[0]?.companyId;

    let destination = "/painel";
    if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
      destination = redirectTo;
    } else if (user.role === "COMPANY_MEMBER") {
      destination = "/empresa";
    } else if (user.role === "ASSISTED_OPERATOR") {
      destination = "/admin/atendimento-assistido";
    } else if (user.role !== "CANDIDATE") {
      destination = "/admin";
    }

    const response = formRedirect(new URL(destination, req.url));
    await attachSessionCookie(response, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      companyId,
    });

    await logAudit({
      userId: user.id,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: user.id,
    });

    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return formRedirect(new URL("/entrar?erro=erro_servidor", req.url));
  }
}
