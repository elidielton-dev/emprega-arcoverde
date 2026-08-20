import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canEditJobAsCompany } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { isWithinCompanyEditWindow } from "@/lib/jobs/edit-window";

async function updateJob(req: NextRequest, jobId: string) {
  const session = await getSession();
  if (!session || !canEditJobAsCompany(session.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, company: { members: { some: { userId: session.userId } } } },
  });
  if (!job) return NextResponse.json({ error: "Vaga não encontrada" }, { status: 404 });
  if (!isWithinCompanyEditWindow(job.createdAt)) {
    return formRedirect(new URL(`/empresa/vagas/${jobId}/editar?erro=prazo_expirado`, req.url));
  }

  const data = await req.formData();
  const title = (data.get("title") as string)?.trim();
  const summary = (data.get("summary") as string)?.trim();
  const description = (data.get("description") as string)?.trim();
  if (!title || !summary || !description) {
    return formRedirect(new URL(`/empresa/vagas/${jobId}/editar?erro=campos_obrigatorios`, req.url));
  }

  const applicationDeadlineRaw = (data.get("applicationDeadline") as string)?.trim();
  const updated = await prisma.job.update({
    where: { id: job.id },
    data: {
      title,
      summary,
      description,
      categoryId: (data.get("categoryId") as string) || job.categoryId,
      contractType: (data.get("contractType") as string) || job.contractType,
      workplaceType: (data.get("workplaceType") as string) || job.workplaceType,
      city: (data.get("city") as string)?.trim() || job.city,
      state: (data.get("state") as string)?.trim() || job.state,
      educationLevel: (data.get("educationLevel") as string) || job.educationLevel,
      experienceRequired: (data.get("experienceRequired") as string) || null,
      driverLicense: (data.get("driverLicense") as string) || null,
      vacanciesCount: Math.max(1, parseInt(data.get("vacanciesCount") as string, 10) || 1),
      requirements: (data.get("requirements") as string)?.trim() || null,
      skillsText: (data.get("skillsText") as string)?.trim() || null,
      applicationDeadline: applicationDeadlineRaw ? new Date(applicationDeadlineRaw) : null,
      isConfidential: data.get("isConfidential") === "on",
    },
  });

  await logAudit({
    userId: session.userId,
    action: "JOB_UPDATED_BY_COMPANY",
    resourceType: "Job",
    resourceId: job.id,
    details: { title: updated.title, companyId: job.companyId, withinHours: 12 },
  });

  return formRedirect(new URL("/empresa/vagas?sucesso=vaga_atualizada", req.url));
}

export function POST(req: NextRequest, context: { params: { id: string } }) {
  return updateJob(req, context.params.id);
}

export function PATCH(req: NextRequest, context: { params: { id: string } }) {
  return updateJob(req, context.params.id);
}
