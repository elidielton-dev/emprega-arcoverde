import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { isWithinCompanyEditWindow } from "@/lib/jobs/edit-window";
import { JobsBoard } from "@/components/company/JobsBoard";

export default async function EmpresaVagasListPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const { company } = await requireCompanyContext();

  const jobs = await prisma.job.findMany({
    where: { companyId: company.id },
    include: {
      category: true,
      applications: { select: { status: true } },
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    status: job.status,
    categoryName: job.category.name,
    isConfidential: job.isConfidential,
    applicationsCount: job._count.applications,
    novos: job.applications.filter((a) => a.status === "SUBMITTED").length,
    triagem: job.applications.filter((a) =>
      ["UNDER_REVIEW", "CONTACT_SELECTED"].includes(a.status)
    ).length,
    entrevistas: job.applications.filter((a) => a.status === "INTERVIEW_SCHEDULED").length,
    createdAt: job.createdAt.toISOString(),
    publishedAt: job.publishedAt?.toISOString() || null,
    canEdit: isWithinCompanyEditWindow(job.createdAt),
    city: job.city,
    contractType: job.contractType,
  }));

  return <JobsBoard jobs={rows} success={Boolean(searchParams.sucesso)} />;
}
