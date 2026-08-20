import { NextRequest, NextResponse } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { canManageJobs } from "@/lib/auth/rbac";

/** ERS RN025: só ACA/Prefeitura cadastram vagas. Empresa não cria. */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canManageJobs(session.role)) {
      return NextResponse.json(
        { error: "Somente ACA ou Prefeitura podem cadastrar vagas. A empresa solicita via atendimento institucional." },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const title = (formData.get("title") as string)?.trim();
    const categoryId = formData.get("categoryId") as string;
    const summary = (formData.get("summary") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();
    const contractType = (formData.get("contractType") as string) || "CLT";
    const workplaceType = (formData.get("workplaceType") as string) || "PRESENCIAL";
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const state = (formData.get("state") as string)?.trim() || "PE";
    const educationLevel = (formData.get("educationLevel") as string) || "MEDIO";
    const experienceRequired = (formData.get("experienceRequired") as string) || "SEM_EXPERIENCIA";
    const driverLicense = (formData.get("driverLicense") as string) || "NENHUMA";
    const vacanciesCount = parseInt(formData.get("vacanciesCount") as string, 10) || 1;
    const requirements = (formData.get("requirements") as string)?.trim() || "";
    const skillsText = (formData.get("skillsText") as string)?.trim() || null;
    const isConfidential = formData.get("isConfidential") === "on";
    const publishNow = formData.get("publishNow") === "on" || formData.get("actionType") === "PUBLISH";
    const targetCompanyId = (formData.get("companyId") as string)?.trim();
    const applicationDeadlineRaw = (formData.get("applicationDeadline") as string)?.trim();

    if (!title || !categoryId || !summary || !description || !targetCompanyId) {
      return formRedirect(new URL("/admin/vagas/nova?erro=campos_obrigatorios", req.url));
    }

    const company = await prisma.company.findFirst({
      where: { id: targetCompanyId, status: "ACTIVE" },
    });
    if (!company) {
      return formRedirect(new URL("/admin/vagas/nova?erro=empresa_invalida", req.url));
    }

    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const status = publishNow ? "PUBLISHED" : "DRAFT";

    const job = await prisma.job.create({
      data: {
        title,
        slug: uniqueSlug,
        companyId: targetCompanyId,
        createdById: session.userId,
        categoryId,
        summary,
        description,
        contractType,
        workplaceType,
        city,
        state,
        vacanciesCount,
        educationLevel,
        experienceRequired,
        driverLicense,
        requirements,
        skillsText,
        isConfidential,
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
        applicationDeadline: applicationDeadlineRaw ? new Date(applicationDeadlineRaw) : null,
      },
    });

    await logAudit({
      userId: session.userId,
      action: status === "PUBLISHED" ? "JOB_PUBLISHED" : "JOB_CREATED",
      resourceType: "Job",
      resourceId: job.id,
      details: { title, isConfidential, status, companyId: targetCompanyId },
    });

    return formRedirect(new URL(`/admin/vagas?sucesso=vaga_criada`, req.url));
  } catch (error) {
    console.error("Erro ao criar vaga:", error);
    return formRedirect(new URL("/admin/vagas/nova?erro=falha", req.url));
  }
}
