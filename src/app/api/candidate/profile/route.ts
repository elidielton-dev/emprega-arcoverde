import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return formRedirect(new URL("/entrar", req.url));
    }

    const formData = await req.formData();
    const fullName = (formData.get("fullName") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim() || null;
    const whatsapp = (formData.get("whatsapp") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const state = (formData.get("state") as string)?.trim() || "PE";
    const neighborhood = (formData.get("neighborhood") as string)?.trim() || null;
    const educationLevel = (formData.get("educationLevel") as string) || "MEDIO";
    const driverLicense = (formData.get("driverLicense") as string) || "NENHUMA";
    const professionalHeadline = (formData.get("professionalHeadline") as string)?.trim() || null;
    const summary = (formData.get("summary") as string)?.trim() || null;
    const availability = (formData.get("availability") as string) || "INTEGRAL";
    const accessibilityNeeds = (formData.get("accessibilityNeeds") as string)?.trim() || null;
    const emailConsent = formData.get("emailConsent") === "on";
    const whatsappConsent = formData.get("whatsappConsent") === "on";

    const profile = await prisma.candidateProfile.upsert({
      where: { userId: session.userId },
      update: {
        fullName,
        phone,
        whatsapp,
        city,
        state,
        neighborhood,
        educationLevel,
        driverLicense,
        professionalHeadline,
        summary,
        availability,
        accessibilityNeeds,
        emailConsent,
        whatsappConsent,
      },
      create: {
        userId: session.userId,
        fullName,
        phone,
        whatsapp,
        city,
        state,
        neighborhood,
        educationLevel,
        driverLicense,
        professionalHeadline,
        summary,
        availability,
        accessibilityNeeds,
        emailConsent,
        whatsappConsent,
      },
    });

    // Registrar consentimentos LGPD se alterados
    await prisma.consent.createMany({
      data: [
        { userId: session.userId, type: "EMAIL_COMMUNICATION", accepted: emailConsent },
        { userId: session.userId, type: "WHATSAPP_COMMUNICATION", accepted: whatsappConsent },
      ],
    });

    await logAudit({
      userId: session.userId,
      action: "CANDIDATE_PROFILE_UPDATED",
      resourceType: "CandidateProfile",
      resourceId: profile.id,
    });

    return formRedirect(new URL("/painel/perfil?sucesso=salvo", req.url));
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return formRedirect(new URL("/painel/perfil?erro=falha", req.url));
  }
}
