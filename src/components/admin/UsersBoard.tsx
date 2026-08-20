"use client";

import React, { useMemo, useState } from "react";
import { UserCog, Users } from "lucide-react";
import {
  FunnelCard,
  PageHeader,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  createdAt: string;
  canDelete: boolean;
};

const PERMS: Record<string, string[]> = {
  MUNICIPAL_ADMIN: [
    "Visualizar dados agregados",
    "Gerenciar usuários",
    "Gerenciar cursos",
    "Excluir currículos",
    "Processar LGPD",
  ],
  ACA_ADMIN: [
    "Moderar vagas",
    "Cadastrar empresas",
    "Validar currículos",
    "Atendimento assistido",
  ],
  ASSISTED_OPERATOR: ["Atendimento assistido", "Cadastrar empresas", "Consultar candidatos"],
  SUPER_ADMIN: ["Acesso total à plataforma"],
};

type Props = {
  users: AdminUserRow[];
  currentUserId: string;
  error?: string;
  success?: boolean;
};

export function UsersBoard({ users, currentUserId, error, success }: Props) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    users.find((u) => ["ACA_ADMIN", "MUNICIPAL_ADMIN", "ASSISTED_OPERATOR", "SUPER_ADMIN"].includes(u.role))
      ?.id || users[0]?.id || null,
  );
  const [showCreate, setShowCreate] = useState(false);

  const adminUsers = useMemo(
    () =>
      users.filter((u) =>
        ["ACA_ADMIN", "MUNICIPAL_ADMIN", "ASSISTED_OPERATOR", "SUPER_ADMIN"].includes(u.role),
      ),
    [users],
  );

  const counts = useMemo(
    () => ({
      active: adminUsers.length,
      operators: adminUsers.filter((u) => u.role === "ASSISTED_OPERATOR").length,
      aca: adminUsers.filter((u) => u.role === "ACA_ADMIN").length,
      municipal: adminUsers.filter((u) => u.role === "MUNICIPAL_ADMIN").length,
    }),
    [adminUsers],
  );

  const filtered = useMemo(() => {
    return adminUsers.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!q.trim()) return true;
      const n = q.toLowerCase();
      return u.name.toLowerCase().includes(n) || u.email.toLowerCase().includes(n);
    });
  }, [adminUsers, q, roleFilter]);

  const selected = filtered.find((u) => u.id === selectedId) || filtered[0] || null;
  const perms = selected ? PERMS[selected.role] || ["Acesso conforme papel"] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários e permissões"
        description="Controle quem pode acessar dados e executar ações no sistema."
        actions={
          <button
            type="button"
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
          >
            <UserCog className="h-3.5 w-3.5" />
            {showCreate ? "Fechar" : "Novo usuário"}
          </button>
        }
      />

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error === "email_existente"
            ? "Este e-mail já está cadastrado."
            : "Revise os dados. A senha deve ter pelo menos 8 caracteres."}
        </p>
      )}
      {success && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Operação concluída com sucesso.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Usuários ativos" count={counts.active} hint="Com acesso" icon={<Users className="h-4 w-4" />} />
        <FunnelCard label="Operadores" count={counts.operators} hint="Sala / atendimento" />
        <FunnelCard label="Admins ACA" count={counts.aca} />
        <FunnelCard label="Admins municipais" count={counts.municipal} />
      </div>

      {(showCreate || error) && (
        <SurfaceCard className="p-5">
          <h3 className="mb-3 text-sm font-bold text-[#1C1410]">Criar acesso administrativo</h3>
          <form action="/api/admin/users" method="POST" className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-[#57433C]">
              Nome
              <input name="name" required className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-[#57433C]">
              E-mail
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-[#57433C]">
              Senha inicial
              <input
                name="password"
                type="password"
                minLength={8}
                required
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-bold text-[#57433C]">
              Papel
              <select name="role" className="mt-1 w-full rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-sm">
                <option value="ASSISTED_OPERATOR">Operador de Atendimento</option>
                <option value="ACA_ADMIN">Administrador ACA</option>
                <option value="MUNICIPAL_ADMIN">Administrador Municipal</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-md bg-[#E65100] px-4 py-2 text-xs font-bold text-white hover:bg-[#D84315] sm:col-span-2 sm:w-fit"
            >
              Criar usuário
            </button>
          </form>
        </SurfaceCard>
      )}

      <SurfaceCard className="flex flex-col gap-2 p-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome ou e-mail"
          className="flex-1 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs outline-none focus:border-[#E65100]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
        >
          <option value="">Todos os perfis</option>
          <option value="ASSISTED_OPERATOR">Operador</option>
          <option value="ACA_ADMIN">ACA</option>
          <option value="MUNICIPAL_ADMIN">Municipal</option>
          <option value="SUPER_ADMIN">Super</option>
        </select>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[#E6E8EB] px-4 py-3">
            <h3 className="text-sm font-bold text-[#1C1410]">Usuários cadastrados</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-[11px] uppercase text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Usuário</th>
                  <th className="px-4 py-3 font-semibold">Perfil</th>
                  <th className="px-4 py-3 font-semibold">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {filtered.map((u) => {
                  const active = selected?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedId(u.id)}
                      className={`cursor-pointer ${
                        active
                          ? "bg-[#FFF4EA] shadow-[inset_3px_0_0_0_#E65100]"
                          : "hover:bg-[#F4F5F7]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1C1410]">{u.name}</p>
                        <p className="text-[11px] text-[#78716c]">{u.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill label={u.roleLabel} tone="orange" />
                      </td>
                      <td className="px-4 py-3 text-[#78716c]">
                        {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <aside>
          {selected ? (
            <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
              <div className="border-b border-[#E6E8EB] px-4 py-3">
                <h3 className="text-sm font-bold text-[#1C1410]">Detalhes do usuário</h3>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C1410] text-sm font-bold text-white">
                    {selected.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-[#1C1410]">{selected.name}</p>
                    <p className="text-xs text-[#78716c]">{selected.email}</p>
                  </div>
                </div>
                <dl className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <dt className="text-[#78716c]">Perfil</dt>
                    <dd className="font-semibold text-[#1C1410]">{selected.roleLabel}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#78716c]">Status</dt>
                    <dd>
                      <StatusPill label="Ativo" tone="success" />
                    </dd>
                  </div>
                </dl>
                <div>
                  <p className="text-xs font-bold text-[#1C1410]">Permissões do perfil</p>
                  <ul className="mt-2 space-y-1.5">
                    {perms.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-[11px] text-[#57433C]">
                        <span className="text-emerald-600">✓</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                {selected.canDelete && selected.id !== currentUserId && (
                  <form action={`/api/admin/users/${selected.id}`} method="POST">
                    <input type="hidden" name="_method" value="DELETE" />
                    <button
                      type="submit"
                      className="w-full rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      Remover acesso
                    </button>
                  </form>
                )}
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-8 text-center text-xs text-[#78716c]">
              Selecione um usuário.
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
