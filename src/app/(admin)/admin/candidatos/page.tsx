import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canDeleteCurriculum, canValidateCurriculum, canViewAllCandidates } from "@/lib/auth/rbac";
import { containsInsensitive } from "@/lib/db/search";
import { CandidatesAdminBoard, type CandidateAdminRow } from "@/components/admin/CandidatesAdminBoard";

export default async function AdminCandidatosPage({
  searchParams,
}: {
  searchParams: { q?: string; origem?: string };
}) {
  const session = await getSession();
  if (!session || !canViewAllCandidates(session.role)) {
    redirect("/entrar");
  }

  const query = searchParams.q?.trim() || "";
  const origem = searchParams.origem || "";

  const where: Record<string, unknown> = {};
  if (query) {
    where.OR = [
      { fullName: containsInsensitive(query) },
      { professionalHeadline: containsInsensitive(query) },
      { summary: containsInsensitive(query) },
    ];
  }
  if (origem === "ASSISTED") where.isAssisted = true;
  else if (origem === "SELF") where.isAssisted = false;

  const candidates = await prisma.candidateProfile.findMany({
    where,
    include: {
      user: true,
      resumeVersions: { where: { isCurrent: true }, take: 1 },
      documents: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: CandidateAdminRow[] = candidates.map((cand) => {
    const currentResume = cand.resumeVersions[0];
    let skills: string[] = [];
    try {
      skills = currentResume?.skillsSnapshot ? JSON.parse(currentResume.skillsSnapshot) : [];
    } catch {
      skills = [];
    }
    const doc = cand.documents[0];
    return {
      id: cand.id,
      fullName: cand.fullName,
      email: cand.user.email,
      phone: cand.phone,
      city: cand.city,
      state: cand.state,
      neighborhood: cand.neighborhood,
      professionalHeadline: cand.professionalHeadline,
      educationLevel: cand.educationLevel,
      driverLicense: cand.driverLicense || "NENHUMA",
      isAssisted: cand.isAssisted,
      assistedUnit: cand.assistedUnit,
      validationStatus: cand.validationStatus,
      validationNotes: cand.validationNotes,
      applicationsCount: cand._count.applications,
      summary: currentResume?.summary || cand.summary,
      skills: Array.isArray(skills) ? skills : [],
      documentUrl: doc ? `/api/documents/${doc.fileKey}` : null,
      documentName: doc?.fileName || null,
      createdAt: cand.createdAt.toISOString(),
    };
  });

  return (
    <CandidatesAdminBoard
      candidates={rows}
      mayValidate={canValidateCurriculum(session.role)}
      mayDelete={canDeleteCurriculum(session.role)}
      isAcaAdmin={session.role === "ACA_ADMIN"}
      initialQuery={query}
      initialOrigem={origem}
    />
  );
}
