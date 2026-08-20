import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canViewIndicators } from "@/lib/auth/rbac";
import {
  BarChart3,
  ArrowLeft,
  Download,
  Briefcase,
  Users,
  GraduationCap,
  Sparkles,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export default async function AdminIndicadoresPage() {
  const session = await getSession();
  if (!session || !canViewIndicators(session.role)) {
    redirect("/admin");
  }

  // Agregações no banco
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
      include: {
        _count: { select: { jobs: true } },
      },
      orderBy: { order: "asc" },
    }),
    prisma.course.findMany({
      include: { provider: true },
      orderBy: { clicksCount: "desc" },
    }),
  ]);

  const webCandidates = totalCandidates - assistedCandidates;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao painel de governança</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Indicadores & Métricas Municipais
          </h1>
          <p className="text-xs text-[#78716c]">
            Visão consolidada e anônima de impacto da plataforma de empregabilidade e qualificação em Arcoverde.
          </p>
        </div>

        {/* Botão de Exportação Auditada */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/export?type=jobs"
            className="inline-flex items-center gap-1.5 bg-white border border-[#FEEDDF] hover:bg-[#FFF8F2] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E65100]" />
            <span>Exportar Vagas (CSV)</span>
          </a>
          <a
            href="/api/admin/export?type=courses"
            className="inline-flex items-center gap-1.5 bg-white border border-[#FEEDDF] hover:bg-[#FFF8F2] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#E65100]" />
            <span>Exportar Cursos (CSV)</span>
          </a>
        </div>
      </div>

      {/* Cards de Métricas Gerais */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Total de Candidatos</span>
          <div className="text-3xl font-black text-[#2E221F]">{totalCandidates}</div>
          <span className="text-[11px] text-emerald-700 font-semibold">100% de cadastros válidos</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Vagas preenchidas</span>
          <div className="text-3xl font-black text-emerald-600">{filledJobs}</div>
          <span className="text-[11px] text-[#78716c]">Resultado informado ou aprovação registrada</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Cadastros Assistidos</span>
          <div className="text-3xl font-black text-[#E65100]">{assistedCandidates}</div>
          <span className="text-[11px] text-[#78716c]">
            {totalCandidates > 0 ? `${Math.round((assistedCandidates / totalCandidates) * 100)}% do total` : "0%"}
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Vagas Disponibilizadas</span>
          <div className="text-3xl font-black text-[#2E221F]">{totalJobs}</div>
          <span className="text-[11px] text-[#78716c]">{publishedJobs} publicadas ativas</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Candidaturas Geradas</span>
          <div className="text-3xl font-black text-emerald-600">{totalApplications}</div>
          <span className="text-[11px] text-[#78716c]">Conexões trabalhador-empresa</span>
        </div>
      </div>

      {/* Distribuição de Vagas por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#FEEDDF] space-y-6">
          <div className="flex items-center justify-between border-b border-[#FEEDDF] pb-3">
            <h2 className="font-bold text-base text-[#2E221F]">Vagas por Setor / Categoria</h2>
            <span className="text-xs text-[#78716c]">{categoriesWithCount.length} setores</span>
          </div>

          <div className="space-y-4">
            {categoriesWithCount.map((cat) => {
              const count = cat._count.jobs;
              const percent = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-[#2E221F]">{cat.name}</span>
                    <span className="text-[#57433C]">{count} vagas ({percent}%)</span>
                  </div>
                  <div className="w-full bg-[#FFF8F2] h-2.5 rounded-full overflow-hidden border border-[#FEEDDF]">
                    <div
                      className="bg-[#E65100] h-full rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cliques em Cursos Gratuitos de Qualificação */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#FEEDDF] space-y-6">
          <div className="flex items-center justify-between border-b border-[#FEEDDF] pb-3">
            <h2 className="font-bold text-base text-[#2E221F]">Interesse em Cursos (Cliques)</h2>
            <span className="text-xs text-[#78716c]">Inscrições Externas</span>
          </div>

          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#E65100] border border-[#FDCFA9]">
                    {course.provider.name}
                  </span>
                  <h4 className="font-bold text-[#2E221F] line-clamp-1">{course.title}</h4>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-base font-black text-[#E65100]">{course.clicksCount}</span>
                  <span className="text-[11px] text-[#78716c] block">redirecionamentos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
