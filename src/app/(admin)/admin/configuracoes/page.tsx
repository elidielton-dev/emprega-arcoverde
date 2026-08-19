import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";
import { Settings, ArrowLeft, Shield, Mail, Smartphone, Save, CheckCircle2 } from "lucide-react";

export default async function AdminConfiguracoesPage() {
  const session = await getSession();
  if (!session || !isMunicipalOrSuperAdmin(session.role)) {
    redirect("/admin");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel de governança</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Configurações Institucionais
        </h1>
        <p className="text-xs text-[#78716c]">
          Parâmetros do portal, canais de comunicação transacional e integrações externas.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <Mail className="w-4 h-4 text-[#E65100]" />
            <span>E-mails Transacionais</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-[#57433C] mb-1">Remetente Oficial</label>
              <input
                type="text"
                disabled
                defaultValue="nao-responda@emprega.arcoverde.pe.gov.br"
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-600"
              />
            </div>
            <div>
              <label className="block font-bold text-[#57433C] mb-1">Status do Provedor</label>
              <input
                type="text"
                disabled
                defaultValue="Driver Ativo (Mock Dev / Resend Prod)"
                className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <Smartphone className="w-4 h-4 text-[#E65100]" />
            <span>Integração Oficial de WhatsApp</span>
          </h2>
          <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#BF360C]">
              <Shield className="w-4 h-4" />
              <span>Status: Desativado por padrão (Seguro)</span>
            </div>
            <p className="text-[#57433C] leading-relaxed">
              O envio de mensagens via WhatsApp só entrará em operação mediante configuração formal das credenciais da Meta Cloud API / provedor oficial e com opt-in explícito do candidato.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
