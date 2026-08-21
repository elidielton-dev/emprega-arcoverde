import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  User,
  FileText,
  Briefcase,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Upload,
  Shield,
} from "lucide-react";

export default async function PainelCandidatoPage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
    include: {
      resumeVersions: {
        where: { isCurrent: true },
        include: {
          experiences: true,
          educations: true,
          courses: true,
        },
        take: 1,
      },
      applications: {
        include: {
          job: {
            include: {
              company: { select: { name: true, tradeName: true } },
              category: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      documents: true,
    },
  });

  if (!profile) {
    redirect("/painel/perfil");
  }

  const currentResume = profile.resumeVersions[0];

  // Cálculo de preenchimento do currículo
  let completeness = 30; // Dados básicos de perfil
  if (currentResume?.summary) completeness += 15;
  if (currentResume?.experiences?.length) completeness += 25;
  if (currentResume?.educations?.length) completeness += 15;
  if (profile.documents?.length) completeness += 15;
  completeness = Math.min(100, completeness);

  // Sugestões por aderência ATS (score não exibido ao candidato — decisão produto)
  const candidatesPool = await prisma.job.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { applicationDeadline: null },
        { applicationDeadline: { gte: new Date() } },
      ],
      applications: {
        none: { candidateId: profile.id },
      },
    },
    include: {
      company: { select: { name: true, tradeName: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  const { scoreApplicationAgainstJob } = await import("@/lib/matching/ats");
  const scored = await Promise.all(
    candidatesPool.map(async (job) => {
      try {
        const result = await scoreApplicationAgainstJob(profile, job);
        return { job, score: result.score };
      } catch {
        return { job, score: 0 };
      }
    }),
  );
  scored.sort((a, b) => b.score - a.score);
  const recommendedJobs = scored.slice(0, 3).map((s) => s.job);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-[#E65100] uppercase tracking-wider">
            Painel do Candidato
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Olá, {profile.fullName}!
          </h1>
          <p className="text-xs text-[#78716c]">
            {profile.isAssisted
              ? `Atendimento Assistido realizado pela ${profile.assistedUnit || "Sala do Empreendedor"}`
              : "Gerencie seu currículo, consulte suas candidaturas e veja sugestões de vagas."}
          </p>
        </div>

        {/* Indicador de Preenchimento */}
        <div className="bg-[#FFF8F2] p-4 rounded-2xl border border-[#FDCFA9] min-w-[220px] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#57433C]">
            <span>Perfil e Currículo</span>
            <span className="text-[#E65100]">{completeness}%</span>
          </div>
          <div className="w-full bg-[#FEEDDF] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FDBA2D] to-[#E65100] h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          {completeness < 100 && (
            <Link
              href="/painel/curriculo"
              className="text-[11px] font-bold text-[#E65100] hover:underline block text-center"
            >
              Completar currículo estruturado →
            </Link>
          )}
        </div>
      </div>

      {/* Menu Rápido em Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Link
          href="/painel/curriculo"
          className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition flex flex-col justify-between group"
        >
          <FileText className="w-6 h-6 text-[#E65100] mb-2" />
          <div>
            <h3 className="font-bold text-sm text-[#2E221F] group-hover:text-[#E65100]">
              Meu Currículo
            </h3>
            <p className="text-xs text-[#78716c]">Experiências e cursos</p>
          </div>
        </Link>

        <Link
          href="/painel/candidaturas"
          className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition flex flex-col justify-between group"
        >
          <Briefcase className="w-6 h-6 text-[#E65100] mb-2" />
          <div>
            <h3 className="font-bold text-sm text-[#2E221F] group-hover:text-[#E65100]">
              Minhas Candidaturas
            </h3>
            <p className="text-xs text-[#78716c]">{profile.applications.length} registradas</p>
          </div>
        </Link>

        <Link
          href="/painel/perfil"
          className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition flex flex-col justify-between group"
        >
          <User className="w-6 h-6 text-[#E65100] mb-2" />
          <div>
            <h3 className="font-bold text-sm text-[#2E221F] group-hover:text-[#E65100]">
              Dados Pessoais
            </h3>
            <p className="text-xs text-[#78716c]">Contato e consentimento</p>
          </div>
        </Link>

        <Link
          href="/painel/privacidade"
          className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition flex flex-col justify-between group"
        >
          <Shield className="w-6 h-6 text-[#E65100] mb-2" />
          <div>
            <h3 className="font-bold text-sm text-[#2E221F] group-hover:text-[#E65100]">
              Privacidade
            </h3>
            <p className="text-xs text-[#78716c]">LGPD e exportação</p>
          </div>
        </Link>

        <Link
          href="/vagas"
          className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:border-[#E65100] hover:shadow-sm transition flex flex-col justify-between group"
        >
          <Sparkles className="w-6 h-6 text-[#E65100] mb-2" />
          <div>
            <h3 className="font-bold text-sm text-[#2E221F] group-hover:text-[#E65100]">
              Buscar Novas Vagas
            </h3>
            <p className="text-xs text-[#78716c]">Em Arcoverde e região</p>
          </div>
        </Link>
      </div>

      {/* Seção Principal: Minhas Candidaturas Recentes e Vagas Recomendadas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Minhas Candidaturas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg text-[#2E221F]">Suas Candidaturas Ativas</h2>
            <Link
              href="/painel/candidaturas"
              className="text-xs font-bold text-[#E65100] hover:underline"
            >
              Ver todas ({profile.applications.length})
            </Link>
          </div>

          {profile.applications.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] text-center space-y-3">
              <Briefcase className="w-10 h-10 text-[#E65100] mx-auto" />
              <h3 className="text-sm font-bold text-[#2E221F]">Nenhuma candidatura ativa</h3>
              <p className="text-xs text-[#78716c]">
                Você ainda não se candidatou a nenhuma vaga. Explore as vagas abertas em Arcoverde!
              </p>
              <Link
                href="/vagas"
                className="inline-block bg-[#E65100] text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-[#D84315] transition"
              >
                Ver Vagas Abertas
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.applications.slice(0, 3).map((app) => {
                const companyName = app.job.isConfidential
                  ? "Empresa Confidencial"
                  : app.job.company.tradeName || app.job.company.name;

                const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
                  SUBMITTED: { label: "Enviado", bg: "bg-blue-50", text: "text-blue-700" },
                  UNDER_REVIEW: { label: "Em Análise", bg: "bg-amber-50", text: "text-amber-800" },
                  CONTACT_SELECTED: { label: "Selecionado p/ Contato", bg: "bg-purple-50", text: "text-purple-700" },
                  INTERVIEW_SCHEDULED: { label: "Entrevista Agendada", bg: "bg-emerald-50", text: "text-emerald-700" },
                  APPROVED: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-900" },
                  NOT_SELECTED: { label: "Não Selecionado", bg: "bg-stone-100", text: "text-stone-600" },
                  WITHDRAWN: { label: "Desistência", bg: "bg-red-50", text: "text-red-700" },
                };

                const currentStatus = statusLabels[app.status] || {
                  label: app.status,
                  bg: "bg-stone-100",
                  text: "text-stone-700",
                };

                return (
                  <div
                    key={app.id}
                    className="bg-white p-5 rounded-2xl border border-[#FEEDDF] hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                          {currentStatus.label}
                        </span>
                        <span className="text-xs text-[#78716c]">
                          Enviado em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#2E221F]">
                        <Link href={`/painel/candidaturas/${app.id}`} className="hover:text-[#E65100]">
                          {app.job.title}
                        </Link>
                      </h4>
                      <p className="text-xs text-[#57433C]">{companyName}</p>
                    </div>

                    <Link
                      href={`/painel/candidaturas/${app.id}`}
                      className="text-xs font-bold text-[#E65100] hover:underline self-start sm:self-center"
                    >
                      Acompanhar →
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Vagas Recomendadas */}
        <div className="space-y-4">
          <h2 className="font-bold text-lg text-[#2E221F]">Vagas para Você</h2>
          <div className="space-y-3">
            {recommendedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-4 rounded-2xl border border-[#FEEDDF] space-y-2"
              >
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF8F2] text-[#E65100] rounded">
                  {job.category.name}
                </span>
                <h4 className="font-bold text-xs text-[#2E221F] line-clamp-1">
                  <Link href={`/vagas/${job.slug}`} className="hover:text-[#E65100]">
                    {job.title}
                  </Link>
                </h4>
                <p className="text-[11px] text-[#78716c]">
                  {job.isConfidential ? "Empresa Confidencial" : job.company.tradeName || job.company.name}
                </p>
                <div className="pt-2 flex justify-end">
                  <Link
                    href={`/vagas/${job.slug}`}
                    className="text-xs font-bold text-[#E65100] hover:underline"
                  >
                    Ver Vaga →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
