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

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
      include: {
        resumeVersions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!profile) {
      return formRedirect(new URL("/painel/perfil", req.url));
    }

    const formData = await req.formData();
    const summary = (formData.get("summary") as string)?.trim() || "";
    const skills = (formData.get("skills") as string)?.trim() || "";
    const headline = (formData.get("headline") as string)?.trim() || "";

    // Experiência simples
    const expCompany = (formData.get("expCompany") as string)?.trim();
    const expPosition = (formData.get("expPosition") as string)?.trim();
    const expDescription = (formData.get("expDescription") as string)?.trim();

    // Formação simples
    const eduInstitution = (formData.get("eduInstitution") as string)?.trim();
    const eduCourse = (formData.get("eduCourse") as string)?.trim();
    const eduLevel = (formData.get("eduLevel") as string) || "MEDIO";

    // Curso simples
    const courseTitle = (formData.get("courseTitle") as string)?.trim();
    const courseInstitution = (formData.get("courseInstitution") as string)?.trim();

    const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);

    // Marcar versões anteriores como não-atuais
    await prisma.resumeVersion.updateMany({
      where: { candidateId: profile.id },
      data: { isCurrent: false },
    });

    const nextVersionNumber = (profile.resumeVersions[0]?.versionNumber || 0) + 1;

    // Criar nova versão estruturada do currículo
    const newVersion = await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: nextVersionNumber,
        headline: headline || profile.professionalHeadline,
        summary: summary || profile.summary,
        educationLevel: eduLevel,
        skillsSnapshot: JSON.stringify(skillsArray),
        isCurrent: true,
        experiences: expCompany && expPosition ? {
          create: [
            {
              company: expCompany,
              position: expPosition,
              startDate: new Date("2022-01-01"),
              description: expDescription || null,
              isCurrent: true,
            },
          ],
        } : undefined,
        educations: eduInstitution && eduCourse ? {
          create: [
            {
              institution: eduInstitution,
              course: eduCourse,
              level: eduLevel,
              status: "CONCLUIDO",
            },
          ],
        } : undefined,
        courses: courseTitle && courseInstitution ? {
          create: [
            {
              institution: courseInstitution,
              title: courseTitle,
              completionDate: new Date(),
            },
          ],
        } : undefined,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "RESUME_VERSION_CREATED",
      resourceType: "ResumeVersion",
      resourceId: newVersion.id,
      details: { versionNumber: nextVersionNumber },
    });

    return formRedirect(new URL("/painel/curriculo?sucesso=salvo", req.url));
  } catch (error) {
    console.error("Erro ao salvar currículo estruturado:", error);
    return formRedirect(new URL("/painel/curriculo?erro=falha", req.url));
  }
}
