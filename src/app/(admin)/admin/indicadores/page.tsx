import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canViewIndicators } from "@/lib/auth/rbac";
import { FunnelCard, PageHeader, SecondaryButton, SurfaceCard } from "@/components/admin/ui";
import { FileSpreadsheet } from "lucide-react";

export default async function AdminIndicadoresPage() {
  const session = await getSession();
  if (!session || !canViewIndicators(session.role)) {
    redirect("/admin");
  }

  const [
    totalCandidates,
    assistedCandidates,
    totalJobs,
    publishedJobs,
    totalApplications,
    filledJobs,
    categoriesWithCount,
    courses,
  ] = await Promise.all([
    prisma.candidateProfile.count(),
    prisma.candidateProfile.count({ where: { isAssisted: true } }),
    prisma.job.count(),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count(),
    prisma.job.count({
      where: {
        OR: [
          { selectionResult: "FILLED" },
          { status: "CLOSED", applications: { some: { status: "APPROVED" } } },
        ],
      },
    }),
    prisma.jobCategory.findMany({
      include: { _count: { select: { jobs: true } } },
      orderBy: { order: "asc" },
    }),
    prisma.course.findMany({
      include: { provider: true },
      orderBy: { clicksCount: "desc" },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Indicadores e métricas"
        description="Visão consolidada e anônima do impacto da plataforma em Arcoverde."
        actions={
          <>
            <SecondaryButton href="/api/admin/export?type=jobs">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar vagas
            </SecondaryButton>
            <SecondaryButton href="/api/admin/export?type=courses">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar cursos
            </SecondaryButton>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FunnelCard label="Candidatos" count={totalCandidates} hint="Cadastros válidos" />
        <FunnelCard label="Vagas preenchidas" count={filledJobs} hint="Resultado informado" />
        <FunnelCard
          label="Cadastros assistidos"
          count={assistedCandidates}
          hint={
            totalCandidates > 0
              ? `${Math.round((assistedCandidates / totalCandidates) * 100)}% do total`
              : "0%"
          }
        />
        <FunnelCard label="Vagas" count={totalJobs} hint={`${publishedJobs} publicadas`} />
        <FunnelCard label="Candidaturas" count={totalApplications} hint="Conexões geradas" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard className="p-5">
          <h3 className="mb-4 text-sm font-bold text-[#1C1410]">Vagas por setor / categoria</h3>
          <div className="space-y-3">
            {categoriesWithCount.map((cat) => {
              const count = cat._count.jobs;
              const percent = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-[#1C1410]">{cat.name}</span>
                    <span className="text-[#78716c]">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F4F5F7]">
                    <div className="h-full rounded-full bg-[#E65100]" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <h3 className="mb-4 text-sm font-bold text-[#1C1410]">Interesse em cursos (cliques)</h3>
          <ul className="space-y-2">
            {courses.length === 0 ? (
              <li className="text-xs text-[#78716c]">Nenhum curso cadastrado.</li>
            ) : (
              courses.map((course) => (
                <li
                  key={course.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-[#F4F5F7] px-3 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-[#E65100]">{course.provider.name}</p>
                    <p className="truncate font-semibold text-[#1C1410]">{course.title}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-base font-black text-[#E65100]">{course.clicksCount}</p>
                    <p className="text-[10px] text-[#78716c]">cliques</p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </SurfaceCard>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-[#78716c]">
        Dados agregados e anônimos — exportações ficam registradas na auditoria.
      </p>
    </div>
  );
}
