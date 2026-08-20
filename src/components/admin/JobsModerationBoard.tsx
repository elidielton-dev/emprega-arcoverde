"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  Pause,
  Play,
  Plus,
  Trash2,
  X,
  ShieldAlert,
} from "lucide-react";
import {
  FunnelCard,
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type ModerationJobRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  categoryName: string;
  companyName: string;
  companyCnpj: string | null;
  city: string;
  contractType: string;
  workplaceType: string;
  vacanciesCount: number;
  applicationsCount: number;
  isConfidential: boolean;
  summary: string;
  requirements: string | null;
  salaryLabel: string;
  createdAt: string;
  changeRequests: { id: string; status: string; message: string; createdAt: string }[];
};

const STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "success" | "warn" | "danger" | "info" | "orange" }
> = {
  DRAFT: { label: "Rascunho", tone: "neutral" },
  PENDING_REVIEW: { label: "Pendente", tone: "orange" },
  PUBLISHED: { label: "Publicada", tone: "success" },
  PAUSED: { label: "Pausada", tone: "neutral" },
  CLOSED: { label: "Encerrada", tone: "danger" },
  REJECTED: { label: "Rejeitada", tone: "danger" },
};

const TABS: { key: string; label: string; match: (s: string) => boolean }[] = [
  { key: "PENDING_REVIEW", label: "Pendentes", match: (s) => s === "PENDING_REVIEW" || s === "DRAFT" },
  { key: "PUBLISHED", label: "Publicadas", match: (s) => s === "PUBLISHED" },
  { key: "PAUSED", label: "Pausadas", match: (s) => s === "PAUSED" },
  { key: "REJECTED", label: "Rejeitadas", match: (s) => s === "REJECTED" },
  { key: "ALL", label: "Todas", match: () => true },
];

type Props = { jobs: ModerationJobRow[]; success?: boolean };

