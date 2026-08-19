import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Briefcase, MapPin, Building, ArrowRight, ShieldAlert, CheckCircle2 } from "lucide-react";

export default async function CandidaturasPage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    include: {
      applications: {
        include: {
          job: {
            include: {
              company: { select: { name: true, tradeName: true } },
              category: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    redirect("/painel/perfil");
  }

  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    SUBMITTED: { label: "Enviado", bg: "bg-blue-50", text: "text-blue-700" },
    UNDER_REVIEW: { label: "Em Análise", bg: "bg-amber-50", text: "text-amber-800" },
    CONTACT_SELECTED: { label: "Selecionado p/ Contato", bg: "bg-purple-50", text: "text-purple-700" },
    INTERVIEW_SCHEDULED: { label: "Entrevista Agendada", bg: "bg-emerald-50", text: "text-emerald-700" },
    APPROVED: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-900" },
    NOT_SELECTED: { label: "Não Selecionado", bg: "bg-stone-100", text: "text-stone-600" },
    WITHDRAWN: { label: "Desistência", bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Minhas Candidaturas
          </h1>
          <p className="text-xs text-[#78716c]">
            Acompanhe o andamento de cada processo seletivo em tempo real.
          </p>
        </div>
        <Link
          href="/vagas"
          className="bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-xs"
        >
          Ver Mais Vagas
        </Link>
      </div>

      {profile.applications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
          <Briefcase className="w-12 h-12 text-[#E65100] mx-auto" />
          <h3 className="text-base font-bold text-[#2E221F]">Nenhuma candidatura registrada</h3>
          <p className="text-xs text-[#78716c]">
            Você ainda não se candidatou a nenhuma vaga. Explore as vagas abertas em Arcoverde!
          </p>
          <Link
            href="/vagas"
            className="inline-block bg-[#E65100] text-white font-bold text-xs px-5 py-2.5 rounded-xl"
          >
            Buscar Vagas
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {profile.applications.map((app) => {
            const companyName = app.job.isConfidential
              ? "Empresa Confidencial"
              : app.job.company.tradeName || app.job.company.name;

            const currentStatus = statusLabels[app.status] || {
              label: app.status,
              bg: "bg-stone-100",
              text: "text-stone-700",
            };

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 border border-[#FEEDDF] hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                      {currentStatus.label}
                    </span>
                    <span className="text-xs text-[#78716c]">
                      Enviado em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                    {app.job.isConfidential && (
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                        Vaga Confidencial
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-[#2E221F]">
                    <Link href={`/painel/candidaturas/${app.id}`} className="hover:text-[#E65100]">
                      {app.job.title}
                    </Link>
                  </h3>

                  <div className="text-xs text-[#78716c] flex items-center gap-3">
                    <span className="font-semibold text-[#57433C]">{companyName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#E65100]" /> {app.job.city} - {app.job.state}
                    </span>
                  </div>

                  {app.statusHistory[0]?.notes && (
                    <p className="text-xs text-[#57433C] bg-[#FFF8F2] p-2.5 rounded-xl border border-[#FEEDDF]">
                      <strong>Última atualização:</strong> {app.statusHistory[0].notes}
                    </p>
                  )}
                </div>

                <Link
                  href={`/painel/candidaturas/${app.id}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#FFF8F2] hover:bg-[#FEEDDF] text-[#BF360C] font-bold text-xs px-4 py-2.5 rounded-xl transition self-start sm:self-center shrink-0"
                >
                  <span>Ver Histórico Detalhado</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
