"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CheckCircle2,
  Save,
  ShieldAlert,
  Users,
} from "lucide-react";
import { PageHeader, SecondaryButton, SurfaceCard } from "@/components/company/ui";

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

export type CompanyMemberRow = {
  id: string;
  role: string;
  userId: string;
  name: string;
  email: string;
};

const TABS = [
  { id: "perfil", label: "Perfil da empresa", icon: Building2 },
  { id: "usuarios", label: "Usuários", icon: Users },
  { id: "notificacoes", label: "Notificações", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

type Props = {
  company: CompanySettingsData;
  members: CompanyMemberRow[];
  canManageMembers: boolean;
  initialTab?: string;
  sucesso?: boolean;
  erro?: string;
};

export function SettingsBoard({
  company,
  members,
  canManageMembers,
  initialTab,
  sucesso,
  erro,
}: Props) {
  const [tab, setTab] = useState<TabId>("perfil");

  useEffect(() => {
    if (initialTab === "usuarios" || initialTab === "notificacoes" || initialTab === "perfil") {
      setTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        description="Perfil da empresa, equipe e notificações."
      />

      {sucesso && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <CheckCircle2 className="h-4 w-4" />
          Alteração salva com sucesso.
        </div>
      )}
      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {erro === "campos"
            ? "Preencha nome e e-mail válidos."
            : erro === "papel"
              ? "Este e-mail já pertence a outro tipo de conta."
              : erro === "ja_membro"
                ? "Este usuário já é membro."
                : erro === "auto"
                  ? "Você não pode remover a si mesmo."
                  : "Não foi possível concluir a operação."}
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
                  E-mail
                  <input
                    name="email"
                    type="email"
                    defaultValue={company.email || ""}
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold text-[#57433C]">
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
                Descrição
                <textarea
                  name="description"
                  rows={4}
                  defaultValue={company.description || ""}
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] p-3 text-sm outline-none focus:border-[#E65100]"
                />
              </label>

              <label className="flex items-start gap-2 text-xs font-semibold text-[#57433C]">
                <input
                  type="checkbox"
                  name="isConfidentialDefault"
                  defaultChecked={company.isConfidentialDefault}
                  className="mt-0.5 rounded"
                />
                <span className="inline-flex items-start gap-1.5">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 text-[#E65100]" />
                  Preferir vagas confidenciais por padrão
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-[#E65100] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
              >
                <Save className="h-4 w-4" />
                Salvar configurações
              </button>
            </form>
          )}

          {tab === "usuarios" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-[#1C1410]">Usuários da empresa</h3>
                <p className="mt-1 text-xs text-[#78716c]">
                  Convide recrutadores com acesso ao painel desta empresa.
                </p>
              </div>

              <ul className="divide-y divide-[#E6E8EB] rounded-md border border-[#E6E8EB]">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1C1410]">{m.name}</p>
                      <p className="truncate text-[#78716c]">
                        {m.email} · {m.role}
                      </p>
                    </div>
                    {canManageMembers && (
                      <form action="/api/company/members" method="POST">
                        <input type="hidden" name="action" value="REMOVE" />
                        <input type="hidden" name="memberId" value={m.id} />
                        <button type="submit" className="font-bold text-red-600 hover:underline">
                          Remover
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>

              {canManageMembers ? (
                <form action="/api/company/members" method="POST" className="grid gap-3 sm:grid-cols-2">
                  <input type="hidden" name="action" value="INVITE" />
                  <input
                    name="name"
                    required
                    placeholder="Nome"
                    className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                  />
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="E-mail"
                    className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                  />
                  <select name="role" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm">
                    <option value="MEMBER">Membro</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-md bg-[#E65100] px-3 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
                  >
                    Convidar
                  </button>
                </form>
              ) : (
                <p className="text-xs text-[#78716c]">
                  Somente OWNER/ADMIN podem convidar ou remover membros.
                </p>
              )}
            </div>
          )}

          {tab === "notificacoes" && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Notificações</h3>
              <p className="text-sm text-[#78716c]">
                Acompanhe novas candidaturas e avisos pelo sino no topo do painel.
              </p>
              <SecondaryButton href="/empresa/notificacoes" className="w-full sm:w-auto">
                Abrir caixa de notificações
              </SecondaryButton>
            </div>
          )}
        </SurfaceCard>
      </div>
    </div>
  );
}
