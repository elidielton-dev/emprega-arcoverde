"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
} from "lucide-react";
import {
  FunnelCard,
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type CompanyRow = {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string;
  state: string;
  address: string | null;
  status: string;
  createdByInstitution: string | null;
  createdByName: string | null;
  jobsCount: number;
  membersCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

function statusTone(status: string): "success" | "warn" | "danger" | "neutral" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warn";
  if (status === "BLOCKED" || status === "REJECTED") return "danger";
  return "neutral";
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "Ativa",
    PENDING: "Pendente",
    BLOCKED: "Bloqueada",
    REJECTED: "Rejeitada",
  };
  return map[status] || status;
}

type Props = { companies: CompanyRow[]; success?: boolean };

export function CompaniesBoard({ companies, success }: Props) {
  const [q, setQ] = useState("");
  const [institution, setInstitution] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(companies[0]?.id || null);

  const counts = useMemo(
    () => ({
      active: companies.filter((c) => c.status === "ACTIVE").length,
      pending: companies.filter((c) => c.status === "PENDING").length,
      blocked: companies.filter((c) => c.status === "BLOCKED" || c.status === "REJECTED").length,
      withJobs: companies.filter((c) => c.jobsCount > 0).length,
    }),
    [companies],
  );

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (status && c.status !== status) return false;
      if (institution && (c.createdByInstitution || "") !== institution) return false;
      if (!q.trim()) return true;
      const n = q.toLowerCase();
      return (
        c.name.toLowerCase().includes(n) ||
        (c.tradeName || "").toLowerCase().includes(n) ||
        (c.cnpj || "").includes(n)
      );
    });
  }, [companies, q, status, institution]);

  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Empresas parceiras"
        description="Gerencie empresas cadastradas pela ACA e pela Prefeitura."
        actions={
          <PrimaryButton href="/admin/empresas/nova">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar empresa
          </PrimaryButton>
        }
      />

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Empresa cadastrada com auditoria do operador.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Empresas ativas" count={counts.active} icon={<Building2 className="h-4 w-4" />} />
        <FunnelCard label="Aguardando validação" count={counts.pending} />
        <FunnelCard label="Bloqueadas" count={counts.blocked} />
        <FunnelCard label="Com vagas abertas" count={counts.withJobs} />
      </div>

      <SurfaceCard className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por empresa ou CNPJ"
          className="flex-1 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs outline-none focus:border-[#E65100]"
        />
        <select
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
        >
          <option value="">Instituição de origem</option>
          <option value="ACA">ACA</option>
          <option value="PREFEITURA">Prefeitura</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
        >
          <option value="">Status</option>
          <option value="ACTIVE">Ativa</option>
          <option value="PENDING">Pendente</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="border-b border-[#E6E8EB] px-4 py-3">
            <h3 className="text-sm font-bold text-[#1C1410]">Empresas cadastradas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-[11px] uppercase text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">CNPJ</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Responsável</th>
                  <th className="px-4 py-3 font-semibold">Vagas</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#78716c]">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const active = selected?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`cursor-pointer ${
                          active
                            ? "bg-[#FFF4EA] shadow-[inset_3px_0_0_0_#E65100]"
                            : "hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1C1410]">{c.tradeName || c.name}</p>
                          {c.tradeName && <p className="text-[11px] text-[#78716c]">{c.name}</p>}
                        </td>
                        <td className="px-4 py-3 text-[#57433C]">{c.cnpj || "—"}</td>
                        <td className="px-4 py-3">
                          {c.createdByInstitution ? (
                            <StatusPill
                              label={c.createdByInstitution === "ACA" ? "ACA" : "Prefeitura"}
                              tone={c.createdByInstitution === "ACA" ? "success" : "info"}
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#57433C]">{c.createdByName || "—"}</td>
                        <td className="px-4 py-3 font-bold text-[#1C1410]">{c.jobsCount}</td>
                        <td className="px-4 py-3">
                          <StatusPill label={statusLabel(c.status)} tone={statusTone(c.status)} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#E6E8EB] px-4 py-2.5 text-[11px] text-[#78716c]">
            O cadastro é realizado por instituição autorizada; a empresa não se cadastra sozinha.
          </p>
        </SurfaceCard>

        <aside>
          {selected ? (
            <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
              <div className="space-y-3 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#FFF4EA] text-[#E65100]">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-base font-black text-[#1C1410]">
                    {selected.tradeName || selected.name}
                  </p>
                  {selected.isVerified && (
                    <StatusPill label="Empresa verificada" tone="success" />
                  )}
                </div>
                <ul className="space-y-2 text-xs text-[#57433C]">
                  {selected.email && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-[#E65100]" />
                      {selected.email}
                    </li>
                  )}
                  {selected.phone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-[#E65100]" />
                      {selected.phone}
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E65100]" />
                    {selected.address || `${selected.city} - ${selected.state}`}
                  </li>
                </ul>
                <p className="text-[11px] text-[#78716c]">
                  Origem: <strong className="text-[#1C1410]">{selected.createdByInstitution || "—"}</strong>
                </p>
                <p className="text-[11px] text-[#78716c]">
                  {selected.jobsCount} vagas · Atualizado{" "}
                  {new Date(selected.updatedAt).toLocaleDateString("pt-BR")}
                </p>
                <PrimaryButton href={`/admin/vagas?empresa=${selected.id}`} className="w-full">
                  Ver vagas
                </PrimaryButton>
                <Link
                  href="/admin/empresas/nova"
                  className="block text-center text-xs font-bold text-[#E65100] hover:underline"
                >
                  Cadastrar outra empresa
                </Link>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-8 text-center text-xs text-[#78716c]">
              Selecione uma empresa.
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
