import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";

function allStrings(formData: FormData, key: string): string[] {
  return formData.getAll(key).map((v) => String(v ?? "").trim());
}

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
    const summary = String(formData.get("summary") || "").trim();
    const skills = String(formData.get("skills") || "").trim();
    const headline = String(formData.get("headline") || "").trim();

    const expCompanies = allStrings(formData, "expCompany");
    const expPositions = allStrings(formData, "expPosition");
    const expDescriptions = allStrings(formData, "expDescription");
    const expCurrentIndexes = new Set(
      formData.getAll("expIsCurrent").map((v) => String(v)),
    );

    const eduInstitutions = allStrings(formData, "eduInstitution");
    const eduCourses = allStrings(formData, "eduCourse");
    const eduLevels = allStrings(formData, "eduLevel");

    const courseTitles = allStrings(formData, "courseTitle");
    const courseInstitutions = allStrings(formData, "courseInstitution");

    const skillsArray = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const experiences = expCompanies
      .map((company, i) => ({
        company,
        position: expPositions[i] || "",
        description: expDescriptions[i] || "",
        isCurrent: expCurrentIndexes.has(String(i)),
      }))
      .filter((e) => e.company && e.position);

    const educations = eduInstitutions
      .map((institution, i) => ({
        institution,
        course: eduCourses[i] || "",
        level: eduLevels[i] || "MEDIO",
      }))
      .filter((e) => e.institution && e.course);

    const courses = courseTitles
      .map((title, i) => ({
        title,
        institution: courseInstitutions[i] || "",
      }))
      .filter((c) => c.title && c.institution);

    const primaryLevel = educations[0]?.level || profile.educationLevel || "MEDIO";

    await prisma.resumeVersion.updateMany({
      where: { candidateId: profile.id },
      data: { isCurrent: false },
    });

    const nextVersionNumber = (profile.resumeVersions[0]?.versionNumber || 0) + 1;

    const newVersion = await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: nextVersionNumber,
        headline: headline || profile.professionalHeadline,
        summary: summary || profile.summary,
        educationLevel: primaryLevel,
        skillsSnapshot: JSON.stringify(skillsArray),
        experiencesSnapshot: JSON.stringify(experiences),
        educationsSnapshot: JSON.stringify(educations),
        coursesSnapshot: JSON.stringify(courses),
        isCurrent: true,
        experiences:
          experiences.length > 0
            ? {
                create: experiences.map((e, idx) => ({
                  company: e.company,
                  position: e.position,
                  startDate: new Date("2020-01-01"),
                  description: e.description || null,
                  isCurrent: e.isCurrent || idx === 0,
                })),
              }
            : undefined,
        educations:
          educations.length > 0
            ? {
                create: educations.map((e) => ({
                  institution: e.institution,
                  course: e.course,
                  level: e.level,
                  status: "CONCLUIDO",
                })),
              }
            : undefined,
        courses:
          courses.length > 0
            ? {
                create: courses.map((c) => ({
                  institution: c.institution,
                  title: c.title,
                  completionDate: new Date(),
                })),
              }
            : undefined,
      },
    });

    await prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        professionalHeadline: headline || profile.professionalHeadline,
        summary: summary || profile.summary,
        educationLevel: primaryLevel,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "RESUME_VERSION_CREATED",
      resourceType: "ResumeVersion",
      resourceId: newVersion.id,
      details: {
        versionNumber: nextVersionNumber,
        experiences: experiences.length,
        educations: educations.length,
        courses: courses.length,
      },
    });

    return formRedirect(new URL("/painel/curriculo?sucesso=salvo", req.url));
  } catch (error) {
    console.error("Erro ao salvar currículo estruturado:", error);
    return formRedirect(new URL("/painel/curriculo?erro=falha", req.url));
  }
}
