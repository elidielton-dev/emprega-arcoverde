import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  ArrowLeft,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Clock,
  ShieldAlert,
} from "lucide-react";

export default async function CandidaturaDetalhePage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      candidate: true,
      job: {
        include: {
          company: { select: { name: true, tradeName: true } },
          category: true,
        },
      },
      statusHistory: {
        orderBy: { createdAt: "desc" },
      },
      interview: true,
    },
  });

  // Garantir que o candidato só acesse a própria candidatura!
  if (!application || application.candidate.userId !== session.userId) {
    notFound();
  }

  const companyDisplayName = application.job.isConfidential
    ? "Empresa Confidencial"
    : application.job.company.tradeName || application.job.company.name;

  const statusLabels: Record<string, { label: string; desc: string }> = {
    SUBMITTED: {
      label: "Candidatura Enviada",
      desc: "Seu currículo foi recebido e aguarda triagem da equipe de recrutamento.",
    },
    UNDER_REVIEW: {
      label: "Em Análise",
      desc: "Seu perfil está sendo avaliado pelos responsáveis da vaga.",
    },
    CONTACT_SELECTED: {
      label: "Selecionado para Contato",
      desc: "Você foi selecionado para a próxima fase. Fique atento ao seu telefone e e-mail!",
    },
    INTERVIEW_SCHEDULED: {
      label: "Entrevista Agendada",
      desc: "Uma entrevista foi agendada para você. Confira as orientações enviadas.",
    },
    APPROVED: {
      label: "Aprovado no Processo",
      desc: "Parabéns! Você avançou para a etapa final de contratação.",
    },
    NOT_SELECTED: {
      label: "Processo Encerrado",
      desc: "Agradecemos sua participação. Outras vagas compatíveis continuam disponíveis no portal.",
    },
    WITHDRAWN: {
      label: "Candidatura Retirada",
      desc: "Você optou por não dar continuidade a este processo seletivo.",
    },
  };

  const currentStatusInfo = statusLabels[application.status] || {
    label: application.status,
    desc: "Acompanhamento do status",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/painel/candidaturas"
          className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-[#E65100] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Minhas Candidaturas</span>
        </Link>
      </div>

      {/* Cartão de Resumo */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                {application.job.category.name}
              </span>
              {application.job.isConfidential && (
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#E65100]" /> Vaga Confidencial
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-[#2E221F] tracking-tight">
              {application.job.title}
            </h1>

            <p className="text-sm font-semibold text-[#57433C]">
              {companyDisplayName} • {application.job.city}, {application.job.state}
            </p>
          </div>

          {/* V2 matching hidden */}
        </div>

        {/* Situação Atual */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#FEEDDF]/60 border border-[#FDCFA9] space-y-1">
          <span className="text-xs font-bold text-[#BF360C] uppercase tracking-wider">Situação Atual</span>
          <h2 className="text-lg font-black text-[#2E221F]">{currentStatusInfo.label}</h2>
          <p className="text-xs text-[#57433C]">{currentStatusInfo.desc}</p>
        </div>

        {application.interview && (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1 text-sm text-emerald-950">
            <h3 className="font-bold">Detalhes da entrevista</h3>
            <p><strong>Data:</strong> {new Date(application.interview.scheduledAt).toLocaleString("pt-BR")}</p>
            {application.interview.location && <p><strong>Local:</strong> {application.interview.location}</p>}
            {application.interview.instructions && <p><strong>Orientações:</strong> {application.interview.instructions}</p>}
          </div>
        )}

        {/* Linha do Tempo / Histórico */}
        <div className="space-y-4 pt-4 border-t border-[#FEEDDF]">
          <h3 className="text-sm font-bold text-[#2E221F]">Histórico do Processo</h3>

          <div className="space-y-4">
            {application.statusHistory.map((hist, index) => (
              <div key={hist.id} className="flex items-start gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FEEDDF] text-[#E65100] flex items-center justify-center font-bold shrink-0 mt-0.5">
                  ✓
                </div>
                <div className="space-y-1 flex-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <div className="flex items-center justify-between font-bold text-[#2E221F]">
                    <span>{statusLabels[hist.status]?.label || hist.status}</span>
                    <span className="text-[11px] text-[#78716c] font-normal">
                      {new Date(hist.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {hist.notes && <p className="text-[#57433C]">{hist.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* V2 matching hidden */}
      </div>
    </div>
  );
}
