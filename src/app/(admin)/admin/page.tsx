import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import {
  canManageCourses,
  canManageUsers,
  canPerformAssistedService,
  canViewIndicators,
  isAdmin,
  isMunicipalOrSuperAdmin,
} from "@/lib/auth/rbac";
import { requireAdminContext } from "@/lib/admin/context";
import {
  FunnelCard,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  Building2,
  GraduationCap,
  Headset,
  Shield,
  Users,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const { session } = await requireAdminContext();
  const municipal = isMunicipalOrSuperAdmin(session.role);
  const admin = isAdmin(session.role);
  const sala = session.role === "ASSISTED_OPERATOR";

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const [
    pendingJobsCount,
    activeCompanies,
    pendingCompanies,
    totalCandidates,
    assistedCandidatesCount,
    newCandidatesMonth,
    pendingValidation,
    assistedThisWeek,
    activeCoursesCount,
    publishedJobs,
    appsSubmitted,
    appsReview,
    appsInterview,
    appsApproved,
    pendingDeletions,
    pendingJobs,
    recentCompanies,
  ] = await Promise.all([
    prisma.job.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.company.count({ where: { status: "ACTIVE" } }),
    prisma.company.count({ where: { status: "PENDING" } }),
    prisma.candidateProfile.count(),
    prisma.candidateProfile.count({ where: { isAssisted: true } }),
    prisma.candidateProfile.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.candidateProfile.count({ where: { validationStatus: "PENDING" } }),
    prisma.candidateProfile.count({
      where: { isAssisted: true, createdAt: { gte: weekStart } },
    }),
    prisma.course.count({ where: { status: "ACTIVE" } }),
    prisma.job.count({ where: { status: "PUBLISHED" } }),
    prisma.application.count({ where: { status: "SUBMITTED" } }),
    prisma.application.count({ where: { status: "UNDER_REVIEW" } }),
    prisma.application.count({
      where: { status: { in: ["CONTACT_SELECTED", "INTERVIEW_SCHEDULED"] } },
    }),
    prisma.application.count({ where: { status: "APPROVED" } }),
    prisma.deletionRequest.count({ where: { status: "PENDING" } }),
    prisma.job.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { company: true },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        tradeName: true,
        status: true,
        createdByInstitution: true,
        createdAt: true,
      },
    }),
  ]);

  const funnelTotal = appsSubmitted + appsReview + appsInterview + appsApproved || 1;
  const advanceRate = Math.round(((appsInterview + appsApproved) / funnelTotal) * 1000) / 10;

  return (
    <div className="space-y-5">
      <PageHeader
        title={municipal ? "Painel de governança" : sala ? "Painel da Sala" : "Visão geral"}
        description={
          municipal
            ? "Dados agregados da intermediação municipal e alertas de governança."
            : sala
              ? "Atendimento presencial e acompanhamento de cadastros assistidos."
              : "Operação institucional da ACA — moderação, empresas e candidatos."
        }
        actions={
          <>
            {canPerformAssistedService(session.role) && (
              <PrimaryButton href="/admin/atendimento-assistido">
                <Headset className="h-3.5 w-3.5" />
                Novo atendimento
              </PrimaryButton>
            )}
            {admin && (
              <SecondaryButton href="/admin/vagas">
                <Shield className="h-3.5 w-3.5" />
                {municipal ? "Governança municipal" : "Operação ACA"}
              </SecondaryButton>
            )}
          </>
        }
      />

      {/* KPIs — uma grade só (sem duplicar faixa municipal) */}
      <div className={`grid grid-cols-2 gap-3 ${municipal ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
        {admin && (
          <FunnelCard
            label={municipal ? "Vagas ativas" : "Vagas aguardando moderação"}
            count={municipal ? publishedJobs : pendingJobsCount}
            hint={municipal ? `${pendingJobsCount} na fila` : "Fila institucional"}
            icon={<Briefcase className="h-4 w-4" />}
          />
        )}
        <FunnelCard
          label="Empresas ativas"
          count={activeCompanies}
          hint={pendingCompanies > 0 ? `${pendingCompanies} pendentes` : "Parceiras"}
          icon={<Building2 className="h-4 w-4" />}
        />
        <FunnelCard
          label="Candidatos"
          count={totalCandidates}
          hint={
            municipal
              ? `${assistedCandidatesCount} assistidos`
              : `+${newCandidatesMonth} este mês`
          }
          icon={<Users className="h-4 w-4" />}
        />
        {municipal ? (
          <FunnelCard
            label="Candidaturas recebidas"
            count={appsSubmitted}
            hint="No funil"
          />
        ) : null}
        {sala || (!municipal && canPerformAssistedService(session.role)) ? (
          <FunnelCard
            label="Atendimentos esta semana"
            count={assistedThisWeek}
            hint={`${assistedCandidatesCount} assistidos no total`}
            icon={<Headset className="h-4 w-4" />}
          />
        ) : municipal || canManageCourses(session.role) ? (
          <FunnelCard
            label="Cursos ativos"
            count={activeCoursesCount}
            hint="Qualificação"
            icon={<GraduationCap className="h-4 w-4" />}
          />
        ) : null}
      </div>

      {/* Alertas / fila */}
      <div className={`grid gap-4 ${admin ? "xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]" : ""}`}>
        {admin && (
          <SurfaceCard className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#E6E8EB] px-4 py-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Fila de moderação</h3>
              <Link href="/admin/vagas" className="text-xs font-bold text-[#E65100] hover:underline">
                Ver todas
              </Link>
            </div>
            {pendingJobs.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-[#78716c]">Nenhuma vaga pendente.</p>
            ) : (
              <ul className="divide-y divide-[#E6E8EB]">
                {pendingJobs.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1C1410]">{job.title}</p>
                      <p className="truncate text-[11px] text-[#78716c]">
                        {job.company.tradeName || job.company.name}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusPill label="Pendente" tone="orange" />
                      <Link
                        href={`/admin/vagas?job=${job.id}`}
                        className="rounded-md border border-[#E65100]/40 px-2.5 py-1 text-[11px] font-bold text-[#E65100] hover:bg-[#FFF4EA]"
                      >
                        Revisar
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>
        )}

        {admin && (
          <SurfaceCard className="p-4">
            <h3 className="text-sm font-bold text-[#1C1410]">Funil de candidaturas</h3>
            <div className="mt-4 space-y-3">
              {[
                { label: "Recebidas", value: appsSubmitted },
                { label: "Em triagem", value: appsReview },
                { label: "Entrevistas", value: appsInterview },
                { label: "Encaminhadas", value: appsApproved },
              ].map((step) => (
                <div key={step.label}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-[#78716c]">{step.label}</span>
                    <span className="font-bold text-[#1C1410]">{step.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#F4F5F7]">
                    <div
                      className="h-full rounded-full bg-[#E65100]"
                      style={{ width: `${Math.min(100, (step.value / funnelTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-[#78716c]">
              Taxa de avanço geral: <strong className="text-[#1C1410]">{advanceRate}%</strong>
            </p>
          </SurfaceCard>
        )}

        {sala && !admin && (
          <SurfaceCard className="p-5 sm:col-span-2">
            <h3 className="text-sm font-bold text-[#1C1410]">Ações do dia</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <PrimaryButton href="/admin/atendimento-assistido" className="w-full">
                Novo atendimento
              </PrimaryButton>
              <SecondaryButton href="/admin/empresas/nova" className="w-full">
                Cadastrar empresa
              </SecondaryButton>
            </div>
          </SurfaceCard>
        )}
      </div>

      {/* Linha inferior */}
      <div className={`grid gap-4 ${admin ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {admin && (
          <SurfaceCard className="overflow-hidden lg:col-span-1">
            <div className="border-b border-[#E6E8EB] px-4 py-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Empresas parceiras recentes</h3>
            </div>
            <ul className="divide-y divide-[#E6E8EB]">
              {recentCompanies.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1C1410]">
                      {c.tradeName || c.name}
                    </p>
                    <p className="text-[11px] text-[#78716c]">
                      {c.createdByInstitution || "—"} ·{" "}
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <StatusPill
                    label={c.status === "ACTIVE" ? "Ativa" : c.status}
                    tone={c.status === "ACTIVE" ? "success" : "warn"}
                  />
                </li>
              ))}
            </ul>
          </SurfaceCard>
        )}

        {admin && (
          <SurfaceCard className="p-4">
            <h3 className="text-sm font-bold text-[#1C1410]">Ações rápidas</h3>
            <div className="mt-3 space-y-2">
              <PrimaryButton href="/admin/empresas/nova" className="w-full">
                <Building2 className="h-3.5 w-3.5" />
                Cadastrar empresa
              </PrimaryButton>
              <SecondaryButton href="/admin/vagas" className="w-full">
                Moderar vagas
              </SecondaryButton>
            </div>
          </SurfaceCard>
        )}

        <SurfaceCard className="border-amber-200 bg-amber-50/80 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold text-amber-950">Alertas</h3>
              <ul className="mt-2 space-y-1.5 text-xs text-amber-900">
                {admin && pendingJobsCount > 0 && (
                  <li>
                    {pendingJobsCount} vaga(s) aguardando moderação
                  </li>
                )}
                {pendingValidation > 0 && (
                  <li>{pendingValidation} currículo(s) aguardando validação</li>
                )}
                {municipal && pendingDeletions > 0 && (
                  <li>{pendingDeletions} solicitação(ões) LGPD pendentes</li>
                )}
                {pendingJobsCount === 0 && pendingValidation === 0 && pendingDeletions === 0 && (
                  <li>Nenhum alerta crítico no momento.</li>
                )}
              </ul>
              {municipal && (
                <Link
                  href="/admin/auditoria"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E65100] hover:underline"
                >
                  Acessar solicitações <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>
        </SurfaceCard>
      </div>

      {municipal && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            canViewIndicators(session.role) && {
              href: "/admin/indicadores",
              label: "Indicadores",
              desc: "Relatórios agregados",
            },
            canManageUsers(session.role) && {
              href: "/admin/usuarios",
              label: "Usuários",
              desc: "Permissões e acessos",
            },
            { href: "/admin/auditoria", label: "Auditoria e LGPD", desc: "Logs e exclusões" },
            canManageCourses(session.role) && {
              href: "/admin/cursos",
              label: "Cursos",
              desc: "Qualificação",
            },
          ]
            .filter(Boolean)
            .map((item) => {
              const link = item as { href: string; label: string; desc: string };
              return (
                <Link key={link.href} href={link.href}>
                  <SurfaceCard className="h-full p-4 transition hover:border-[#E65100]/40">
                    <p className="text-sm font-bold text-[#1C1410]">{link.label}</p>
                    <p className="mt-1 text-[11px] text-[#78716c]">{link.desc}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[#E65100]">
                      Acessar <ArrowRight className="h-3 w-3" />
                    </span>
                  </SurfaceCard>
                </Link>
              );
            })}
        </div>
      )}
    </div>
  );
}
