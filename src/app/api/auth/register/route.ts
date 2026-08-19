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
    const name = (formData.get("name") as string)?.trim();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const password = formData.get("password") as string;
    const role = "CANDIDATE";
    const acceptTerms = formData.get("acceptTerms") === "on" || formData.get("acceptTerms") === "true";

    if ((formData.get("role") as string) === "COMPANY_MEMBER") {
      return formRedirect(new URL("/empresas/interesse", req.url));
    }

    if (!name || !email || !password || password.length < 6) {
      return formRedirect(new URL("/cadastro?erro=dados_invalidos", req.url));
    }

    if (!acceptTerms) {
      return formRedirect(new URL("/cadastro?erro=aceite_obrigatorio", req.url));
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return formRedirect(new URL("/cadastro?erro=email_existente", req.url));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isEmailVerified: true, // Auto verificado em dev
        consents: {
          create: [
            { type: "TERMS", accepted: true },
            { type: "PRIVACY", accepted: true },
            { type: "EMAIL_COMMUNICATION", accepted: true },
          ],
        },
      },
    });

    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName: name,
        city: "Arcoverde",
        state: "PE",
        educationLevel: "MEDIO",
      },
    });

    await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: 1,
        educationLevel: "MEDIO",
        skillsSnapshot: JSON.stringify([]),
      },
    });

    const destination = "/painel/curriculo?sucesso=bem_vindo";

    const response = formRedirect(new URL(destination, req.url));
    await attachSessionCookie(response, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    });

    await logAudit({
      userId: user.id,
      action: "USER_REGISTERED",
      resourceType: "User",
      resourceId: user.id,
    });

    return response;
  } catch (error) {
    console.error("Erro no cadastro:", error);
    return formRedirect(new URL("/cadastro?erro=erro_servidor", req.url));
  }
}
