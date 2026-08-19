import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import {
  Briefcase,
  Check,
  X,
  Pause,
  Play,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Building,
  Users,
} from "lucide-react";

interface AdminVagasPageProps {
  searchParams: {
    sucesso?: string;
  };
}

export default async function AdminVagasPage({ searchParams }: AdminVagasPageProps) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const jobs = await prisma.job.findMany({
    include: {
      company: true,
      category: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusBadges: Record<string, { label: string; bg: string; text: string }> = {
    DRAFT: { label: "Rascunho", bg: "bg-stone-100", text: "text-stone-700" },
    PENDING_REVIEW: { label: "Pendente de Revisão ACA", bg: "bg-amber-50", text: "text-amber-800" },
    PUBLISHED: { label: "Publicada", bg: "bg-emerald-50", text: "text-emerald-800" },
    PAUSED: { label: "Pausada", bg: "bg-stone-100", text: "text-stone-700" },
    CLOSED: { label: "Encerrada", bg: "bg-red-50", text: "text-red-700" },
    REJECTED: { label: "Rejeitada", bg: "bg-red-100", text: "text-red-800" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel de governança</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Moderação & Gestão Global de Vagas
        </h1>
        <p className="text-xs text-[#78716c]">
          Aprove, rejeite ou pause oportunidades de emprego submetidas pelas empresas em Arcoverde.
        </p>
      </div>

      {searchParams.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Ação de moderação registrada e auditada com sucesso!</span>
        </div>
      )}

      <div className="space-y-4">
        {jobs.map((job) => {
          const badge = statusBadges[job.status] || { label: job.status, bg: "bg-stone-100", text: "text-stone-700" };

          return (
            <div
              key={job.id}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-[#78716c]">{job.category.name}</span>
                    {job.isConfidential && (
                      <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                        <ShieldAlert className="w-3 h-3 text-[#E65100]" /> Confidencial
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-[#2E221F]">
                    {job.title}
                  </h2>

                  <div className="text-xs text-[#57433C] space-y-1">
                    <p>
                      <strong>Empresa Contratante:</strong> {job.company.tradeName || job.company.name} ({job.company.city})
                    </p>
                    <p className="text-[#78716c]">
                      {job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga" : "vagas"} • {job.contractType} • {job.workplaceType} • {job._count.applications} candidatos inscritos
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-[#78716c]">
                  <span>Criada em {new Date(job.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>

              {/* Descrição Resumida */}
              <div className="text-xs text-[#57433C] bg-[#FFF8F2] p-4 rounded-2xl border border-[#FEEDDF] space-y-1">
                <strong>Resumo:</strong> {job.summary}
                <div className="pt-2 text-[11px] text-[#78716c]">
                  <strong>Requisitos:</strong> {job.requirements}
                </div>
              </div>

              {/* Ações de Moderação */}
              <div className="pt-2 border-t border-[#FEEDDF] flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/vagas/${job.slug}`}
                  target="_blank"
                  className="text-xs font-bold text-[#E65100] hover:underline"
                >
                  Visualizar como Candidato ↗
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  {job.status !== "PUBLISHED" && (
                    <form action={`/api/admin/jobs/${job.id}/review`} method="POST">
                      <input type="hidden" name="action" value="APPROVE" />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar & Publicar</span>
                      </button>
                    </form>
                  )}

                  {job.status === "PUBLISHED" && (
                    <form action={`/api/admin/jobs/${job.id}/review`} method="POST">
                      <input type="hidden" name="action" value="PAUSE" />
                      <button
                        type="submit"
                        className="bg-stone-600 hover:bg-stone-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pausar Vaga</span>
                      </button>
                    </form>
                  )}

                  {job.status !== "REJECTED" && job.status !== "CLOSED" && (
                    <form action={`/api/admin/jobs/${job.id}/review`} method="POST">
                      <input type="hidden" name="action" value="REJECT" />
                      <button
                        type="submit"
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-4 py-2 rounded-xl border border-red-200 transition flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Rejeitar</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
