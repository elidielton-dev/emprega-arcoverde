import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { calculateJobMatch } from "@/lib/matching/calculator";
import {
  Briefcase,
  MapPin,
  Building,
  Calendar,
  GraduationCap,
  Car,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
  Users,
  AlertCircle,
} from "lucide-react";

interface JobSlugPageProps {
  params: {
    slug: string;
  };
}

export default async function JobSlugPage({ params }: JobSlugPageProps) {
  const job = await prisma.job.findUnique({
    where: { slug: params.slug },
    include: {
      company: {
        select: {
          name: true,
          tradeName: true,
          city: true,
          state: true,
          description: true,
        },
      },
      category: true,
    },
  });

  if (!job || job.status !== "PUBLISHED") {
    notFound();
  }

  // Incrementar visualização de forma síncrona/segura
  await prisma.job.update({
    where: { id: job.id },
    data: { viewsCount: { increment: 1 } },
  }).catch(() => {});

  const session = await getSession();

  let existingApplication = null;
  let candidateMatch = null;
  let candidateProfile = null;

  if (session && session.role === "CANDIDATE") {
    candidateProfile = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
      include: {
        resumeVersions: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (candidateProfile) {
      existingApplication = await prisma.application.findUnique({
        where: {
          jobId_candidateId: {
            jobId: job.id,
            candidateId: candidateProfile.id,
          },
        },
      });

      // Calcular match explicável em tempo real
      const candidateSkills = candidateProfile.resumeVersions[0]?.skillsSnapshot
        ? JSON.parse(candidateProfile.resumeVersions[0].skillsSnapshot)
        : [];

      const requiredSkills = job.skillsText ? job.skillsText.split(",").map((s) => s.trim()) : [];

      candidateMatch = calculateJobMatch(
        {
          city: candidateProfile.city,
          educationLevel: candidateProfile.educationLevel,
          driverLicense: candidateProfile.driverLicense,
          skills: candidateSkills,
          categorySlug: job.category.slug,
        },
        {
          city: job.city,
          educationLevel: job.educationLevel,
          driverLicense: job.driverLicense,
          requiredSkills: requiredSkills,
          categorySlug: job.category.slug,
        }
      );
    }
  }

  const companyDisplayName = job.isConfidential
    ? "Empresa Confidencial"
    : job.company.tradeName || job.company.name;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Botão Voltar */}
      <div>
        <Link
          href="/vagas"
          className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-[#E65100] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a lista de vagas</span>
        </Link>
      </div>

      {/* Cartão de Cabeçalho da Vaga */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-[#FFF8F2] text-[#E65100] rounded-md border border-[#FDCFA9]">
                {job.category.name}
              </span>
              {job.isConfidential && (
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-[#F5F5F4] text-[#78716C] px-2 py-0.5 rounded">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#E65100]" /> Vaga Confidencial
                </span>
              )}
              <span className="text-xs text-[#78716c] font-medium">
                {job.contractType} • {job.workplaceType}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
              {job.title}
            </h1>

            <p className="text-sm font-semibold text-[#57433C]">
              {companyDisplayName} • {job.city}, {job.state}
            </p>
          </div>

          {/* Salário / Vagas */}
          <div className="sm:text-right bg-[#FFF8F2] sm:bg-transparent p-3 sm:p-0 rounded-xl">
            {!job.hideSalary && job.salaryMin ? (
              <div className="text-lg font-bold text-[#BF360C]">
                R$ {job.salaryMin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                {job.salaryMax && ` a R$ ${job.salaryMax.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              </div>
            ) : (
              <div className="text-sm font-semibold text-[#78716c]">Salário a combinar</div>
            )}
            <div className="text-xs text-[#78716c] mt-0.5">
              {job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga disponível" : "vagas disponíveis"}
            </div>
          </div>
        </div>

        {/* Metadados em Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-[#FEEDDF] text-xs text-[#78716c]">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#E65100]" />
            <div>
              <span className="block font-semibold text-[#2E221F]">Escolaridade</span>
              <span>{job.educationLevel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#E65100]" />
            <div>
              <span className="block font-semibold text-[#2E221F]">CNH Exigida</span>
              <span>{job.driverLicense === "NENHUMA" ? "Não exigida" : `Categoria ${job.driverLicense}`}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#E65100]" />
            <div>
              <span className="block font-semibold text-[#2E221F]">Experiência</span>
              <span>{job.experienceRequired ? job.experienceRequired.replace("_", " ") : "A combinar"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E65100]" />
            <div>
              <span className="block font-semibold text-[#2E221F]">Prazo Limite</span>
              <span>
                {job.applicationDeadline
                  ? new Date(job.applicationDeadline).toLocaleDateString("pt-BR")
                  : "Contínuo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Painel de Compatibilidade Explicável (Se candidato logado) */}
      {candidateMatch && (
        <div className="bg-gradient-to-r from-[#FFF8F2] to-[#FEEDDF]/60 rounded-3xl p-6 border border-[#FDCFA9] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#E65100]" />
              <h2 className="font-bold text-[#2E221F] text-base">Índice de Compatibilidade com seu Perfil</h2>
            </div>
            <span className="text-lg font-black text-[#E65100] bg-white px-3 py-1 rounded-xl shadow-xs border border-[#FDCFA9]">
              {candidateMatch.score}% compatível
            </span>
          </div>

          <div className="space-y-1.5 pt-2 text-xs text-[#57433C]">
            {candidateMatch.explanations.map((exp, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
                <span>{exp}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#A8A29E] pt-1">
            * Este índice é determinístico e explicativo, auxiliando você e o recrutador. Nenhuma candidatura é descartada automaticamente.
          </p>
        </div>
      )}

      {/* Corpo da Descrição */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#2E221F] mb-3">Resumo da Oportunidade</h2>
              <p className="text-sm text-[#57433C] leading-relaxed">{job.summary}</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#2E221F] mb-3">Descrição das Atividades</h2>
              <div className="text-sm text-[#57433C] leading-relaxed whitespace-pre-line space-y-2">
                {job.description}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#2E221F] mb-3">Requisitos e Qualificações</h2>
              <div className="text-sm text-[#57433C] leading-relaxed whitespace-pre-line bg-[#FFF8F2] p-4 rounded-2xl border border-[#FEEDDF]">
                {job.requirements}
              </div>
            </div>

            {job.skillsText && (
              <div>
                <h2 className="text-lg font-bold text-[#2E221F] mb-3">Habilidades Desejadas</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skillsText.split(",").map((skill, index) => (
                    <span
                      key={index}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-100 text-[#2E221F] border border-stone-200"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Lateral de Ação de Candidatura */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-sm space-y-5 sticky top-28">
            <h2 className="font-bold text-[#2E221F] text-base">Candidatura para a Vaga</h2>

            {existingApplication ? (
              <div className="bg-[#FFF8F2] border border-[#FDCFA9] p-4 rounded-2xl space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-[#E65100] mx-auto" />
                <h4 className="font-bold text-sm text-[#2E221F]">Você já se candidatou!</h4>
                <p className="text-xs text-[#78716c]">
                  Candidatura enviada em {new Date(existingApplication.createdAt).toLocaleDateString("pt-BR")}.
                </p>
                <div className="pt-2">
                  <Link
                    href={`/painel/candidaturas/${existingApplication.id}`}
                    className="inline-block w-full bg-[#E65100] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#D84315] transition"
                  >
                    Ver Status no Painel
                  </Link>
                </div>
              </div>
            ) : session && session.role === "CANDIDATE" ? (
              <form action="/api/jobs/apply" method="POST" className="space-y-4">
                <input type="hidden" name="jobId" value={job.id} />
                <div className="text-xs text-[#78716c] space-y-2">
                  <p>
                    Seu currículo estruturado mais recente será enviado diretamente para os recrutadores desta oportunidade.
                  </p>
                  <div>
                    <label className="block font-semibold text-[#57433C] mb-1">
                      Mensagem de apresentação (opcional):
                    </label>
                    <textarea
                      name="coverNote"
                      rows={3}
                      placeholder="Conte brevemente por que você tem interesse nesta vaga..."
                      className="w-full text-xs p-2.5 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Confirmar Candidatura</span>
                </button>
              </form>
            ) : session ? (
              <div className="bg-[#FFF8F2] p-4 rounded-2xl border border-[#FEEDDF] text-xs text-[#78716c] space-y-2">
                <AlertCircle className="w-5 h-5 text-[#E65100]" />
                <p>
                  Você está conectado como <strong>{session.role}</strong>. Para candidatar-se, entre com uma conta de candidato(a).
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#78716c] leading-relaxed">
                  Para candidatar-se a esta vaga, crie seu perfil gratuito ou entre em sua conta.
                </p>
                <Link
                  href={`/entrar?redirect=/vagas/${job.slug}`}
                  className="block w-full text-center bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl shadow-md transition"
                >
                  Entrar e Candidatar-se
                </Link>
                <Link
                  href="/cadastro"
                  className="block w-full text-center border border-[#E65100] text-[#E65100] font-semibold text-xs py-2.5 rounded-xl hover:bg-[#FFF8F2] transition"
                >
                  Criar Conta Gratuita
                </Link>
              </div>
            )}

            {/* Informações da Feira / Sala do Empreendedor */}
            <div className="pt-4 border-t border-[#FEEDDF] text-xs text-[#78716c] space-y-2">
              <div className="flex items-center gap-2 text-[#2E221F] font-semibold">
                <Users className="w-4 h-4 text-[#E65100]" />
                <span>Atendimento Presencial</span>
              </div>
              <p>
                Precisa de ajuda com o cadastro? Procure a <strong>Sala do Empreendedor</strong> no centro de Arcoverde.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
