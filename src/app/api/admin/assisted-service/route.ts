import { NextRequest, NextResponse } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canPerformAssistedService } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canPerformAssistedService(session.role)) {
      return NextResponse.json({ error: "Acesso restrito a operadores de atendimento e gestores" }, { status: 403 });
    }

    const formData = await req.formData();
    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const phone = (formData.get("phone") as string)?.trim();
    const whatsapp = (formData.get("whatsapp") as string)?.trim() || phone;
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const neighborhood = (formData.get("neighborhood") as string)?.trim() || null;
    const educationLevel = (formData.get("educationLevel") as string) || "MEDIO";
    const driverLicense = (formData.get("driverLicense") as string) || "NENHUMA";
    const professionalHeadline = (formData.get("professionalHeadline") as string)?.trim() || null;
    const summary = (formData.get("summary") as string)?.trim() || null;
    const skills = (formData.get("skills") as string)?.trim() || "";
    const assistedUnit = (formData.get("assistedUnit") as string) || "Sala do Empreendedor de Arcoverde";
    const assistedNotes = (formData.get("assistedNotes") as string)?.trim() || null;
    const consentGiven = formData.get("consentGiven") === "on";

    if (!fullName || !email || !consentGiven) {
      return formRedirect(new URL("/admin/atendimento-assistido?erro=dados_incompletos", req.url));
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { candidateProfile: true },
    });

    // ERS RN009–012 / RF013: cadastro assistido não altera currículo já existente
    if (existingUser) {
      return formRedirect(new URL("/admin/atendimento-assistido?erro=email_ja_cadastrado", req.url));
    }

    const randomPassword = Math.random().toString(36).substring(2, 12) + "Acv!";
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: "CANDIDATE",
        isEmailVerified: true,
        consents: {
          create: [
            { type: "TERMS", accepted: true },
            { type: "PRIVACY", accepted: true },
            { type: "ASSISTED_SERVICE_CONSENT", accepted: true },
          ],
        },
      },
    });

    const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);

    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        whatsapp,
        city,
        neighborhood,
        educationLevel,
        driverLicense,
        professionalHeadline,
        summary,
        isAssisted: true,
        assistedById: session.userId,
        assistedUnit,
        assistedNotes,
        validationStatus: "PENDING",
      },
    });

    await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: 1,
        headline: professionalHeadline,
        summary,
        educationLevel,
        driverLicense,
        skillsSnapshot: JSON.stringify(skillsArray),
        isCurrent: true,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "ASSISTED_REGISTRATION_COMPLETED",
      resourceType: "CandidateProfile",
      resourceId: profile.id,
      details: {
        assistedUnit,
        candidateName: fullName,
        operatorName: session.name,
      },
    });

    return formRedirect(
      new URL(`/admin/atendimento-assistido?sucesso=cadastro_concluido&nome=${encodeURIComponent(fullName)}`, req.url),
    );
  } catch (error) {
    console.error("Erro no cadastro assistido:", error);
    return formRedirect(new URL("/admin/atendimento-assistido?erro=falha_servidor", req.url));
  }
}
