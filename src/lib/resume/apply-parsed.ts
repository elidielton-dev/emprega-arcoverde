import { prisma } from "@/lib/db/prisma";
import type { LinkedInProfileData } from "@/lib/linkedin/types";

/**
 * Aplica dados extraídos do PDF/DOCX criando nova versão do currículo.
 * Seções vazias no parse preservam o que já existia (não apaga à toa).
 */
export async function applyParsedResumeToCandidate(userId: string, data: LinkedInProfileData) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      resumeVersions: {
        where: { isCurrent: true },
        include: {
          experiences: { orderBy: { createdAt: "asc" } },
          educations: { orderBy: { createdAt: "asc" } },
          courses: { orderBy: { createdAt: "asc" } },
        },
        take: 1,
        orderBy: { versionNumber: "desc" },
      },
    },
  });

  if (!profile) return { applied: false as const, reason: "no_profile" as const };

  const current = profile.resumeVersions[0];

  let existingSkills: string[] = [];
  try {
    existingSkills = current?.skillsSnapshot ? JSON.parse(current.skillsSnapshot) : [];
  } catch {
    existingSkills = [];
  }

  const skills = Array.from(
    new Set([...(data.skills || []), ...existingSkills].map((s) => s.trim()).filter(Boolean)),
  ).slice(0, 50);

  const experiences =
    data.experiences.length > 0
      ? data.experiences
      : (current?.experiences || []).map((e) => ({
          company: e.company,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate,
          isCurrent: e.isCurrent,
          description: e.description,
        }));

  const educations =
    data.educations.length > 0
      ? data.educations
      : (current?.educations || []).map((e) => ({
          institution: e.institution,
          course: e.course,
          level: e.level,
          startDate: e.startDate,
          endDate: e.endDate,
          status: e.status,
        }));

  const courses =
    data.courses.length > 0
      ? data.courses
      : (current?.courses || []).map((c) => ({
          institution: c.institution,
          title: c.title,
          completionDate: c.completionDate,
          hours: c.hours,
        }));

  const headline = data.headline || current?.headline || profile.professionalHeadline || null;
  const summary = data.summary || current?.summary || profile.summary || null;
  const educationLevel =
    data.educations[0]?.level || current?.educationLevel || profile.educationLevel || "MEDIO";

  if (data.fullName) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: data.fullName },
    });
  }

  await prisma.candidateProfile.update({
    where: { id: profile.id },
    data: {
      fullName: data.fullName || profile.fullName,
      professionalHeadline: headline,
      summary,
      educationLevel,
    },
  });

  await prisma.resumeVersion.updateMany({
    where: { candidateId: profile.id },
    data: { isCurrent: false },
  });

  const nextVersion = (current?.versionNumber || 0) + 1;

  const created = await prisma.resumeVersion.create({
    data: {
      candidateId: profile.id,
      versionNumber: nextVersion,
      headline,
      summary,
      educationLevel,
      skillsSnapshot: JSON.stringify(skills),
      experiencesSnapshot: JSON.stringify(experiences),
      educationsSnapshot: JSON.stringify(educations),
      coursesSnapshot: JSON.stringify(courses),
      isCurrent: true,
      experiences: {
        create: experiences.map((e) => ({
          company: e.company,
          position: e.position,
          startDate: e.startDate instanceof Date ? e.startDate : new Date(e.startDate || "2020-01-01"),
          endDate: e.endDate ? new Date(e.endDate) : null,
          isCurrent: Boolean(e.isCurrent),
          description: e.description || null,
        })),
      },
      educations: {
        create: educations.map((e) => ({
          institution: e.institution,
          course: e.course,
          level: e.level,
          startDate: e.startDate ? new Date(e.startDate) : null,
          endDate: e.endDate ? new Date(e.endDate) : null,
          status: e.status || "CONCLUIDO",
        })),
      },
      courses: {
        create: courses.map((c) => ({
          institution: c.institution,
          title: c.title,
          completionDate: c.completionDate ? new Date(c.completionDate) : null,
          hours: c.hours ?? null,
        })),
      },
    },
  });

  return {
    applied: true as const,
    resumeVersionId: created.id,
    filled: {
      experiences: experiences.length,
      educations: educations.length,
      courses: courses.length,
      skills: skills.length,
      headline: Boolean(headline),
      summary: Boolean(summary),
    },
  };
}
