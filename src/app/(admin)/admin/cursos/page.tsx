import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageCourses } from "@/lib/auth/rbac";
import { CoursesBoard, type CourseRow } from "@/components/admin/CoursesBoard";

export default async function AdminCursosPage() {
  const session = await getSession();
  if (!session || !canManageCourses(session.role)) {
    redirect("/admin");
  }

  const courses = await prisma.course.findMany({
    include: { provider: true },
    orderBy: { createdAt: "desc" },
  });

  const rows: CourseRow[] = courses.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    providerName: c.provider.name,
    modality: c.modality,
    status: c.status,
    clicksCount: c.clicksCount,
    vacancies: c.vacancies,
    externalUrl: c.externalUrl,
    enrollmentStart: c.enrollmentStart?.toISOString() || null,
    enrollmentEnd: c.enrollmentEnd?.toISOString() || null,
  }));

  return <CoursesBoard courses={rows} />;
}
