import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !isAdmin(session.role)) {
      return new NextResponse("Acesso não autorizado", { status: 403 });
    }

    const type = req.nextUrl.searchParams.get("type") || "jobs";

    let csvContent = "";
    let filename = `relatorio_${type}_${Date.now()}.csv`;

    if (type === "jobs") {
      const jobs = await prisma.job.findMany({
        include: { company: true, category: true, _count: { select: { applications: true } } },
      });

      csvContent = "ID,Titulo,Empresa,Categoria,Modalidade,Contrato,Status,Candidaturas,CriadaEm\n";
      jobs.forEach((j) => {
        const comp = j.isConfidential ? "Confidencial" : j.company.name;
        csvContent += `"${j.id}","${j.title.replace(/"/g, '""')}","${comp}","${j.category.name}","${j.workplaceType}","${j.contractType}","${j.status}",${j._count.applications},"${j.createdAt.toISOString()}"\n`;
      });
    } else if (type === "courses") {
      const courses = await prisma.course.findMany({
        include: { provider: true },
      });

      csvContent = "ID,Titulo,Provedor,Modalidade,Cliques,Status,CriadoEm\n";
      courses.forEach((c) => {
        csvContent += `"${c.id}","${c.title.replace(/"/g, '""')}","${c.provider.name}","${c.modality}",${c.clicksCount},"${c.status}","${c.createdAt.toISOString()}"\n`;
      });
    } else if (type === "indicators") {
      const [totalCands, assistedCands, totalApps, totalJobs] = await Promise.all([
        prisma.candidateProfile.count(),
        prisma.candidateProfile.count({ where: { isAssisted: true } }),
        prisma.application.count(),
        prisma.job.count(),
      ]);

      csvContent = "Metrica,Valor\n";
      csvContent += `"Total Candidatos",${totalCands}\n`;
      csvContent += `"Cadastros Assistidos Presenciais",${assistedCands}\n`;
      csvContent += `"Total de Candidaturas Realizadas",${totalApps}\n`;
      csvContent += `"Total de Vagas Registradas",${totalJobs}\n`;
    }

    // Registrar no log de auditoria quem exportou e quando
    await logAudit({
      userId: session.userId,
      action: "DATA_EXPORT_GENERATED",
      resourceType: "Export",
      details: { exportType: type, filename },
    });

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erro na exportação:", error);
    return new NextResponse("Erro ao gerar exportação", { status: 500 });
  }
}
