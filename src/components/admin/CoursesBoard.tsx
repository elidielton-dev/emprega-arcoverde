"use client";

import React, { useMemo, useState } from "react";
import { ExternalLink, GraduationCap, Plus } from "lucide-react";
import {
  FunnelCard,
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type CourseRow = {
  id: string;
  title: string;
  description: string;
  providerName: string;
  modality: string;
  status: string;
  clicksCount: number;
  vacancies: number | null;
  externalUrl: string;
  enrollmentStart: string | null;
  enrollmentEnd: string | null;
};

type Props = { courses: CourseRow[] };

export function CoursesBoard({ courses }: Props) {
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(courses[0]?.id || null);

  const counts = useMemo(
    () => ({
      active: courses.filter((c) => c.status === "ACTIVE").length,
      expired: courses.filter((c) => c.status !== "ACTIVE").length,
      clicks: courses.reduce((acc, c) => acc + c.clicksCount, 0),
      total: courses.length,
    }),
    [courses],
  );

  const filtered = useMemo(() => {
    if (!q.trim()) return courses;
    const n = q.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(n) ||
        c.providerName.toLowerCase().includes(n) ||
        c.description.toLowerCase().includes(n),
    );
  }, [courses, q]);

  const selected = filtered.find((c) => c.id === selectedId) || filtered[0] || null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cursos e qualificações"
        description="Cadastre e monitore cursos oferecidos por parceiros oficiais."
        actions={
          <PrimaryButton href="/admin/cursos/nova">
            <Plus className="h-3.5 w-3.5" />
            Novo curso
          </PrimaryButton>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Cursos ativos" count={counts.active} icon={<GraduationCap className="h-4 w-4" />} />
        <FunnelCard label="No catálogo" count={counts.total} hint="Ativos + encerrados" />
        <FunnelCard label="Encerrados" count={counts.expired} />
        <FunnelCard label="Cliques de interesse" count={counts.clicks} />
      </div>

      <SurfaceCard className="p-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar curso ou instituição"
          className="w-full rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs outline-none focus:border-[#E65100]"
        />
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <SurfaceCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-[11px] uppercase text-[#78716c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Curso</th>
                  <th className="px-4 py-3 font-semibold">Instituição</th>
                  <th className="px-4 py-3 font-semibold">Modalidade</th>
                  <th className="px-4 py-3 font-semibold">Inscrições</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E8EB]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[#78716c]">
                      Nenhum curso encontrado.
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
                        <td className="px-4 py-3 font-semibold text-[#1C1410]">{c.title}</td>
                        <td className="px-4 py-3 text-[#57433C]">{c.providerName}</td>
                        <td className="px-4 py-3 text-[#78716c]">{c.modality}</td>
                        <td className="px-4 py-3">
                          <StatusPill
                            label={c.status === "ACTIVE" ? "Inscrições abertas" : "Encerrado"}
                            tone={c.status === "ACTIVE" ? "success" : "neutral"}
                          />
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
          {selected ? (
            <SurfaceCard className="overflow-hidden xl:sticky xl:top-[4.5rem]">
              <div className="border-b border-[#E6E8EB] px-4 py-3">
                <h3 className="text-sm font-bold text-[#1C1410]">Detalhes do curso</h3>
              </div>
              <div className="space-y-3 p-4">
                <p className="text-base font-black text-[#1C1410]">{selected.title}</p>
                <StatusPill
                  label={selected.status === "ACTIVE" ? "Inscrições abertas" : "Encerrado"}
                  tone={selected.status === "ACTIVE" ? "success" : "neutral"}
                />
                <p className="text-xs text-[#57433C]">{selected.providerName}</p>
                <p className="text-xs leading-relaxed text-[#78716c]">{selected.description}</p>
                <dl className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <dt className="text-[#78716c]">Vagas</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.vacancies ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[#78716c]">Cliques</dt>
                    <dd className="font-bold text-[#1C1410]">{selected.clicksCount}</dd>
                  </div>
                </dl>
                <a
                  href={selected.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver página pública
                </a>
                <form action={`/api/admin/courses/${selected.id}`} method="POST">
                  <input type="hidden" name="_method" value="DELETE" />
                  <button type="submit" className="w-full text-xs font-bold text-red-700 hover:underline">
                    Excluir curso
                  </button>
                </form>
              </div>
            </SurfaceCard>
          ) : (
            <SurfaceCard className="p-8 text-center text-xs text-[#78716c]">
              Selecione um curso.
            </SurfaceCard>
          )}
        </aside>
      </div>
    </div>
  );
}
