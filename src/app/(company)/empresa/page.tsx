import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import {
  Building2,
  Briefcase,
  Users,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default async function EmpresaDashboardPage() {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
    redirect("/entrar");
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.userId },
    include: {
      company: {
        include: {
          jobs: {
            include: {
              category: true,
              _count: { select: { applications: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect(isAdmin(session.role) ? "/admin" : "/entrar");
  }

  const company = membership.company;
  const totalJobs = company.jobs.length;
  const publishedJobs = company.jobs.filter((j) => j.status === "PUBLISHED").length;
  const pendingJobs = company.jobs.filter((j) => j.status === "PENDING_REVIEW").length;
  const totalApplications = company.jobs.reduce((acc, j) => acc + j._count.applications, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#E65100] uppercase tracking-wider">
            Painel da Empresa Contratante
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            {company.tradeName || company.name}
          </h1>
          <p className="text-xs text-[#78716c]">
            {company.city} - {company.state} • {company.isVerified ? "Empresa Verificada pela ACA" : "Em verificação"}
          </p>
        </div>

        <div className="max-w-sm rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-4 text-xs leading-relaxed text-[#57433C]">
          O cadastro de novas vagas é realizado pela ACA/Prefeitura. Envie os dados da oportunidade pelos canais institucionais.
        </div>
      </div>

      {/* Indicadores Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Total de Vagas</span>
          <div className="text-2xl font-black text-[#2E221F]">{totalJobs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Vagas Publicadas</span>
          <div className="text-2xl font-black text-emerald-600">{publishedJobs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Em Moderação / ACA</span>
          <div className="text-2xl font-black text-amber-600">{pendingJobs}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#FEEDDF] space-y-1">
          <span className="text-xs text-[#78716c]">Candidaturas Recebidas</span>
          <div className="text-2xl font-black text-[#E65100]">{totalApplications}</div>
        </div>
      </div>

      {/* Vagas da Empresa */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg text-[#2E221F]">Suas Vagas Recentes</h2>
          <Link href="/empresa/vagas" className="text-xs font-bold text-[#E65100] hover:underline">
            Gerenciar todas as vagas →
          </Link>
        </div>

        {company.jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
            <Briefcase className="w-12 h-12 text-[#E65100] mx-auto" />
            <h3 className="text-base font-bold text-[#2E221F]">Nenhuma vaga criada ainda</h3>
            <p className="text-xs text-[#78716c]">
              Solicite à ACA ou à Prefeitura o cadastro da primeira oportunidade.
            </p>
            <Link
              href="/contato"
              className="inline-block bg-[#E65100] text-white font-bold text-xs px-5 py-2.5 rounded-xl"
            >
              Ver contatos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {company.jobs.map((job) => {
              const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
                DRAFT: { label: "Rascunho", bg: "bg-stone-100", text: "text-stone-700" },
                PENDING_REVIEW: { label: "Aguardando Moderação ACA", bg: "bg-amber-50", text: "text-amber-800" },
                PUBLISHED: { label: "Publicada e Aberta", bg: "bg-emerald-50", text: "text-emerald-800" },
                PAUSED: { label: "Pausada", bg: "bg-stone-100", text: "text-stone-700" },
                CLOSED: { label: "Encerrada", bg: "bg-red-50", text: "text-red-700" },
                REJECTED: { label: "Rejeitada", bg: "bg-red-100", text: "text-red-800" },
              };

              const badge = statusBadges[job.status] || { label: job.status, bg: "bg-stone-100", text: "text-stone-700" };

              return (
                <div
                  key={job.id}
                  className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-[#78716c]">{job.category.name}</span>
                      {job.isConfidential && (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium">
                          Confidencial
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-[#2E221F]">{job.title}</h3>
                    <p className="text-xs text-[#78716c]">
                      {job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga" : "vagas"} • {job.contractType} • {job.workplaceType}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/empresa/vagas/${job.id}/candidaturas`}
                      className="bg-[#FFF8F2] hover:bg-[#FEEDDF] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                    >
                      <Users className="w-4 h-4" />
                      <span>{job._count.applications} Candidatos</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
