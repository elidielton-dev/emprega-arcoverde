import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { FunnelCard, PageHeader, SurfaceCard } from "@/components/company/ui";

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#57433C]">{label}</span>
        <span className="font-black text-[#1C1410]">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-[#F4F5F7]">
        <div className="h-full rounded-sm bg-[#E65100]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default async function EmpresaRelatoriosPage() {
  const { company } = await requireCompanyContext();

  const [byStatus, byJob, byOrigin, apps, interviews] = await Promise.all([
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId: company.id } },
      _count: { _all: true },
      _avg: { matchScore: true },
    }),
    prisma.application.groupBy({
      by: ["jobId"],
      where: { job: { companyId: company.id } },
      _count: { _all: true },
      _avg: { matchScore: true },
    }),
    prisma.application.groupBy({
      by: ["origin"],
      where: { job: { companyId: company.id } },
      _count: { _all: true },
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      select: { matchScore: true, createdAt: true, updatedAt: true, status: true },
    }),
    prisma.interview.findMany({
      where: { application: { job: { companyId: company.id } } },
      select: { status: true, scheduledAt: true, createdAt: true },
    }),
  ]);

  const jobs = await prisma.job.findMany({
    where: { id: { in: byJob.map((j) => j.jobId) } },
    select: { id: true, title: true, status: true },
  });
  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j]));

  const total = apps.length;
  const avgAts = total ? Math.round(apps.reduce((a, x) => a + x.matchScore, 0) / total) : 0;
  const approved = apps.filter((a) => a.status === "APPROVED").length;
  const conversion = total ? Math.round((approved / total) * 100) : 0;

  const statusOrder = [
    "SUBMITTED",
    "UNDER_REVIEW",
    "CONTACT_SELECTED",
    "INTERVIEW_SCHEDULED",
    "APPROVED",
    "NOT_SELECTED",
    "WITHDRAWN",
  ];
  const statusLabel: Record<string, string> = {
    SUBMITTED: "Novos",
    UNDER_REVIEW: "Em triagem",
    CONTACT_SELECTED: "Contato",
    INTERVIEW_SCHEDULED: "Entrevistas",
    APPROVED: "Aprovados",
    NOT_SELECTED: "Não selecionados",
    WITHDRAWN: "Desistências",
  };
  const statusCounts = statusOrder.map((s) => ({
    key: s,
    label: statusLabel[s],
    value: byStatus.find((x) => x.status === s)?._count._all || 0,
  }));
  const funnelMax = Math.max(...statusCounts.map((s) => s.value), 1);

  const originLabel: Record<string, string> = {
    SELF: "Candidatura espontânea",
    ASSISTED: "Atendimento assistido",
    ADMIN: "Operador / admin",
  };
  const originRows = byOrigin.map((o) => ({
    label: originLabel[o.origin] || o.origin,
    value: o._count._all,
  }));
  const originMax = Math.max(...originRows.map((o) => o.value), 1);

  // Tempo médio (dias) entre criação e última atualização em etapas avançadas
  const advanced = apps.filter((a) =>
    ["INTERVIEW_SCHEDULED", "APPROVED", "NOT_SELECTED"].includes(a.status)
  );
  const avgDays =
    advanced.length > 0
      ? Math.round(
          advanced.reduce((acc, a) => {
            const days = (+a.updatedAt - +a.createdAt) / (1000 * 60 * 60 * 24);
            return acc + days;
          }, 0) / advanced.length
        )
      : 0;

  const topJobs = [...byJob]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Relatórios"
        description="Indicadores do funil, origem das candidaturas e desempenho por vaga."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Candidaturas" count={total} />
        <FunnelCard label="Score ATS médio" count={avgAts} />
        <FunnelCard label="Taxa de aprovação" count={`${conversion}%`} hint={`${approved} aprovados`} />
        <FunnelCard label="Tempo médio (dias)" count={avgDays} hint="Até decisão / entrevista" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard className="p-5">
          <h3 className="mb-4 text-sm font-bold text-[#1C1410]">Funil por etapa</h3>
          <div className="space-y-3">
            {statusCounts.map((s) => (
              <BarRow key={s.key} label={s.label} value={s.value} max={funnelMax} />
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <h3 className="mb-4 text-sm font-bold text-[#1C1410]">Origem das candidaturas</h3>
          {originRows.length === 0 ? (
            <p className="text-sm text-[#78716c]">Sem dados.</p>
          ) : (
            <div className="space-y-3">
              {originRows.map((o) => (
                <BarRow key={o.label} label={o.label} value={o.value} max={originMax} />
              ))}
            </div>
          )}
          <div className="mt-5 rounded-md bg-[#F4F5F7] px-3 py-2.5 text-[11px] text-[#57433C]">
            Entrevistas registradas: <strong>{interviews.length}</strong>
            {" · "}
            Agendadas:{" "}
            <strong>{interviews.filter((i) => i.status === "SCHEDULED").length}</strong>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#EEF2F0] px-5 py-4">
          <h3 className="text-sm font-bold text-[#1C1410]">Top vagas por volume</h3>
          <Link href="/empresa/vagas" className="text-xs font-bold text-[#E65100]">
            Ver vagas
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F4F5F7] text-[11px] uppercase tracking-wide text-[#78716c]">
              <tr>
                <th className="px-5 py-3 font-semibold">Vaga</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Candidaturas</th>
                <th className="px-5 py-3 font-semibold">ATS médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEF2F0]">
              {topJobs.map((row) => {
                const job = jobMap[row.jobId];
                return (
                  <tr key={row.jobId} className="hover:bg-[#FBFCFC]">
                    <td className="px-5 py-3 font-semibold text-[#1C1410]">
                      <Link
                        href={`/empresa/candidatos?vaga=${row.jobId}`}
                        className="hover:text-[#E65100]"
                      >
                        {job?.title || row.jobId}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-xs text-[#78716c]">{job?.status || "—"}</td>
                    <td className="px-5 py-3 font-bold text-[#1C1410]">{row._count._all}</td>
                    <td className="px-5 py-3 font-bold text-[#E65100]">
                      {Math.round(row._avg.matchScore || 0)}
                    </td>
                  </tr>
                );
              })}
              {topJobs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-[#78716c]">
                    Sem candidaturas ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
