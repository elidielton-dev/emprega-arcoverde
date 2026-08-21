import { prisma } from "@/lib/db/prisma";
import type { LinkedInProfileData } from "./types";

function mergeSkills(existing: string[], incoming: string[]) {
  const set = new Set<string>();
  for (const s of [...existing, ...incoming]) {
    const t = s.trim();
    if (t) set.add(t);
  }
  return Array.from(set).slice(0, 50);
}

/**
 * Aplica dados do LinkedIn no perfil + versão atual do currículo.
 * Não apaga experiências existentes a menos que `replaceStructured` seja true
 * ou o currículo ainda esteja vazio.
 */
export async function applyLinkedInDataToCandidate(
  userId: string,
  data: LinkedInProfileData,
  options?: { replaceStructured?: boolean },
) {
  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: {
      resumeVersions: {
        where: { isCurrent: true },
        include: {
          experiences: true,
          educations: true,
          courses: true,
        },
        take: 1,
      },
      user: true,
    },
  });

  if (!profile) return { applied: false as const, reason: "no_profile" };

  const current = profile.resumeVersions[0];
  const emptyStructured =
    !current ||
    (current.experiences.length === 0 &&
      current.educations.length === 0 &&
      current.courses.length === 0 &&
      (!current.skillsSnapshot || current.skillsSnapshot === "[]" || current.skillsSnapshot === ""));

  const replace = options?.replaceStructured === true || emptyStructured;

  const existingSkills: string[] = (() => {
    try {
      return current?.skillsSnapshot ? JSON.parse(current.skillsSnapshot) : [];
    } catch {
      return [];
    }
  })();

  const skills = mergeSkills(existingSkills, data.skills);

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.fullName || undefined,
      avatarUrl: data.pictureUrl || undefined,
    },
  });

  await prisma.candidateProfile.update({
    where: { id: profile.id },
    data: {
      fullName: data.fullName || profile.fullName,
      professionalHeadline: data.headline || profile.professionalHeadline,
      summary: data.summary || profile.summary,
    },
  });

  if (!replace && !data.experiences.length && !data.educations.length && !data.courses.length && !data.skills.length) {
    return {
      applied: true as const,
      filled: {
        experiences: 0,
        educations: 0,
        courses: 0,
        skills: skills.length,
      },
      emptyStructured,
    };
  }

  if (current && replace) {
    await prisma.resumeExperience.deleteMany({ where: { resumeId: current.id } });
    await prisma.resumeEducation.deleteMany({ where: { resumeId: current.id } });
    await prisma.resumeCourse.deleteMany({ where: { resumeId: current.id } });

    if (data.experiences.length) {
      await prisma.resumeExperience.createMany({
        data: data.experiences.map((e) => ({
          resumeId: current.id,
          company: e.company,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate || null,
          isCurrent: e.isCurrent,
          description: e.description || null,
        })),
      });
    }

    if (data.educations.length) {
      await prisma.resumeEducation.createMany({
        data: data.educations.map((e) => ({
          resumeId: current.id,
          institution: e.institution,
          course: e.course,
          level: e.level,
          startDate: e.startDate || null,
          endDate: e.endDate || null,
          status: e.status,
        })),
      });
    }

    if (data.courses.length) {
      await prisma.resumeCourse.createMany({
        data: data.courses.map((c) => ({
          resumeId: current.id,
          institution: c.institution,
          title: c.title,
          completionDate: c.completionDate || null,
          hours: c.hours ?? null,
        })),
      });
    }

    await prisma.resumeVersion.update({
      where: { id: current.id },
      data: {
        headline: data.headline || current.headline,
        summary: data.summary || current.summary,
        skillsSnapshot: JSON.stringify(skills),
        experiencesSnapshot: JSON.stringify(data.experiences),
        educationsSnapshot: JSON.stringify(data.educations),
        coursesSnapshot: JSON.stringify(data.courses),
        educationLevel: data.educations[0]?.level || current.educationLevel,
      },
    });
  } else if (!current) {
    await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: 1,
        headline: data.headline || null,
        summary: data.summary || null,
        educationLevel: data.educations[0]?.level || "MEDIO",
        skillsSnapshot: JSON.stringify(skills),
        experiencesSnapshot: JSON.stringify(data.experiences),
        educationsSnapshot: JSON.stringify(data.educations),
        coursesSnapshot: JSON.stringify(data.courses),
        isCurrent: true,
        experiences: {
          create: data.experiences.map((e) => ({
            company: e.company,
            position: e.position,
            startDate: e.startDate,
            endDate: e.endDate || null,
            isCurrent: e.isCurrent,
            description: e.description || null,
          })),
        },
        educations: {
          create: data.educations.map((e) => ({
            institution: e.institution,
            course: e.course,
            level: e.level,
            startDate: e.startDate || null,
            endDate: e.endDate || null,
            status: e.status,
          })),
        },
        courses: {
          create: data.courses.map((c) => ({
            institution: c.institution,
            title: c.title,
            completionDate: c.completionDate || null,
            hours: c.hours ?? null,
          })),
        },
      },
    });
  } else if (skills.length > existingSkills.length) {
    await prisma.resumeVersion.update({
      where: { id: current.id },
      data: {
        skillsSnapshot: JSON.stringify(skills),
        headline: current.headline || data.headline || null,
        summary: current.summary || data.summary || null,
      },
    });
  }

  return {
    applied: true as const,
    filled: {
      experiences: data.experiences.length,
      educations: data.educations.length,
      courses: data.courses.length,
      skills: skills.length,
    },
    emptyStructured,
  };
}
