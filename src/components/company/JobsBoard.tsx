"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  LockKeyhole,
  Pencil,
  ShieldAlert,
  Users,
} from "lucide-react";
import { FunnelCard, PageHeader, StatusPill, SurfaceCard } from "@/components/company/ui";

export type JobRow = {
  id: string;
  title: string;
  status: string;
  categoryName: string;
  isConfidential: boolean;
  applicationsCount: number;
  novos: number;
  triagem: number;
  entrevistas: number;
  createdAt: string;
  publishedAt: string | null;
  canEdit: boolean;
  city: string;
  contractType: string;
};

const STATUS_META: Record<string, { label: string; tone: "neutral" | "success" | "warn" | "danger" | "info" | "orange" }> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PENDING_REVIEW: { label: "Em moderação", tone: "warn" },
  PUBLISHED: { label: "Publicada", tone: "success" },
  PAUSED: { label: "Pausada", tone: "neutral" },
  CLOSED: { label: "Encerrada", tone: "danger" },
  REJECTED: { label: "Rejeitada", tone: "danger" },
};

type Props = {
  jobs: JobRow[];
  success?: boolean;
};

export function JobsBoard({ jobs, success }: Props) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id || null);

  const counts = useMemo(() => {
    return {
      total: jobs.length,
      published: jobs.filter((j) => j.status === "PUBLISHED").length,
      paused: jobs.filter((j) => j.status === "PAUSED").length,
      closed: jobs.filter((j) => j.status === "CLOSED").length,
      pending: jobs.filter((j) => j.status === "PENDING_REVIEW").length,
    };
  }, [jobs]);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (status && j.status !== status) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        j.title.toLowerCase().includes(needle) ||
        j.categoryName.toLowerCase().includes(needle) ||
        j.city.toLowerCase().includes(needle)
      );
    });
  }, [jobs, q, status]);

  const selected = filtered.find((j) => j.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vagas"
        description="Consulte status, edite no prazo permitido e abra a triagem de candidatos."
        actions={
          <Link
            href="/empresa/vagas/nova"
            className="inline-flex items-center justify-center rounded-md border border-[#E6E8EB] bg-white px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
          >
            Como solicitar vaga
          </Link>
        }
      />

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Operação realizada com sucesso.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <FunnelCard label="Total" count={counts.total} icon={<Briefcase className="h-4 w-4" />} />
        <FunnelCard
          label="Publicadas"
          count={counts.published}
          active={status === "PUBLISHED"}
          onClick={() => setStatus(status === "PUBLISHED" ? "" : "PUBLISHED")}
        />
        <FunnelCard
          label="Em moderação"
          count={counts.pending}
          active={status === "PENDING_REVIEW"}
          onClick={() => setStatus(status === "PENDING_REVIEW" ? "" : "PENDING_REVIEW")}
        />
        <FunnelCard
          label="Pausadas"
          count={counts.paused}
          active={status === "PAUSED"}
          onClick={() => setStatus(status === "PAUSED" ? "" : "PAUSED")}
        />
        <FunnelCard
          label="Encerradas"
          count={counts.closed}
          active={status === "CLOSED"}
          onClick={() => setStatus(status === "CLOSED" ? "" : "CLOSED")}
        />
      </div>

      <SurfaceCard className="p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, categoria ou cidade…"
            className="w-full rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3.5 py-2.5 text-sm text-[#1C1410] outline-none placeholder:text-[#78716c] focus:border-[#E65100]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs text-[#1C1410] sm:w-48"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      {jobs.length === 0 ? (
        <SurfaceCard className="p-12 text-center">
          <Briefcase className="mx-auto h-10 w-10 text-[#E65100]" />
          <h3 className="mt-3 text-base font-bold text-[#1C1410]">Nenhuma vaga cadastrada</h3>
          <p className="mt-1 text-xs text-[#78716c]">Solicite o cadastro à ACA ou à Prefeitura.</p>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <SurfaceCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#EEF2F0] bg-[#F4F5F7] text-[11px] uppercase tracking-wide text-[#78716c]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Vaga</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Candidatos</th>
                    <th className="px-4 py-3 font-semibold">Funil</th>
                    <th className="px-4 py-3 font-semibold">Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEF2F0]">
                  {filtered.map((job) => {
                    const meta = STATUS_META[job.status] || { label: job.status, tone: "neutral" as const };
                    const active = selected?.id === job.id;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => setSelectedId(job.id)}
                        className={`cursor-pointer ${active ? "bg-[#FFF4EA]" : "hover:bg-[#FBFCFC]"}`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1C1410]">{job.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#78716c]">
                            <span>{job.categoryName}</span>
                            <span>· {job.city}</span>
                            {job.isConfidential && (
                              <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5">
                                <ShieldAlert className="h-3 w-3 text-[#E65100]" /> Confidencial
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={meta.label} tone={meta.tone} />
                        </td>
                        <td className="px-4 py-3 font-bold text-[#1C1410]">{job.applicationsCount}</td>
                        <td className="px-4 py-3 text-[11px] text-[#78716c]">
                          {job.novos} novos · {job.triagem} triagem · {job.entrevistas} ent.
                        </td>
                        <td className="px-4 py-3 text-xs text-[#78716c]">
                          {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#78716c]">
                        Nenhuma vaga com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <aside>
            {selected ? (
              <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
                <div className="border-b border-[#EEF2F0] bg-[#F4F5F7] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#78716c]">
                    Atalhos da vaga
                  </p>
                  <h3 className="mt-1 text-sm font-bold text-[#1C1410]">{selected.title}</h3>
                </div>
                <div className="space-y-3 p-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-[#F4F5F7] px-2 py-2">
                      <p className="text-lg font-black text-[#1C1410]">{selected.novos}</p>
                      <p className="text-[10px] text-[#78716c]">Novos</p>
                    </div>
                    <div className="rounded-md bg-[#F4F5F7] px-2 py-2">
                      <p className="text-lg font-black text-[#1C1410]">{selected.triagem}</p>
                      <p className="text-[10px] text-[#78716c]">Triagem</p>
                    </div>
                    <div className="rounded-md bg-[#F4F5F7] px-2 py-2">
                      <p className="text-lg font-black text-[#1C1410]">{selected.entrevistas}</p>
                      <p className="text-[10px] text-[#78716c]">Entrev.</p>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#78716c]">
                    {selected.contractType} · {selected.city}
                    {selected.publishedAt
                      ? ` · publicada em ${new Date(selected.publishedAt).toLocaleDateString("pt-BR")}`
                      : ""}
                  </p>

                  <Link
                    href={`/empresa/candidatos?vaga=${selected.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
                  >
                    <Users className="h-3.5 w-3.5" />
                    Abrir candidatos
                  </Link>
                  <Link
                    href={`/empresa/vagas/${selected.id}/editar`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E6E8EB] px-3 py-2.5 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {selected.canEdit ? "Editar vaga" : "Solicitar alteração"}
                  </Link>

                  {selected.status === "PUBLISHED" && (
                    <form
                      action={`/api/company/jobs/${selected.id}/close`}
                      method="POST"
                      className="space-y-2 rounded-md border border-red-100 bg-red-50 p-3"
                    >
                      <p className="text-[11px] font-bold text-red-800">Encerrar seleção</p>
                      <select
                        name="selectionResult"
                        className="w-full rounded-md border border-red-200 bg-white px-2 py-1.5 text-[11px] text-red-800"
                        defaultValue=""
                        required
                      >
                        <option value="" disabled>
                          Resultado
                        </option>
                        <option value="FILLED">Preenchida</option>
                        <option value="NOT_FILLED">Não preenchida</option>
                        <option value="CANCELLED">Cancelada</option>
                      </select>
                      <button className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-red-700 px-2 py-2 text-[11px] font-bold text-white">
                        <LockKeyhole className="h-3 w-3" /> Encerrar
                      </button>
                    </form>
                  )}
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="p-8 text-center text-sm text-[#78716c]">
                Selecione uma vaga na tabela.
              </SurfaceCard>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
