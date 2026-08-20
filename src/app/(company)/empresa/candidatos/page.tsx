import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { CandidatesBoard, type CandidateRow } from "@/components/company/CandidatesBoard";

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

function parseBreakdown(raw?: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CandidateRow["breakdown"];
  } catch {
    return null;
  }
}

export default async function EmpresaCandidatosPage({
  searchParams,
}: {
  searchParams: { vaga?: string; etapa?: string; app?: string; sucesso?: string };
}) {
  const { company } = await requireCompanyContext();

  const [jobs, applications] = await Promise.all([
    prisma.job.findMany({
      where: { companyId: company.id },
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      include: {
        job: { select: { id: true, title: true } },
        candidate: {
          include: {
            user: { select: { email: true } },
            resumeVersions: {
              where: { isCurrent: true },
              take: 1,
              select: {
                summary: true,
                skillsSnapshot: true,
                headline: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
          take: 12,
          select: { status: true, notes: true, createdAt: true },
        },
      },
      orderBy: [{ matchScore: "desc" }, { createdAt: "desc" }],
    }),
  ]);

  const rows: CandidateRow[] = applications.map((app) => {
    const resume = app.candidate.resumeVersions[0];
    return {
      id: app.id,
      status: app.status,
      origin: app.origin,
      matchScore: app.matchScore,
      coverNote: app.coverNote,
      createdAt: app.createdAt.toISOString(),
      job: app.job,
      candidate: {
        id: app.candidate.id,
        fullName: app.candidate.fullName,
        phone: app.candidate.phone,
        whatsapp: app.candidate.whatsapp,
        city: app.candidate.city,
        educationLevel: app.candidate.educationLevel,
        professionalHeadline: resume?.headline || app.candidate.professionalHeadline,
        email: app.candidate.user.email,
        skills: parseSkills(resume?.skillsSnapshot),
        summary: resume?.summary || app.candidate.summary,
      },
      history: app.statusHistory.map((h) => ({
        status: h.status,
        notes: h.notes,
        createdAt: h.createdAt.toISOString(),
      })),
      breakdown: parseBreakdown(app.matchBreakdown),
    };
  });

  return (
    <>
      {searchParams.sucesso && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Status da candidatura atualizado.
        </div>
      )}
      <CandidatesBoard
        rows={rows}
        jobs={jobs}
        initialVaga={searchParams.vaga}
        initialEtapa={searchParams.etapa}
        initialApp={searchParams.app}
      />
    </>
  );
}
