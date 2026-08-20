import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageCourses } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canManageCourses(session.role)) {
    return NextResponse.json({ error: "Sem permissão para gerenciar cursos" }, { status: 403 });
  }

  const data = await req.formData();
  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  const externalUrl = String(data.get("externalUrl") || "").trim();
  const providerId = String(data.get("providerId") || "").trim();
  const providerName = String(data.get("providerName") || "").trim();
  const modality = String(data.get("modality") || "ONLINE");
  if (!title || !description || !externalUrl || (!providerId && !providerName)) {
    return formRedirect(new URL("/admin/cursos/nova?erro=dados_invalidos", req.url));
  }

  let resolvedProviderId = providerId;
  if (!resolvedProviderId) {
    const provider = await prisma.courseProvider.upsert({
      where: { name: providerName },
      update: {},
      create: { name: providerName },
    });
    resolvedProviderId = provider.id;
  }

  const course = await prisma.course.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      providerId: resolvedProviderId,
      description,
      modality,
      externalUrl,
      enrollmentStart: data.get("enrollmentStart") ? new Date(String(data.get("enrollmentStart"))) : null,
      enrollmentEnd: data.get("enrollmentEnd") ? new Date(String(data.get("enrollmentEnd"))) : null,
      status: "ACTIVE",
    },
  });

  await logAudit({
    userId: session.userId,
    action: "COURSE_CREATED",
    resourceType: "Course",
    resourceId: course.id,
    details: { title },
  });
  return formRedirect(new URL("/admin/cursos?sucesso=curso_criado", req.url));
}
