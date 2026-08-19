import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Briefcase, Plus, Users, ShieldAlert, ArrowLeft, ArrowRight } from "lucide-react";

export default async function EmpresaVagasListPage() {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && session.role !== "SUPER_ADMIN")) {
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
    redirect("/entrar");
  }

  const jobs = membership.company.jobs;

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: "Rascunho", bg: "bg-stone-100", text: "text-stone-700" },
    PENDING_REVIEW: { label: "Aguardando Moderação ACA", bg: "bg-amber-50", text: "text-amber-800" },
    PUBLISHED: { label: "Publicada e Aberta", bg: "bg-emerald-50", text: "text-emerald-800" },
    PAUSED: { label: "Pausada", bg: "bg-stone-100", text: "text-stone-700" },
    CLOSED: { label: "Encerrada", bg: "bg-red-50", text: "text-red-700" },
    REJECTED: { label: "Rejeitada", bg: "bg-red-100", text: "text-red-800" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/empresa"
            className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao painel</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Gestão de Vagas da Empresa
          </h1>
          <p className="text-xs text-[#78716c]">
            Consulte o status de moderação e acesse os candidatos inscritos em cada oportunidade.
          </p>
        </div>

        <Link
          href="/empresa/vagas/nova"
          className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md transition flex items-center gap-2 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Vaga</span>
        </Link>
      </div>

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
            <Briefcase className="w-12 h-12 text-[#E65100] mx-auto" />
            <h3 className="text-base font-bold text-[#2E221F]">Nenhuma vaga cadastrada</h3>
            <p className="text-xs text-[#78716c]">Cadastre uma nova vaga para iniciar seu processo seletivo.</p>
            <Link
              href="/empresa/vagas/nova"
              className="inline-block bg-[#E65100] text-white font-bold text-xs px-5 py-2.5 rounded-xl"
            >
              Criar Vaga
            </Link>
          </div>
        ) : (
          jobs.map((job) => {
            const badge = statusBadges[job.status] || { label: job.status, bg: "bg-stone-100", text: "text-stone-700" };

            return (
              <div
                key={job.id}
                className="bg-white p-6 rounded-3xl border border-[#FEEDDF] hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-[#78716c]">{job.category.name}</span>
                    {job.isConfidential && (
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3 h-3 text-[#E65100]" /> Confidencial
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#2E221F]">{job.title}</h3>

                  <div className="text-xs text-[#78716c] flex items-center gap-3">
                    <span>{job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga" : "vagas"}</span>
                    <span>•</span>
                    <span>{job.contractType}</span>
                    <span>•</span>
                    <span>{job.workplaceType}</span>
                    <span>•</span>
                    <span>Cadastrada em {new Date(job.createdAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/empresa/vagas/${job.id}/candidaturas`}
                    className="bg-[#FFF8F2] hover:bg-[#FEEDDF] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver Candidatos ({job._count.applications})</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
