"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Headset, Users } from "lucide-react";
import {
  FunnelCard,
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type CandidateAdminRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string;
  state: string;
  neighborhood: string | null;
  professionalHeadline: string | null;
  educationLevel: string;
  driverLicense: string;
  isAssisted: boolean;
  assistedUnit: string | null;
  validationStatus: string;
  validationNotes: string | null;
  applicationsCount: number;
  summary: string | null;
  skills: string[];
  documentUrl: string | null;
  documentName: string | null;
  createdAt: string;
};

type Props = {
  candidates: CandidateAdminRow[];
  mayValidate: boolean;
  mayDelete: boolean;
  isAcaAdmin: boolean;
  initialQuery?: string;
  initialOrigem?: string;
};

function validationTone(s: string): "success" | "warn" | "danger" | "neutral" {
  if (s === "VALIDATED") return "success";
  if (s === "REJECTED") return "danger";
  return "warn";
}

function validationLabel(s: string) {
  if (s === "VALIDATED") return "Validado";
  if (s === "REJECTED") return "Rejeitado";
  return "Pendente";
}

export function CandidatesAdminBoard({
  candidates,
  mayValidate,
  mayDelete,
  isAcaAdmin,
  initialQuery = "",
  initialOrigem = "",
}: Props) {
  const [q, setQ] = useState(initialQuery);
  const [origem, setOrigem] = useState(initialOrigem);
  const [validation, setValidation] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(candidates[0]?.id || null);
  const [notes, setNotes] = useState("");

  const counts = useMemo(
    () => ({
      total: candidates.length,
      assisted: candidates.filter((c) => c.isAssisted).length,
      pending: candidates.filter((c) => c.validationStatus === "PENDING").length,
      validated: candidates.filter((c) => c.validationStatus === "VALIDATED").length,
    }),
    [candidates],
  );

  const filtered = useMemo(() => {
    return candidates.filter((c) => {
      if (origem === "ASSISTED" && !c.isAssisted) return false;
      if (origem === "SELF" && c.isAssisted) return false;
      if (validation && c.validationStatus !== validation) return false;
      if (onlyAvailable && c.validationStatus === "REJECTED") return false;
      if (!q.trim()) return true;
      const n = q.toLowerCase();
      return (
        c.fullName.toLowerCase().includes(n) ||
        (c.professionalHeadline || "").toLowerCase().includes(n) ||
        c.skills.some((s) => s.toLowerCase().includes(n))
      );
    });
  }, [candidates, q, origem, validation, onlyAvailable]);

  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Banco de candidatos"
        description="Consulte perfis para triagem, validação e encaminhamento."
        actions={
          <PrimaryButton href="/admin/atendimento-assistido">
            <Headset className="h-3.5 w-3.5" />
            Novo atendimento assistido
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Perfis ativos" count={counts.total} icon={<Users className="h-4 w-4" />} />
        <FunnelCard label="Cadastrados presencialmente" count={counts.assisted} />
        <FunnelCard label="Validados" count={counts.validated} />
        <FunnelCard label="Aguardando validação" count={counts.pending} />
      </div>

      <SurfaceCard className="flex flex-col gap-2 p-3 lg:flex-row lg:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, cargo ou habilidade"
          className="flex-1 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs outline-none focus:border-[#E65100]"
        />
        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value)}
          className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
        >
          <option value="">Origem do cadastro</option>
          <option value="ASSISTED">Assistido</option>
          <option value="SELF">Portal</option>
        </select>
        <select
          value={validation}
          onChange={(e) => setValidation(e.target.value)}
          className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
        >
          <option value="">Validação</option>
          <option value="PENDING">Pendente</option>
          <option value="VALIDATED">Validado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <label className="flex items-center gap-2 text-[11px] font-semibold text-[#57433C]">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="rounded border-[#E6E8EB] text-[#E65100]"
          />
          Somente disponíveis
        </label>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-[11px] uppercase text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidato</th>
                  <th className="px-4 py-3 font-semibold">Perfil desejado</th>
                  <th className="px-4 py-3 font-semibold">Localização</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Validação</th>
                  <th className="px-4 py-3 font-semibold">Candidaturas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-[#78716c]">
                      Nenhum candidato encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const active = selected?.id === c.id;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedId(c.id);
                          setNotes(c.validationNotes || "");
                        }}
                        className={`cursor-pointer ${
                          active
                            ? "bg-[#FFF4EA] shadow-[inset_3px_0_0_0_#E65100]"
                            : "hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-[#1C1410]">{c.fullName}</td>
                        <td className="px-4 py-3 text-[#57433C]">
                          {c.professionalHeadline || "Perfil geral"}
                        </td>
                        <td className="px-4 py-3 text-[#78716c]">
                          {c.city} - {c.state}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={c.isAssisted ? "Assistido" : "Portal"}
                            tone={c.isAssisted ? "info" : "neutral"}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={validationLabel(c.validationStatus)}
                            tone={validationTone(c.validationStatus)}
                          />
                        </td>
                        <td className="px-4 py-3 font-bold">{c.applicationsCount}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <aside>
          {selected ? (
            <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
              <div className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1C1410] text-sm font-bold text-white">
                    {selected.fullName
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-[#1C1410]">{selected.fullName}</p>
                    <p className="text-xs text-[#78716c]">
                      {selected.professionalHeadline || "Perfil geral"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selected.skills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded bg-[#F4F5F7] px-2 py-0.5 text-[11px] text-[#57433C]">
                      {s}
                    </span>
                  ))}
                </div>
                {selected.summary && (
                  <p className="text-xs leading-relaxed text-[#57433C]">{selected.summary}</p>
                )}
                <dl className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Escolaridade</dt>
                    <dd className="font-semibold text-[#1C1410]">{selected.educationLevel}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">CNH</dt>
                    <dd className="font-semibold text-[#1C1410]">
                      {selected.driverLicense === "NENHUMA" ? "Não possui" : selected.driverLicense}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Contato</dt>
                    <dd className="truncate font-semibold text-[#1C1410]">
                      {selected.phone || selected.email}
                    </dd>
                  </div>
                </dl>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/candidatos/${selected.id}`}
                    className="flex-1 rounded-md border border-[#E6E8EB] px-3 py-2 text-center text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                  >
                    Ver perfil
                  </Link>
                  <PrimaryButton href="/admin/atendimento-assistido" className="flex-1">
                    Encaminhar
                  </PrimaryButton>
                </div>
                {selected.documentUrl && (
                  <a
                    href={selected.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-center text-xs font-bold text-[#E65100] hover:underline"
                  >
                    Baixar currículo ({selected.documentName})
                  </a>
                )}

                {mayValidate && (
                  <form
                    action={`/api/admin/candidates/${selected.id}/validate`}
                    method="POST"
                    className="space-y-2 border-t border-[#E6E8EB] pt-3"
                  >
                    <input
                      name="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações da validação"
                      className="w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        name="status"
                        value="VALIDATED"
                        className="flex-1 rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white"
                      >
                        Validar
                      </button>
                      <button
                        name="status"
                        value="REJECTED"
                        className="flex-1 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700"
                      >
                        Rejeitar
                      </button>
                    </div>
                  </form>
                )}
                {mayDelete ? (
                  <form action={`/api/admin/candidates/${selected.id}/delete`} method="POST">
                    <button type="submit" className="w-full text-xs font-bold text-red-700 hover:underline">
                      Excluir currículo e dados relacionados
                    </button>
                  </form>
                ) : isAcaAdmin ? (
                  <p className="text-[11px] text-[#78716c]">
                    A ACA pode validar; exclusão é restrita à gestão municipal.
                  </p>
                ) : null}
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-8 text-center text-xs text-[#78716c]">
              Selecione um candidato.
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
