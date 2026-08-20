"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  MessageCircle,
  FileText,
  ChevronRight,
  CalendarDays,
  X,
  Download,
} from "lucide-react";
import { getMatchBandLabel } from "@/lib/matching/calculator";
import { FunnelCard, PageHeader, SurfaceCard } from "@/components/company/ui";

export type CandidateRow = {
  id: string;
  status: string;
  origin: string;
  matchScore: number;
  coverNote: string | null;
  createdAt: string;
  job: { id: string; title: string };
  candidate: {
    id: string;
    fullName: string;
    phone: string | null;
    whatsapp: string | null;
    city: string | null;
    educationLevel: string | null;
    professionalHeadline: string | null;
    email: string;
    skills: string[];
    summary: string | null;
  };
  history: Array<{ status: string; notes: string | null; createdAt: string }>;
  breakdown: {
    requiredMatched?: string[];
    requiredMissing?: string[];
    alerts?: string[];
    locationLabel?: string;
    parseLabel?: string;
  } | null;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  SUBMITTED: { label: "Novo", className: "bg-orange-50 text-orange-800" },
  UNDER_REVIEW: { label: "Em triagem", className: "bg-blue-50 text-blue-800" },
  CONTACT_SELECTED: { label: "Contato", className: "bg-purple-50 text-purple-800" },
  INTERVIEW_SCHEDULED: { label: "Entrevista", className: "bg-emerald-50 text-emerald-800" },
  APPROVED: { label: "Oferta", className: "bg-emerald-100 text-emerald-900" },
  NOT_SELECTED: { label: "Não selecionado", className: "bg-stone-100 text-stone-600" },
  WITHDRAWN: { label: "Desistência", className: "bg-red-50 text-red-700" },
};

const NEXT_STATUS: Record<string, string> = {
  SUBMITTED: "UNDER_REVIEW",
  UNDER_REVIEW: "CONTACT_SELECTED",
  CONTACT_SELECTED: "INTERVIEW_SCHEDULED",
  INTERVIEW_SCHEDULED: "APPROVED",
  APPROVED: "APPROVED",
  NOT_SELECTED: "UNDER_REVIEW",
  WITHDRAWN: "SUBMITTED",
};

function funnelKey(status: string): "novos" | "triagem" | "entrevistas" | "ofertas" | "outros" {
  if (status === "SUBMITTED") return "novos";
  if (status === "UNDER_REVIEW" || status === "CONTACT_SELECTED") return "triagem";
  if (status === "INTERVIEW_SCHEDULED") return "entrevistas";
  if (status === "APPROVED") return "ofertas";
  return "outros";
}

type Props = {
  rows: CandidateRow[];
  jobs: Array<{ id: string; title: string }>;
  initialVaga?: string;
  initialEtapa?: string;
  initialApp?: string;
};

