"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Library, MapPin, X } from "lucide-react";
import { FunnelCard, PageHeader, StatusPill, SurfaceCard } from "@/components/company/ui";

export type TalentRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  headline: string | null;
  applications: number;
  lastJob: string;
  lastJobId: string;
  lastAt: string;
  bestScore: number;
  lastStatus: string;
  skills: string[];
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: "Novo",
  UNDER_REVIEW: "Triagem",
  CONTACT_SELECTED: "Contato",
  INTERVIEW_SCHEDULED: "Entrevista",
  APPROVED: "Aprovado",
  NOT_SELECTED: "Não selecionado",
  WITHDRAWN: "Desistência",
};

type Props = { talents: TalentRow[] };

export function TalentPoolBoard({ talents }: Props) {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [minScore, setMinScore] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(talents[0]?.id || null);

  const cities = useMemo(
    () =>
      Array.from(new Set(talents.map((t) => t.city).filter(Boolean) as string[])).sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [talents]
  );

  const segments = useMemo(() => {
    const high = talents.filter((t) => t.bestScore >= 70).length;
    const multi = talents.filter((t) => t.applications >= 2).length;
    const recent = talents.filter(
      (t) => Date.now() - +new Date(t.lastAt) < 30 * 24 * 60 * 60 * 1000
    ).length;
    return { total: talents.length, high, multi, recent };
  }, [talents]);

  const filtered = useMemo(() => {
    return talents.filter((t) => {
      if (city && t.city !== city) return false;
      if (minScore && t.bestScore < Number(minScore)) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        t.fullName.toLowerCase().includes(needle) ||
        t.email.toLowerCase().includes(needle) ||
        t.lastJob.toLowerCase().includes(needle) ||
        (t.headline || "").toLowerCase().includes(needle) ||
        t.skills.some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [talents, q, city, minScore]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Banco de talentos"
        description="Pessoas que já se candidataram às vagas da sua empresa — repositório interno para recontato."
      />

      <div className="rounded-md border border-[#E65100]/25 bg-[#FFF4EA] px-4 py-3 text-xs leading-relaxed text-[#57433C]">
        O banco é montado automaticamente a partir das candidaturas. Não há cadastro manual de
        candidatos pela empresa — use o funil em{" "}
        <Link href="/empresa/candidatos" className="font-bold text-[#E65100] hover:underline">
          Candidatos
        </Link>{" "}
        para avançar etapas.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Talentos" count={segments.total} icon={<Library className="h-4 w-4" />} />
        <FunnelCard label="ATS ≥ 70" count={segments.high} />
        <FunnelCard label="Multicandidatura" count={segments.multi} />
        <FunnelCard label="Ativos (30 dias)" count={segments.recent} />
      </div>

      <SurfaceCard className="p-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome, e-mail, vaga ou skill…"
            className="rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3.5 py-2.5 text-sm outline-none focus:border-[#E65100] sm:col-span-1"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="">Todas as cidades</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="">Qualquer ATS</option>
            <option value="50">ATS ≥ 50</option>
            <option value="70">ATS ≥ 70</option>
            <option value="85">ATS ≥ 85</option>
          </select>
        </div>
      </SurfaceCard>

      {talents.length === 0 ? (
        <SurfaceCard className="p-12 text-center">
          <Library className="mx-auto h-10 w-10 text-[#E65100]" />
          <h3 className="mt-3 text-base font-bold text-[#1C1410]">Banco ainda vazio</h3>
          <p className="mt-1 text-xs text-[#78716c]">
            Quando houver candidaturas, os perfis aparecem aqui automaticamente.
          </p>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <SurfaceCard className="overflow-hidden">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#EEF2F0] bg-[#F4F5F7] text-[11px] uppercase tracking-wide text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Candidato</th>
                  <th className="px-4 py-3 font-semibold">Cidade</th>
                  <th className="px-4 py-3 font-semibold">Candidaturas</th>
                  <th className="px-4 py-3 font-semibold">Melhor ATS</th>
                  <th className="px-4 py-3 font-semibold">Última vaga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF2F0]">
                {filtered.map((t) => {
                  const active = selected?.id === t.id;
                  return (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`cursor-pointer ${active ? "bg-[#FFF4EA]" : "hover:bg-[#FBFCFC]"}`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1C1410]">{t.fullName}</p>
                        <p className="text-[11px] text-[#78716c]">{t.headline || t.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#57433C]">{t.city || "—"}</td>
                      <td className="px-4 py-3 text-[#1C1410]">{t.applications}</td>
                      <td className="px-4 py-3 font-bold text-[#E65100]">{t.bestScore}</td>
                      <td className="px-4 py-3 text-xs text-[#57433C]">
                        {t.lastJob}
                        <span className="block text-[11px] text-[#78716c]">
                          {new Date(t.lastAt).toLocaleDateString("pt-BR")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#78716c]">
                      Nenhum talento com esses filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </SurfaceCard>

          <aside>
            {selected ? (
              <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
                <div className="flex items-start justify-between border-b border-[#EEF2F0] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#78716c]">
                      Detalhe
                    </p>
                    <h3 className="text-sm font-bold text-[#1C1410]">{selected.fullName}</h3>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-[#78716c] hover:bg-[#F4F5F7] xl:hidden"
                    onClick={() => setSelectedId(null)}
                    aria-label="Fechar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3 p-4">
                  {selected.headline && (
                    <p className="text-xs text-[#57433C]">{selected.headline}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={STATUS_LABEL[selected.lastStatus] || selected.lastStatus}
                      tone="orange"
                    />
                    <StatusPill label={`ATS ${selected.bestScore}`} tone="neutral" />
                  </div>
                  <p className="flex items-center gap-1 text-xs text-[#78716c]">
                    <MapPin className="h-3.5 w-3.5 text-[#E65100]" />
                    {selected.city || "Cidade não informada"}
                  </p>
                  <p className="text-xs text-[#57433C]">{selected.email}</p>
                  {selected.phone && <p className="text-xs text-[#57433C]">{selected.phone}</p>}
                  <div>
                    <p className="text-[11px] font-bold text-[#78716c]">Última vaga</p>
                    <p className="text-sm font-semibold text-[#1C1410]">{selected.lastJob}</p>
                  </div>
                  {selected.skills.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold text-[#78716c]">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {selected.skills.slice(0, 12).map((s) => (
                          <span
                            key={s}
                            className="rounded bg-[#F4F5F7] px-2 py-0.5 text-[11px] text-[#57433C]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <Link
                    href={`/empresa/candidatos?vaga=${selected.lastJobId}`}
                    className="flex w-full items-center justify-center rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
                  >
                    Ver no funil
                  </Link>
                </div>
              </SurfaceCard>
            ) : (
              <SurfaceCard className="hidden p-8 text-center text-sm text-[#78716c] xl:block">
                Selecione um talento na tabela.
              </SurfaceCard>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
