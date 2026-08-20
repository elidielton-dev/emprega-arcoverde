import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { FunnelCard, PageHeader, StatusPill, SurfaceCard } from "@/components/company/ui";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

export default async function EmpresaDashboardPage() {
  const { company } = await requireCompanyContext();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [jobs, appStats, interviewsToday, recentApps, weekApps] = await Promise.all([
    prisma.job.findMany({
      where: { companyId: company.id },
      include: {
        category: true,
        _count: { select: { applications: true } },
        applications: {
          select: { id: true, status: true, createdAt: true, matchScore: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.application.groupBy({
      by: ["status"],
      where: { job: { companyId: company.id } },
      _count: { _all: true },
    }),
    prisma.interview.findMany({
      where: {
        application: { job: { companyId: company.id } },
        scheduledAt: { gte: startOfDay, lte: endOfDay },
        status: "SCHEDULED",
      },
      include: {
        application: {
          include: {
            candidate: { select: { fullName: true } },
            job: { select: { title: true, id: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.application.findMany({
      where: { job: { companyId: company.id } },
      include: {
        candidate: { select: { fullName: true } },
        job: { select: { title: true, id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.application.count({
      where: { job: { companyId: company.id }, createdAt: { gte: weekAgo } },
    }),
  ]);

  const countBy = (statuses: string[]) =>
    appStats.filter((s) => statuses.includes(s.status)).reduce((a, s) => a + s._count._all, 0);

  const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED").length;
  const novos = countBy(["SUBMITTED"]);
  const triagem = countBy(["UNDER_REVIEW", "CONTACT_SELECTED"]);
  const entrevistas = countBy(["INTERVIEW_SCHEDULED"]);
  const ofertas = countBy(["APPROVED"]);
  const totalApps = appStats.reduce((a, s) => a + s._count._all, 0);

  const funnelSteps = [
    { label: "Novos", count: novos, href: "/empresa/candidatos?etapa=novos" },
    { label: "Triagem", count: triagem, href: "/empresa/candidatos?etapa=triagem" },
    { label: "Entrevistas", count: entrevistas, href: "/empresa/entrevistas" },
    { label: "Ofertas", count: ofertas, href: "/empresa/candidatos?etapa=ofertas" },
  ];
  const funnelMax = Math.max(...funnelSteps.map((s) => s.count), 1);

  const priorityActions = [
    novos > 0
      ? {
          title: `${novos} candidatura${novos === 1 ? "" : "s"} nova${novos === 1 ? "" : "s"}`,
          detail: "Aguardando primeira triagem",
          href: "/empresa/candidatos?etapa=novos",
          tone: "orange" as const,
        }
      : null,
    triagem > 0
      ? {
          title: `${triagem} em triagem`,
          detail: "Avance ou agende entrevista",
          href: "/empresa/candidatos?etapa=triagem",
          tone: "info" as const,
        }
      : null,
    interviewsToday.length > 0
      ? {
          title: `${interviewsToday.length} entrevista${interviewsToday.length === 1 ? "" : "s"} hoje`,
          detail: "Confira horários e local",
          href: "/empresa/entrevistas",
          tone: "success" as const,
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    detail: string;
    href: string;
    tone: "orange" | "info" | "success";
  }>;

  const hotJobs = [...jobs]
    .filter((j) => j.status === "PUBLISHED")
    .sort((a, b) => b._count.applications - a._count.applications)
    .slice(0, 4);

  const bottlenecks = jobs
    .map((j) => {
      const stuck = j.applications.filter((a) =>
        ["SUBMITTED", "UNDER_REVIEW", "CONTACT_SELECTED"].includes(a.status)
      ).length;
      return { id: j.id, title: j.title, stuck, total: j._count.applications };
    })
    .filter((j) => j.stuck >= 3)
    .sort((a, b) => b.stuck - a.stuck)
    .slice(0, 4);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Visão geral"
        description={`Acompanhe o funil e as prioridades de ${company.tradeName || company.name}.`}
        actions={
          <span className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-[#78716c] ring-1 ring-[#E6E8EB]">
            +{weekApps} na última semana
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <Link href="/empresa/vagas">
          <FunnelCard label="Vagas ativas" count={publishedJobs} icon={<Briefcase className="h-4 w-4" />} />
        </Link>
        <Link href="/empresa/candidatos?etapa=novos">
          <FunnelCard label="Novos" count={novos} icon={<Users className="h-4 w-4" />} />
        </Link>
        <Link href="/empresa/candidatos?etapa=triagem">
          <FunnelCard label="Em triagem" count={triagem} />
        </Link>
        <Link href="/empresa/entrevistas">
          <FunnelCard label="Entrevistas" count={entrevistas} icon={<CalendarDays className="h-4 w-4" />} />
        </Link>
        <Link href="/empresa/candidatos?etapa=ofertas">
          <FunnelCard label="Ofertas" count={ofertas} icon={<CheckCircle2 className="h-4 w-4" />} />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <SurfaceCard className="p-5 xl:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1410]">Funil de seleção</h3>
            <span className="text-[11px] text-[#78716c]">{totalApps} candidaturas</span>
          </div>
          <div className="space-y-3">
            {funnelSteps.map((step) => (
              <Link key={step.label} href={step.href} className="block group">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#57433C] group-hover:text-[#E65100]">{step.label}</span>
                  <span className="font-black text-[#1C1410]">{step.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-sm bg-[#F4F5F7]">
                  <div
                    className="h-full rounded-sm bg-[#E65100] transition-all"
                    style={{ width: `${Math.max(4, (step.count / funnelMax) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5 xl:col-span-4">
          <h3 className="mb-4 text-sm font-bold text-[#1C1410]">Ações prioritárias</h3>
          {priorityActions.length === 0 ? (
            <p className="text-sm text-[#78716c]">Nada urgente no momento. Bom ritmo de seleção.</p>
          ) : (
            <ul className="space-y-2">
              {priorityActions.map((a) => (
                <li key={a.href + a.title}>
                  <Link
                    href={a.href}
                    className="flex items-start justify-between gap-2 rounded-md border border-[#EEF2F0] px-3 py-2.5 hover:border-[#E65100]/35"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1C1410]">{a.title}</p>
                      <p className="text-[11px] text-[#78716c]">{a.detail}</p>
                    </div>
                    <StatusPill label="Abrir" tone={a.tone === "orange" ? "orange" : a.tone === "info" ? "info" : "success"} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1410]">Agenda de hoje</h3>
            <Link href="/empresa/entrevistas" className="text-[#E65100]">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {interviewsToday.length === 0 ? (
            <p className="text-sm text-[#78716c]">Sem entrevistas hoje.</p>
          ) : (
            <ul className="space-y-2">
              {interviewsToday.map((i) => (
                <li key={i.id} className="rounded-md bg-[#F4F5F7] px-3 py-2">
                  <p className="text-xs font-bold text-[#E65100]">
                    {i.scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-sm font-semibold text-[#1C1410]">{i.application.candidate.fullName}</p>
                  <p className="truncate text-[11px] text-[#78716c]">{i.application.job.title}</p>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1C1410]">Vagas em alta</h3>
            <Link href="/empresa/vagas" className="text-xs font-bold text-[#E65100] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="space-y-2">
            {hotJobs.map((job) => (
              <Link
                key={job.id}
                href={`/empresa/candidatos?vaga=${job.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-[#EEF2F0] px-3 py-2.5 hover:border-[#E65100]/35"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1C1410]">{job.title}</p>
                  <p className="text-[11px] text-[#78716c]">{job.category.name}</p>
                </div>
                <span className="shrink-0 text-sm font-black text-[#E65100]">{job._count.applications}</span>
              </Link>
            ))}
            {hotJobs.length === 0 && <p className="text-sm text-[#78716c]">Nenhuma vaga publicada.</p>}
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-bold text-[#1C1410]">Gargalos</h3>
          </div>
          {bottlenecks.length === 0 ? (
            <p className="text-sm text-[#78716c]">Sem concentrações altas em triagem.</p>
          ) : (
            <ul className="space-y-2">
              {bottlenecks.map((b) => (
                <li key={b.id}>
                  <Link
                    href={`/empresa/candidatos?vaga=${b.id}&etapa=triagem`}
                    className="flex items-center justify-between rounded-md border border-amber-100 bg-amber-50/60 px-3 py-2.5 hover:border-amber-200"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1C1410]">{b.title}</p>
                      <p className="text-[11px] text-[#78716c]">
                        {b.stuck} pendentes de {b.total}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-amber-700" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SurfaceCard>
      </div>

      <SurfaceCard className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1C1410]">Atividade recente</h3>
          <Link href="/empresa/candidatos" className="text-xs font-bold text-[#E65100] hover:underline">
            Ver candidatos
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <p className="text-sm text-[#78716c]">Nenhuma candidatura recente.</p>
        ) : (
          <ul className="divide-y divide-[#EEF2F0]">
            {recentApps.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1C1410]">{item.candidate.fullName}</p>
                  <p className="truncate text-xs text-[#78716c]">{item.job.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-[11px] text-[#78716c]">
                  <Clock className="h-3 w-3" />
                  {item.createdAt.toLocaleDateString("pt-BR")}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 rounded-md bg-[#FFF4EA] px-3 py-2 text-[11px] leading-relaxed text-[#57433C]">
          Novas vagas são cadastradas pela ACA/Prefeitura. A empresa acompanha triagem e entrevistas.
        </p>
      </SurfaceCard>
    </div>
  );
}
