import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";

/** Portabilidade LGPD — export JSON do titular. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      consents: true,
      notificationPref: true,
      candidateProfile: {
        include: {
          documents: {
            select: {
              id: true,
              fileName: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
            },
          },
          resumeVersions: {
            include: {
              experiences: true,
              educations: true,
              courses: true,
            },
          },
          applications: {
            include: {
              job: { select: { title: true, slug: true, status: true } },
              statusHistory: true,
            },
          },
        },
      },
      deletionRequests: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
    consents: user.consents,
    notificationPreferences: user.notificationPref,
    profile: user.candidateProfile,
    deletionRequests: user.deletionRequests,
  };

  await logAudit({
    userId: session.userId,
    action: "DATA_EXPORT_REQUESTED",
    resourceType: "User",
    resourceId: session.userId,
  });

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="emprega-arcoverde-meus-dados.json"`,
    },
  });
}
