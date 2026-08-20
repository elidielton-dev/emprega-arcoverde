import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { TalentPoolBoard } from "@/components/company/TalentPoolBoard";

function parseSkills(snapshot?: string | null): string[] {
  if (!snapshot) return [];
  try {
    const parsed = JSON.parse(snapshot);
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return snapshot.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

export default async function EmpresaBancoTalentosPage() {
  const { company } = await requireCompanyContext();

  const applications = await prisma.application.findMany({
    where: { job: { companyId: company.id } },
    include: {
      candidate: {
        include: {
          user: { select: { email: true } },
          resumeVersions: {
            where: { isCurrent: true },
            take: 1,
            select: { skillsSnapshot: true, headline: true },
          },
        },
      },
      job: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const byCandidate = new Map<
    string,
    {
      id: string;
      fullName: string;
      email: string;
      phone: string | null;
      city: string | null;
      headline: string | null;
      applications: number;
      lastJob: string;
      lastJobId: string;
      lastAt: Date;
      bestScore: number;
      lastStatus: string;
      skills: string[];
    }
  >();

  for (const app of applications) {
    const resume = app.candidate.resumeVersions[0];
    const skillNames = parseSkills(resume?.skillsSnapshot);
    const headline = app.candidate.professionalHeadline || resume?.headline || null;
    const existing = byCandidate.get(app.candidateId);
    if (!existing) {
      byCandidate.set(app.candidateId, {
        id: app.candidateId,
        fullName: app.candidate.fullName,
        email: app.candidate.user.email,
        phone: app.candidate.phone,
        city: app.candidate.city,
        headline,
        applications: 1,
        lastJob: app.job.title,
        lastJobId: app.job.id,
        lastAt: app.createdAt,
        bestScore: app.matchScore,
        lastStatus: app.status,
        skills: skillNames,
      });
    } else {
      existing.applications += 1;
      existing.bestScore = Math.max(existing.bestScore, app.matchScore);
      if (skillNames.length > existing.skills.length) existing.skills = skillNames;
      if (!existing.headline && headline) existing.headline = headline;
      if (app.createdAt > existing.lastAt) {
        existing.lastAt = app.createdAt;
        existing.lastJob = app.job.title;
        existing.lastJobId = app.job.id;
        existing.lastStatus = app.status;
      }
    }
  }

  const talents = Array.from(byCandidate.values())
    .sort((a, b) => b.bestScore - a.bestScore)
    .map((t) => ({
      ...t,
      lastAt: t.lastAt.toISOString(),
    }));

  return <TalentPoolBoard talents={talents} />;
}
