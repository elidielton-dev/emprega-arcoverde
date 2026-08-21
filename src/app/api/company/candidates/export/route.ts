import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_MEMBER" || !session.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const jobId = req.nextUrl.searchParams.get("jobId");

  const apps = await prisma.application.findMany({
    where: {
      job: { companyId: session.companyId },
      ...(jobId ? { jobId } : {}),
    },
    include: {
      candidate: {
        select: {
          fullName: true,
          phone: true,
          whatsapp: true,
          city: true,
          user: { select: { email: true } },
        },
      },
      job: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "candidato",
    "email",
    "telefone",
    "whatsapp",
    "cidade",
    "vaga",
    "status",
    "score_ats",
    "data",
  ];
  const lines = [
    header.join(";"),
    ...apps.map((a) =>
      [
        csv(a.candidate.fullName),
        csv(a.candidate.user.email || ""),
        csv(a.candidate.phone || ""),
        csv(a.candidate.whatsapp || ""),
        csv(a.candidate.city || ""),
        csv(a.job.title),
        csv(a.status),
        String(a.matchScore ?? ""),
        a.createdAt.toISOString(),
      ].join(";"),
    ),
  ];

  await logAudit({
    userId: session.userId,
    action: "COMPANY_CANDIDATES_EXPORTED",
    resourceType: "Company",
    resourceId: session.companyId,
    details: { count: apps.length, jobId },
  });

  const bom = "\uFEFF";
  return new NextResponse(bom + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="candidatos-empresa.csv"`,
    },
  });
}

function csv(v: string) {
  const s = v.replace(/"/g, '""');
  return `"${s}"`;
}
