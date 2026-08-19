import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin, canPerformAssistedService } from "@/lib/auth/rbac";
import {
  ShieldCheck,
  Briefcase,
  Users,
  Building2,
  GraduationCap,
  FileCheck,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  BarChart3,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || (!isAdmin(session.role) && session.role !== "ASSISTED_OPERATOR")) {
    redirect("/entrar");
  }

  const [
    totalJobs,
    pendingJobsCount,
    totalCompanies,
    totalCandidates,
    assistedCandidatesCount,
    totalApplications,
    activeCoursesCount,
  ] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.company.count(),
    prisma.candidateProfile.count(),
    prisma.candidateProfile.count({ where: { isAssisted: true } }),
    prisma.application.count(),
    prisma.course.count({ where: { status: "ACTIVE" } }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#E65100] uppercase tracking-wider">
            Gestão Municipal & ACA
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Painel de Governança
          </h1>
          <p className="text-xs text-[#78716c]">
            Conectado como: <strong>{session.name}</strong> ({session.role})
          </p>
        </div>

        {canPerformAssistedService(session.role) && (
          <Link
            href="/admin/atendimento-assistido"
            className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Novo Atendimento Presencial</span>
          </Link>
        )}
      </div>

      {/* Alerta de Vagas Pendentes de Moderação */}
      {pendingJobsCount > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">
                {pendingJobsCount} {pendingJobsCount === 1 ? "vaga aguardando moderação" : "vagas aguardando moderação"}
              </h4>
              <p className="text-xs text-amber-800">
                Empresas enviaram novas vagas para revisão pela comissão da ACA/Prefeitura.
              </p>
            </div>
          </div>
          <Link
            href="/admin/vagas"
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            Moderar Vagas Agora
          </Link>
        </div>
      )}

      {/* Grade de Indicadores Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Total de Vagas</span>
          <div className="text-2xl font-black text-[#2E221F]">{totalJobs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Candidatos</span>
          <div className="text-2xl font-black text-[#2E221F]">{totalCandidates}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Cadastros Assistidos</span>
          <div className="text-2xl font-black text-[#E65100]">{assistedCandidatesCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Empresas</span>
          <div className="text-2xl font-black text-[#2E221F]">{totalCompanies}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Candidaturas</span>
          <div className="text-2xl font-black text-emerald-600">{totalApplications}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Cursos Ativos</span>
          <div className="text-2xl font-black text-purple-600">{activeCoursesCount}</div>
        </div>
      </div>

      {/* Módulos Administrativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/vagas"
          className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <Briefcase className="w-6 h-6 text-[#E65100]" />
            <ArrowRight className="w-4 h-4 text-[#78716c] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-base text-[#2E221F]">Moderação de Vagas</h3>
          <p className="text-xs text-[#78716c]">
            Aprovar, pausar, rejeitar ou publicar vagas diretamente em nome de empresas parceiras.
          </p>
        </Link>

        <Link
          href="/admin/atendimento-assistido"
          className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <Users className="w-6 h-6 text-[#E65100]" />
            <ArrowRight className="w-4 h-4 text-[#78716c] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-base text-[#2E221F]">Atendimento Assistido</h3>
          <p className="text-xs text-[#78716c]">
            Cadastrar cidadãos presencialmente na Sala do Empreendedor e ACA com termo formal.
          </p>
        </Link>

        <Link
          href="/admin/candidatos"
          className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <FileCheck className="w-6 h-6 text-[#E65100]" />
            <ArrowRight className="w-4 h-4 text-[#78716c] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-base text-[#2E221F]">Banco de Talentos</h3>
          <p className="text-xs text-[#78716c]">
            Consultar perfis, escolaridade e currículos para triagem e encaminhamento na Feira.
          </p>
        </Link>

        <Link
          href="/admin/empresas"
          className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <Building2 className="w-6 h-6 text-[#E65100]" />
            <ArrowRight className="w-4 h-4 text-[#78716c] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-base text-[#2E221F]">Empresas Parceiras</h3>
          <p className="text-xs text-[#78716c]">
            Verificar empresas contratantes, CNPJs e vincular membros administradores.
          </p>
        </Link>

        <Link
          href="/admin/indicadores"
          className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <BarChart3 className="w-6 h-6 text-[#E65100]" />
            <ArrowRight className="w-4 h-4 text-[#78716c] group-hover:translate-x-1 transition" />
          </div>
          <h3 className="font-bold text-base text-[#2E221F]">Relatórios & Indicadores</h3>
          <p className="text-xs text-[#78716c]">
            Gráficos consolidados por área, cliques em cursos e exportação de dados auditada.
          </p>
        </Link>
      </div>
    </div>
  );
}
