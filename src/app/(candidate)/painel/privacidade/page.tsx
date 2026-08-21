import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Shield, ArrowLeft, Download, Trash2, AlertTriangle, Bell } from "lucide-react";
import { getOrCreateNotificationPref } from "@/lib/notifications/preferences";

export default async function CandidatoPrivacidadePage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      consents: true,
      deletionRequests: { orderBy: { requestedAt: "desc" } },
    },
  });

  if (!user) redirect("/entrar");

  const pref = await getOrCreateNotificationPref(session.userId);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <Link
          href="/painel"
          className="mb-2 inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao painel
        </Link>
        <h1 className="text-2xl font-black tracking-tight text-[#1C1410] sm:text-3xl">
          Privacidade & LGPD
        </h1>
        <p className="text-xs text-[#78716c]">
          Consentimentos, preferências de aviso, exportação e exclusão de dados.
        </p>
      </div>

      {searchParams.sucesso && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Preferências atualizadas.
        </div>
      )}

      <div className="space-y-4 rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <h2 className="flex items-center gap-2 border-b border-[#E6E8EB] pb-3 text-base font-bold text-[#1C1410]">
          <Download className="h-4 w-4 text-[#E65100]" />
          Portabilidade — baixar meus dados
        </h2>
        <p className="text-xs text-[#78716c]">
          Gere um arquivo JSON com perfil, currículo, candidaturas e consentimentos.
        </p>
        <a
          href="/api/candidate/export"
          className="inline-flex items-center gap-2 rounded-md bg-[#1C1410] px-4 py-2.5 text-xs font-bold text-white hover:bg-black"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar meus dados
        </a>
      </div>

      <div className="space-y-4 rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <h2 className="flex items-center gap-2 border-b border-[#E6E8EB] pb-3 text-base font-bold text-[#1C1410]">
          <Bell className="h-4 w-4 text-[#E65100]" />
          Preferências de notificação
        </h2>
        <form action="/api/notifications/preferences" method="POST" className="space-y-3 text-xs">
          <label className="flex items-center gap-2 font-semibold text-[#57433C]">
            <input type="checkbox" name="emailEnabled" defaultChecked={pref.emailEnabled} className="rounded" />
            Receber e-mails
          </label>
          <label className="flex items-center gap-2 font-semibold text-[#57433C]">
            <input type="checkbox" name="statusAlerts" defaultChecked={pref.statusAlerts} className="rounded" />
            Alertas de status de candidatura
          </label>
          <label className="flex items-center gap-2 font-semibold text-[#57433C]">
            <input type="checkbox" name="jobAlerts" defaultChecked={pref.jobAlerts} className="rounded" />
            Alertas de vagas / oportunidades
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#E65100] px-4 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
          >
            Salvar preferências
          </button>
        </form>
      </div>

      <div className="space-y-4 rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <h2 className="flex items-center gap-2 border-b border-[#E6E8EB] pb-3 text-base font-bold text-[#1C1410]">
          <Shield className="h-4 w-4 text-[#E65100]" />
          Consentimentos registrados
        </h2>
        <div className="space-y-2">
          {user.consents.length === 0 ? (
            <p className="text-xs text-[#78716c]">Nenhum consentimento registrado.</p>
          ) : (
            user.consents.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2.5 text-xs"
              >
                <div>
                  <strong className="block text-[#1C1410]">{c.type}</strong>
                  <span className="text-[11px] text-[#78716c]">
                    {new Date(c.acceptedAt).toLocaleString("pt-BR")}
                  </span>
                </div>
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  {c.accepted ? "Ativo" : "Revogado"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-red-200 bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-5 w-5" />
          <h2 className="text-base font-bold">Exclusão e anonimização</h2>
        </div>
        <p className="text-xs leading-relaxed text-[#57433C]">
          Ao processar, a Prefeitura remove o currículo e anonimiza a conta (e-mail e nome deixam de
          identificar você).
        </p>
        {user.deletionRequests.some((d) => d.status === "PENDING") ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            Solicitação pendente registrada. A gestão municipal processará em até 15 dias úteis.
          </div>
        ) : (
          <form action="/api/candidate/privacy" method="POST">
            <input type="hidden" name="action" value="REQUEST_DELETION" />
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4" />
              Solicitar exclusão da minha conta
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
