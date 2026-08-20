import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { formatCnpj } from "@/lib/company/cnpj";
import { JobsModerationBoard, type ModerationJobRow } from "@/components/admin/JobsModerationBoard";

function salaryLabel(job: {
  hideSalary: boolean;
  salaryExact: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
}) {
  if (job.hideSalary) return "A combinar";
  if (job.salaryExact != null) return `R$ ${job.salaryExact.toLocaleString("pt-BR")}`;
  if (job.salaryMin != null || job.salaryMax != null) {
    const min = job.salaryMin != null ? `R$ ${job.salaryMin.toLocaleString("pt-BR")}` : "";
    const max = job.salaryMax != null ? `R$ ${job.salaryMax.toLocaleString("pt-BR")}` : "";
    return [min, max].filter(Boolean).join(" – ") || "A combinar";
  }
  return "Não informado";
}

export default async function AdminVagasPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; job?: string; empresa?: string };
}) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const jobs = await prisma.job.findMany({
    include: {
      company: true,
      category: true,
      _count: { select: { applications: true } },
      changeRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: ModerationJobRow[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    status: job.status,
    categoryName: job.category.name,
    companyId: job.companyId,
    companyName: job.company.tradeName || job.company.name,
    companyCnpj: job.company.cnpj ? formatCnpj(job.company.cnpj) : null,
    city: job.city,
    contractType: job.contractType,
    workplaceType: job.workplaceType,
    vacanciesCount: job.vacanciesCount,
    applicationsCount: job._count.applications,
    isConfidential: job.isConfidential,
    summary: job.summary,
    requirements: job.requirements,
    salaryLabel: salaryLabel(job),
    createdAt: job.createdAt.toISOString(),
    changeRequests: job.changeRequests.map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    })),
  }));

  return (
    <JobsModerationBoard
      jobs={rows}
      success={Boolean(searchParams.sucesso)}
      initialJobId={searchParams.job}
      initialCompanyId={searchParams.empresa}
    />
  );
}