export function JobsModerationBoard({ jobs, success }: Props) {
  const [tab, setTab] = useState("PENDING_REVIEW");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    jobs.find((j) => j.status === "PENDING_REVIEW" || j.status === "DRAFT")?.id || jobs[0]?.id || null,
  );

  const counts = useMemo(() => {
    return {
      pending: jobs.filter((j) => j.status === "PENDING_REVIEW" || j.status === "DRAFT").length,
      published: jobs.filter((j) => j.status === "PUBLISHED").length,
      paused: jobs.filter((j) => j.status === "PAUSED").length,
      rejected: jobs.filter((j) => j.status === "REJECTED").length,
      total: jobs.length,
    };
  }, [jobs]);

  const tabDef = TABS.find((t) => t.key === tab) || TABS[0];

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      if (!tabDef.match(j.status)) return false;
      if (!q.trim()) return true;
      const n = q.toLowerCase();
      return (
        j.title.toLowerCase().includes(n) ||
        j.companyName.toLowerCase().includes(n) ||
        j.categoryName.toLowerCase().includes(n)
      );
    });
  }, [jobs, tabDef, q]);

  const selected = filtered.find((j) => j.id === selectedId) || filtered[0] || null;
  const meta = selected ? STATUS_META[selected.status] || STATUS_META.DRAFT : null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Moderação de vagas"
        description="Revise, aprove e publique oportunidades cadastradas pela instituição."
        actions={
          <PrimaryButton href="/admin/vagas/nova">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar vaga
          </PrimaryButton>
        }
      />

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          Ação de moderação registrada e auditada.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FunnelCard
          label="Pendentes"
          count={counts.pending}
          active={tab === "PENDING_REVIEW"}
          onClick={() => setTab("PENDING_REVIEW")}
          icon={<Briefcase className="h-4 w-4" />}
        />
        <FunnelCard
          label="Publicadas"
          count={counts.published}
          active={tab === "PUBLISHED"}
          onClick={() => setTab("PUBLISHED")}
        />
        <FunnelCard
          label="Pausadas"
          count={counts.paused}
          active={tab === "PAUSED"}
          onClick={() => setTab("PAUSED")}
        />
        <FunnelCard
          label="Total"
          count={counts.total}
          active={tab === "ALL"}
          onClick={() => setTab("ALL")}
        />
      </div>

      <SurfaceCard className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por cargo ou empresa..."
          className="flex-1 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs text-[#1C1410] outline-none focus:border-[#E65100]"
        />
        <div className="flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
                tab === t.key ? "bg-[#1C1410] text-white" : "bg-[#F4F5F7] text-[#57433C] hover:bg-[#E6E8EB]"
              }`}
            >
              {t.label}
              {t.key === "PENDING_REVIEW" ? ` (${counts.pending})` : ""}
            </button>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-[11px] uppercase tracking-wide text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cargo / Vaga</th>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Enviado</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#78716c]">
                      Nenhuma vaga neste filtro.
                    </td>
                  </tr>
                ) : (
                  filtered.map((job) => {
                    const active = selected?.id === job.id;
                    const m = STATUS_META[job.status] || STATUS_META.DRAFT;
                    return (
                      <tr
                        key={job.id}
                        onClick={() => {
                          setSelectedId(job.id);
                          setNotes("");
                        }}
                        className={`cursor-pointer transition ${
                          active
                            ? "bg-[#FFF4EA] shadow-[inset_3px_0_0_0_#E65100]"
                            : "hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1C1410]">{job.title}</p>
                          <p className="text-[11px] text-[#78716c]">{job.categoryName}</p>
                        </td>
                        <td className="px-4 py-3 text-[#57433C]">{job.companyName}</td>
                        <td className="px-4 py-3 text-[#78716c]">
                          {new Date(job.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill label={m.label} tone={m.tone} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        <aside>
          {selected && meta ? (
            <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
              <div className="border-b border-[#E6E8EB] px-4 py-3">
                <h3 className="text-sm font-bold text-[#1C1410]">Revisar vaga</h3>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-base font-black text-[#1C1410]">{selected.title}</p>
                  <p className="text-xs text-[#78716c]">
                    {selected.companyName}
                    {selected.companyCnpj ? ` · ${selected.companyCnpj}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <StatusPill label={meta.label} tone={meta.tone} />
                    {selected.isConfidential && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#57433C]">
                        <ShieldAlert className="h-3 w-3 text-[#E65100]" /> Confidencial
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-[#57433C]">{selected.summary}</p>
                <dl className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-[#78716c]">Vagas</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.vacanciesCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716c]">Inscrições</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.applicationsCount}</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716c]">Contrato</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.contractType}</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716c]">Salário</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.salaryLabel}</dd>
                  </div>
                </dl>

                {selected.changeRequests.length > 0 && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-950">
                    <p className="font-bold">Solicitações da empresa</p>
                    {selected.changeRequests.slice(0, 2).map((r) => (
                      <p key={r.id} className="mt-1 whitespace-pre-wrap">
                        {r.message}
                      </p>
                    ))}
                  </div>
                )}

                <label className="block text-[11px] font-semibold text-[#57433C]">
                  Justificativa do parecer
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Obrigatório para rejeição"
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-xs outline-none focus:border-[#E65100]"
                  />
                  <span className="mt-0.5 block text-right text-[#78716c]">{notes.length}/500</span>
                </label>

                <div className="space-y-2">
                  {(selected.status === "DRAFT" || selected.status === "PENDING_REVIEW") && (
                    <>
                      <form action={`/api/admin/jobs/${selected.id}/review`} method="POST">
                        <input type="hidden" name="action" value="APPROVE" />
                        <input type="hidden" name="notes" value={notes} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Aprovar e publicar
                        </button>
                      </form>
                      <form action={`/api/admin/jobs/${selected.id}/review`} method="POST">
                        <input type="hidden" name="action" value="REJECT" />
                        <input type="hidden" name="notes" value={notes} />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          Rejeitar
                        </button>
                      </form>
                    </>
                  )}
                  {selected.status === "PUBLISHED" && (
                    <>
                      <form action={`/api/admin/jobs/${selected.id}/review`} method="POST">
                        <input type="hidden" name="action" value="PAUSE" />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                        >
                          <Pause className="h-3.5 w-3.5" />
                          Pausar
                        </button>
                      </form>
                      <form action={`/api/admin/jobs/${selected.id}/review`} method="POST">
                        <input type="hidden" name="action" value="CLOSE" />
                        <button
                          type="submit"
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-700"
                        >
                          Encerrar
                        </button>
                      </form>
                    </>
                  )}
                  {(selected.status === "CLOSED" ||
                    selected.status === "PAUSED" ||
                    selected.status === "REJECTED") && (
                    <form action={`/api/admin/jobs/${selected.id}/review`} method="POST">
                      <input type="hidden" name="action" value="REOPEN" />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <Play className="h-3.5 w-3.5" />
                        Reabrir e publicar
                      </button>
                    </form>
                  )}
                  <Link
                    href={`/vagas/${selected.slug}`}
                    target="_blank"
                    className="block text-center text-xs font-bold text-[#E65100] hover:underline"
                  >
                    Ver página pública ↗
                  </Link>
                  <form action={`/api/admin/jobs/${selected.id}/delete`} method="POST" className="pt-1">
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1.5 rounded-md border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir vaga
                    </button>
                  </form>
                </div>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-8 text-center text-xs text-[#78716c]">
              Selecione uma vaga para revisar.
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
