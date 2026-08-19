import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Shield, ArrowLeft, Download, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function CandidatoPrivacidadePage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      consents: true,
      deletionRequests: true,
    },
  });

  if (!user) {
    redirect("/entrar");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/painel"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel do candidato</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Privacidade & Gestão de Dados (LGPD)
        </h1>
        <p className="text-xs text-[#78716c]">
          Exercite seus direitos previstos na Lei Geral de Proteção de Dados: consulte seus consentimentos e solicite a exclusão de sua conta.
        </p>
      </div>

      {/* Histórico de Consentimentos */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-3">
          <Shield className="w-4 h-4 text-[#E65100]" />
          <span>Consentimentos Registrados</span>
        </h2>

        <div className="space-y-3">
          {user.consents.map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] flex items-center justify-between text-xs"
            >
              <div>
                <strong className="text-[#2E221F] block">
                  {c.type === "TERMS" && "Aceite dos Termos de Uso"}
                  {c.type === "PRIVACY" && "Aceite da Política de Privacidade"}
                  {c.type === "EMAIL_COMMUNICATION" && "Consentimento para Notificações por E-mail"}
                  {c.type === "WHATSAPP_COMMUNICATION" && "Consentimento para Notificações por WhatsApp"}
                  {c.type === "ASSISTED_SERVICE_CONSENT" && "Consentimento para Atendimento Presencial Assistido"}
                </strong>
                <span className="text-[11px] text-[#78716c]">
                  Registrado em {new Date(c.acceptedAt).toLocaleDateString("pt-BR")} às {new Date(c.acceptedAt).toLocaleTimeString("pt-BR")}
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Ativo
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Solicitação de Exclusão Definitiva */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-red-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <h2 className="text-base font-bold">Exclusão e Anonimização de Dados</h2>
        </div>

        <p className="text-xs text-[#57433C] leading-relaxed">
          Caso deseje encerrar seu perfil e remover seu currículo e candidaturas do banco do Emprega Arcoverde, seus dados pessoais serão desvinculados em conformidade com a LGPD.
        </p>

        {user.deletionRequests.length > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <strong>Solicitação registrada em {new Date(user.deletionRequests[0].requestedAt).toLocaleDateString("pt-BR")}.</strong> A administração municipal processará a exclusão em até 15 dias úteis.
          </div>
        ) : (
          <form action="/api/candidate/privacy" method="POST">
            <input type="hidden" name="action" value="REQUEST_DELETION" />
            <button
              type="submit"
              className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-5 py-2.5 rounded-xl border border-red-200 transition flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Solicitar Exclusão da Minha Conta</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
