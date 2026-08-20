"use client";

import React, { useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  GitBranch,
  Save,
  ShieldAlert,
  Users,
} from "lucide-react";
import { PageHeader, SurfaceCard } from "@/components/company/ui";

export type CompanySettingsData = {
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  description: string | null;
  isConfidentialDefault: boolean;
};

const TABS = [
  { id: "perfil", label: "Perfil da empresa", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "etapas", label: "Etapas do funil", icon: GitBranch },
  { id: "notificacoes", label: "Notificações", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  company: CompanySettingsData;
  sucesso?: boolean;
  erro?: string;
};

export function SettingsBoard({ company, sucesso, erro }: Props) {
  const [tab, setTab] = useState<TabId>("perfil");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        description="Dados da empresa, preferências e (em breve) usuários e notificações."
      />

      {sucesso && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Dados atualizados com sucesso.
        </div>
      )}
      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {erro}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        <SurfaceCard className="h-fit overflow-hidden p-2">
          <nav className="space-y-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-semibold transition ${
                    active
                      ? "bg-[#FFF4EA] text-[#E65100]"
                      : "text-[#57433C] hover:bg-[#F4F5F7]"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </SurfaceCard>

        <SurfaceCard className="p-5 sm:p-6">
          {tab === "perfil" && (
            <form action="/api/company/profile" method="POST" className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#1C1410]">Perfil da empresa</h3>
                <p className="mt-1 text-xs text-[#78716c]">
                  Usado na validação institucional e no contato com a ACA.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-[#57433C]">
                  Nome fantasia
                  <input
                    name="tradeName"
                    defaultValue={company.tradeName || company.name}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#57433C]">
                  Razão social *
                  <input
                    name="name"
                    required
                    defaultValue={company.name}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-bold text-[#57433C]">
                  CNPJ
                  <input
                    name="cnpj"
                    defaultValue={company.cnpj || ""}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#57433C]">
                  Telefone
                  <input
                    name="phone"
                    defaultValue={company.phone || ""}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#57433C]">
                  E-mail do RH
                  <input
                    type="email"
                    name="email"
                    defaultValue={company.email || ""}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
                  Endereço
                  <input
                    name="address"
                    defaultValue={company.address || ""}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
                <label className="block text-xs font-bold text-[#57433C]">
                  Cidade
                  <input
                    name="city"
                    defaultValue={company.city || "Arcoverde"}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
              </div>

              <label className="block text-xs font-bold text-[#57433C]">
                Apresentação
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={company.description || ""}
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-md bg-[#FFF4EA] p-3 text-xs font-bold text-[#1C1410]">
                <input
                  type="checkbox"
                  name="isConfidentialDefault"
                  defaultChecked={company.isConfidentialDefault}
                  className="rounded text-[#E65100]"
                />
                <ShieldAlert className="h-4 w-4 text-[#E65100]" />
                Preferir vagas confidenciais por padrão
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-[#E65100] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
              >
                <Save className="h-4 w-4" />
                Salvar configurações
              </button>
            </form>
          )}

          {tab === "usuarios" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Usuários da empresa</h3>
              <p className="text-sm text-[#78716c]">
                Em breve: convite de recrutadores e permissões por papel. Hoje o acesso é gerenciado
                pela ACA/Prefeitura no cadastro institucional.
              </p>
              <div className="rounded-md border border-dashed border-[#E6E8EB] bg-[#F4F5F7] px-4 py-8 text-center text-xs text-[#78716c]">
                Gestão de usuários ainda não disponível neste MVP.
              </div>
            </div>
          )}

          {tab === "etapas" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Etapas do funil</h3>
              <p className="text-sm text-[#78716c]">
                O funil padrão do Emprega Arcoverde é fixo no MVP para padronizar a triagem.
              </p>
              <ol className="space-y-2">
                {[
                  "Novos",
                  "Em triagem / Contato",
                  "Entrevista",
                  "Oferta / Aprovado",
                  "Não selecionado",
                ].map((step, i) => (
                  <li
                    key={step}
                    className="flex items-center gap-3 rounded-md border border-[#EEF2F0] px-3 py-2.5 text-sm"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#FFF4EA] text-[11px] font-black text-[#E65100]">
                      {i + 1}
                    </span>
                    <span className="font-semibold text-[#1C1410]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tab === "notificacoes" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Notificações</h3>
              <p className="text-sm text-[#78716c]">
                Preferências de e-mail e alertas de novas candidaturas chegarão em uma próxima
                versão.
              </p>
              <div className="space-y-2 opacity-60">
                {[
                  "Nova candidatura em vaga publicada",
                  "Lembrete de entrevista no dia",
                  "Resumo semanal do funil",
                ].map((label) => (
                  <label
                    key={label}
                    className="flex cursor-not-allowed items-center gap-2 rounded-md border border-[#EEF2F0] px-3 py-2.5 text-xs font-semibold text-[#57433C]"
                  >
                    <input type="checkbox" disabled className="rounded" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
