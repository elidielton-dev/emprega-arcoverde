import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { isWithinCompanyEditWindow } from "@/lib/jobs/edit-window";
import { Briefcase, Users, ShieldAlert, ArrowLeft, Pencil, LockKeyhole } from "lucide-react";

export default async function EmpresaVagasListPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
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
    redirect(isAdmin(session.role) ? "/admin/vagas" : "/entrar");
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

        <div className="max-w-sm rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-4 text-xs text-[#57433C]">
          Novas vagas são cadastradas pela ACA/Prefeitura. A empresa acompanha, edita no prazo permitido e encerra a seleção.
        </div>
      </div>

      {searchParams.sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800">
          Operação realizada com sucesso.
        </div>
      )}

      <div className="space-y-4">
        {jobs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
            <Briefcase className="w-12 h-12 text-[#E65100] mx-auto" />
            <h3 className="text-base font-bold text-[#2E221F]">Nenhuma vaga cadastrada</h3>
            <p className="text-xs text-[#78716c]">Solicite o cadastro da oportunidade à ACA ou à Prefeitura.</p>
            <Link
              href="/contato"
              className="inline-block bg-[#E65100] text-white font-bold text-xs px-5 py-2.5 rounded-xl"
            >
              Ver contatos
            </Link>
          </div>
        ) : (
          jobs.map((job) => {
            const badge = statusBadges[job.status] || { label: job.status, bg: "bg-stone-100", text: "text-stone-700" };
            const canEdit = isWithinCompanyEditWindow(job.createdAt);

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

                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/empresa/vagas/${job.id}/editar`}
                    className="border border-[#FEEDDF] hover:bg-[#FFF8F2] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>{canEdit ? "Editar" : "Solicitar alteração"}</span>
                  </Link>
                  <Link
                    href={`/empresa/vagas/${job.id}/candidaturas`}
                    className="bg-[#FFF8F2] hover:bg-[#FEEDDF] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver Candidatos ({job._count.applications})</span>
                  </Link>
                  {job.status === "PUBLISHED" && (
                    <form action={`/api/company/jobs/${job.id}/close`} method="POST" className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-2">
                      <select name="selectionResult" className="rounded-lg border border-red-200 bg-white px-2 py-2 text-xs text-red-800" defaultValue="">
                        <option value="">Sem resultado</option>
                        <option value="FILLED">Preenchida</option>
                        <option value="NOT_FILLED">Não preenchida</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                      <input name="filledVacanciesCount" type="number" min={0} max={job.vacanciesCount} placeholder="Preenchidas" className="w-24 rounded-lg border border-red-200 px-2 py-2 text-xs" />
                      <button className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white">
                        <LockKeyhole className="w-3.5 h-3.5" /> Encerrar seleção
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
