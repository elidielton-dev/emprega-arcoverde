import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageCourses } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

async function authorize() {
  const session = await getSession();
  return session && canManageCourses(session.role) ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const body = await req.json();
  const course = await prisma.course.update({
    where: { id: params.id },
    data: {
      title: body.title?.trim(),
      description: body.description?.trim(),
      modality: body.modality,
      externalUrl: body.externalUrl?.trim(),
      status: body.status,
      enrollmentStart: body.enrollmentStart ? new Date(body.enrollmentStart) : undefined,
      enrollmentEnd: body.enrollmentEnd ? new Date(body.enrollmentEnd) : undefined,
    },
  });
  await logAudit({ userId: session.userId, action: "COURSE_UPDATED", resourceType: "Course", resourceId: course.id });
  return NextResponse.json(course);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await authorize();
  if (!session) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  await prisma.course.delete({ where: { id: params.id } });
  await logAudit({ userId: session.userId, action: "COURSE_DELETED", resourceType: "Course", resourceId: params.id });
  if (req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: true });
  }
  return formRedirect(new URL("/admin/cursos?sucesso=curso_excluido", req.url));
}

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const formData = await req.formData();
  if (formData.get("_method") !== "DELETE") {
    return NextResponse.json({ error: "Método inválido" }, { status: 405 });
  }
  return DELETE(req, context);
}