export function CandidatesBoard({ rows, jobs, initialVaga, initialEtapa, initialApp }: Props) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [vaga, setVaga] = useState(initialVaga || "");
  const [etapa, setEtapa] = useState(initialEtapa || "todos");
  const [origem, setOrigem] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialApp || rows[0]?.id || null);
  const [tab, setTab] = useState<"resumo" | "curriculo" | "atividade">("resumo");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialApp) setSelectedId(initialApp);
  }, [initialApp]);

  const counts = useMemo(() => {
    const base = { todos: rows.length, novos: 0, triagem: 0, entrevistas: 0, ofertas: 0 };
    for (const r of rows) {
      const k = funnelKey(r.status);
      if (k !== "outros") base[k] += 1;
    }
    return base;
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (vaga && r.job.id !== vaga) return false;
      if (origem && r.origin !== origem) return false;
      if (etapa === "novos" && funnelKey(r.status) !== "novos") return false;
      if (etapa === "triagem" && funnelKey(r.status) !== "triagem") return false;
      if (etapa === "entrevistas" && funnelKey(r.status) !== "entrevistas") return false;
      if (etapa === "ofertas" && funnelKey(r.status) !== "ofertas") return false;
      if (q.trim()) {
        const hay = `${r.candidate.fullName} ${r.candidate.email} ${r.job.title}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, vaga, origem, etapa, q]);

  const selected = filtered.find((r) => r.id === selectedId) || filtered[0] || null;

  function updateQuery(next: { vaga?: string; etapa?: string; app?: string }) {
    const params = new URLSearchParams();
    const v = next.vaga !== undefined ? next.vaga : vaga;
    const e = next.etapa !== undefined ? next.etapa : etapa;
    const a = next.app !== undefined ? next.app : selectedId;
    if (v) params.set("vaga", v);
    if (e && e !== "todos") params.set("etapa", e);
    if (a) params.set("app", a);
    const qs = params.toString();
    router.replace(qs ? `/empresa/candidatos?${qs}` : "/empresa/candidatos");
  }

  const funnelChips = [
    { key: "todos", label: "Todos", count: counts.todos },
    { key: "novos", label: "Novos", count: counts.novos },
    { key: "triagem", label: "Em triagem", count: counts.triagem },
    { key: "entrevistas", label: "Entrevistas", count: counts.entrevistas },
    { key: "ofertas", label: "Ofertas", count: counts.ofertas },
  ] as const;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Candidatos"
        description="Gerencie inscrições, triagem ATS e etapas do processo seletivo."
        actions={
          <button
            type="button"
            disabled
            title="Em breve"
            className="inline-flex items-center gap-2 rounded-md border border-[#E6E8EB] bg-white px-3.5 py-2 text-xs font-bold text-[#78716c]"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {funnelChips.map((chip) => (
          <FunnelCard
            key={chip.key}
            label={chip.label}
            count={chip.count}
            active={etapa === chip.key}
            onClick={() => {
              setEtapa(chip.key);
              updateQuery({ etapa: chip.key });
            }}
          />
        ))}
      </div>

      <SurfaceCard className="space-y-3 p-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, e-mail ou cargo."
          className="w-full rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3.5 py-2.5 text-sm text-[#1C1410] outline-none placeholder:text-[#78716c] focus:border-[#E65100]"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={vaga}
            onChange={(e) => {
              setVaga(e.target.value);
              updateQuery({ vaga: e.target.value });
            }}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs text-[#1C1410]"
          >
            <option value="">Vaga</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs text-[#1C1410]"
          >
            <option value="">Origem</option>
            <option value="SELF">Portal</option>
            <option value="ASSISTED">Assistido</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            type="button"
            className="text-xs font-bold text-[#E65100] hover:underline"
            onClick={() => {
              setQ("");
              setVaga("");
              setOrigem("");
              setEtapa("todos");
              router.replace("/empresa/candidatos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#EEF2F0] bg-[#F4F5F7] text-[11px] uppercase tracking-wide text-[#78716c]">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-3 py-3 font-semibold">Candidato</th>
                  <th className="px-3 py-3 font-semibold">Vaga</th>
                  <th className="px-3 py-3 font-semibold">Etapa</th>
                  <th className="px-3 py-3 font-semibold">Avaliação</th>
                  <th className="px-3 py-3 font-semibold">Origem</th>
                  <th className="px-3 py-3 font-semibold">Última atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F0]">
                {filtered.map((r) => {
                  const meta = STATUS_META[r.status] || {
                    label: r.status,
                    className: "bg-stone-100 text-stone-700",
                  };
                  const band = getMatchBandLabel(r.matchScore);
                  const active = selected?.id === r.id;
                  const initials = r.candidate.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase();
                  return (
                    <tr
                      key={r.id}
                      onClick={() => {
                        setSelectedId(r.id);
                        setTab("resumo");
                        updateQuery({ app: r.id });
                      }}
                      className={`cursor-pointer ${active ? "bg-[#FFF4EA]" : "hover:bg-[#FBFCFC]"}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={!!checked[r.id]}
                          onChange={(e) =>
                            setChecked((prev) => ({ ...prev, [r.id]: e.target.checked }))
                          }
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1C1410] text-[10px] font-bold text-white">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[#1C1410]">{r.candidate.fullName}</p>
                            <p className="truncate text-[11px] text-[#78716c]">{r.candidate.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#57433C]">{r.job.title}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${meta.className}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`text-xs font-bold ${band.text}`}>{r.matchScore} / 100</span>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[#78716c]">
                        {r.origin === "ASSISTED" ? "Assistido" : r.origin === "ADMIN" ? "Admin" : "Site"}
                      </td>
                      <td className="px-3 py-3 text-[11px] text-[#78716c]">
                        {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#78716c]">
                      Nenhum candidato com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#EEF2F0] px-4 py-2.5 text-[11px] text-[#78716c]">
            {filtered.length} de {rows.length} candidatos
          </div>
        </SurfaceCard>

        {selected ? (
          <aside className="overflow-hidden rounded-md border border-[#E6E8EB] bg-white shadow-[0_1px_2px_rgba(28,20,16,0.04)] xl:sticky xl:top-[4.5rem] xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
            <div className="border-b border-[#EEF2F0] p-4">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1C1410] text-sm font-bold text-white">
                  {selected.candidate.fullName
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-[#1C1410]">{selected.candidate.fullName}</h2>
                      <p className="text-xs text-[#78716c]">
                        {selected.candidate.professionalHeadline || selected.job.title}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          (STATUS_META[selected.status] || STATUS_META.SUBMITTED).className
                        }`}
                      >
                        {(STATUS_META[selected.status] || STATUS_META.SUBMITTED).label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-[#78716c] hover:bg-[#F4F5F7] xl:hidden"
                      onClick={() => setSelectedId(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <form action={`/api/company/applications/${selected.id}/status`} method="POST" className="mt-4">
                <input type="hidden" name="status" value={NEXT_STATUS[selected.status] || "UNDER_REVIEW"} />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
                >
                  Avançar etapa
                  <ChevronRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTab("resumo");
                    document.getElementById("ea-interview-fields")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-[#E6E8EB] px-2 py-2 text-[11px] font-bold text-[#1C1410]"
                >
                  <CalendarDays className="h-3.5 w-3.5" />
                  Agendar entrevista
                </button>
                <a
                  href={
                    selected.candidate.whatsapp || selected.candidate.phone
                      ? `https://wa.me/55${(selected.candidate.whatsapp || selected.candidate.phone || "").replace(/\D/g, "")}`
                      : `mailto:${selected.candidate.email}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-md border border-[#E6E8EB] px-2 py-2 text-[11px] font-bold text-[#1C1410]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Enviar mensagem
                </a>
              </div>
            </div>

            <div className="flex border-b border-[#EEF2F0] text-xs font-bold">
              {(
                [
                  ["resumo", "Resumo"],
                  ["curriculo", "Currículo"],
                  ["atividade", "Atividade"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-1 px-2 py-2.5 ${
                    tab === key ? "border-b-2 border-[#E65100] text-[#E65100]" : "text-[#78716c]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-4 p-4 text-sm">
              {tab === "resumo" && (
                <>
                  <div className="space-y-2 text-xs">
                    <a
                      href={`mailto:${selected.candidate.email}`}
                      className="flex items-center gap-2 text-[#1C1410] hover:text-[#E65100]"
                    >
                      <Mail className="h-3.5 w-3.5 text-[#E65100]" />
                      {selected.candidate.email}
                    </a>
                    {selected.candidate.phone && (
                      <p className="flex items-center gap-2 text-[#1C1410]">
                        <Phone className="h-3.5 w-3.5 text-[#E65100]" />
                        {selected.candidate.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">Perfil</p>
                    <p className="mt-1 text-xs text-[#57433C]">
                      {selected.candidate.city || "Cidade não informada"}
                      {selected.candidate.educationLevel ? ` · ${selected.candidate.educationLevel}` : ""}
                    </p>
                    {selected.candidate.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {selected.candidate.skills.slice(0, 8).map((sk) => (
                          <span key={sk} className="rounded-full bg-[#F4F5F7] px-2 py-0.5 text-[11px] text-[#1C1410]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">Candidatura</p>
                    <p className="mt-1 text-xs text-[#57433C]">{selected.job.title}</p>
                    <p className="text-[11px] text-[#78716c]">
                      Inscrito em {new Date(selected.createdAt).toLocaleDateString("pt-BR")} · ATS{" "}
                      <strong>{selected.matchScore}</strong>
                    </p>
                    {selected.breakdown && (
                      <div className="mt-2 space-y-1 rounded-md bg-[#F4F5F7] p-3 text-[11px] text-[#57433C]">
                        {selected.breakdown.locationLabel && <p>{selected.breakdown.locationLabel}</p>}
                        {selected.breakdown.requiredMissing && selected.breakdown.requiredMissing.length > 0 && (
                          <p>Em aberto: {selected.breakdown.requiredMissing.slice(0, 5).join(", ")}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {selected.candidate.summary && (
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">Resumo</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#57433C]">{selected.candidate.summary}</p>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#78716c]">Timeline</p>
                    <ol className="space-y-2 border-l border-[#E6E8EB] pl-3">
                      <li className="text-[11px] text-[#57433C]">
                        Candidatura recebida · {new Date(selected.createdAt).toLocaleDateString("pt-BR")}
                      </li>
                      {selected.history.map((h, i) => (
                        <li key={i} className="text-[11px] text-[#57433C]">
                          {(STATUS_META[h.status] || { label: h.status }).label}
                          {h.notes ? ` — ${h.notes}` : ""} ·{" "}
                          {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">
                      Notas internas
                    </p>
                    <p className="mt-1 rounded-md bg-[#FFF4EA] p-3 text-xs text-[#57433C]">
                      {selected.coverNote || "Sem mensagem na candidatura."}
                    </p>
                    <p className="mt-1 text-[10px] text-[#78716c]">Não visível para o candidato (mensagem enviada no apply).</p>
                  </div>

                  <form
                    id="ea-interview-fields"
                    action={`/api/company/applications/${selected.id}/status`}
                    method="POST"
                    className="space-y-2 rounded-md border border-[#EEF2F0] p-3"
                  >
                    <p className="text-[11px] font-bold text-[#1C1410]">Alterar status / entrevista</p>
                    <select
                      name="status"
                      defaultValue={selected.status}
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    >
                      <option value="SUBMITTED">Novo</option>
                      <option value="UNDER_REVIEW">Em triagem</option>
                      <option value="CONTACT_SELECTED">Selecionado p/ contato</option>
                      <option value="INTERVIEW_SCHEDULED">Entrevista</option>
                      <option value="APPROVED">Aprovado / oferta</option>
                      <option value="NOT_SELECTED">Não selecionado</option>
                    </select>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    />
                    <select
                      name="modality"
                      defaultValue="PRESENCIAL"
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    >
                      <option value="PRESENCIAL">Presencial</option>
                      <option value="ONLINE">Online</option>
                      <option value="HIBRIDO">Híbrido</option>
                    </select>
                    <input
                      name="interviewer"
                      placeholder="Entrevistador"
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    />
                    <input
                      name="location"
                      placeholder="Local ou link"
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    />
                    <input
                      name="instructions"
                      placeholder="Orientações"
                      className="w-full rounded-md border border-[#E6E8EB] px-2 py-2 text-xs"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-md bg-[#1C1410] px-3 py-2 text-xs font-bold text-white"
                    >
                      Salvar status
                    </button>
                  </form>

                  <form action={`/api/company/applications/${selected.id}/status`} method="POST">
                    <input type="hidden" name="status" value="NOT_SELECTED" />
                    <button
                      type="submit"
                      className="w-full rounded-md border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                    >
                      Reprovar candidato
                    </button>
                  </form>
                </>
              )}

              {tab === "curriculo" && (
                <div className="space-y-3">
                  <Link
                    href={`/empresa/vagas/${selected.job.id}/candidaturas/${selected.id}/curriculo`}
                    target="_blank"
                    className="inline-flex items-center gap-2 rounded-md bg-[#1C1410] px-4 py-2.5 text-xs font-bold text-white"
                  >
                    <FileText className="h-4 w-4" />
                    Abrir currículo completo
                  </Link>
                  {selected.candidate.summary && (
                    <p className="text-xs leading-relaxed text-[#57433C]">{selected.candidate.summary}</p>
                  )}
                </div>
              )}

              {tab === "atividade" && (
                <ul className="space-y-3">
                  {selected.history.length === 0 && (
                    <li className="text-xs text-[#78716c]">Sem histórico adicional.</li>
                  )}
                  {selected.history.map((h, i) => (
                    <li key={i} className="rounded-md border border-[#EEF2F0] p-3 text-xs">
                      <p className="font-bold text-[#1C1410]">
                        {(STATUS_META[h.status] || { label: h.status }).label}
                      </p>
                      {h.notes && <p className="mt-1 text-[#57433C]">{h.notes}</p>}
                      <p className="mt-1 text-[11px] text-[#78716c]">
                        {new Date(h.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        ) : (
          <div className="hidden rounded-md border border-dashed border-[#E6E8EB] bg-white p-8 text-center text-sm text-[#78716c] xl:block">
            Selecione um candidato na lista.
          </div>
        )}
      </div>
    </div>
  );
}
