import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  Sparkles,
  FileText,
  Download,
} from "lucide-react";
import { isWordFile, pickResumeDocument } from "@/lib/resume/files";

export default async function EmpresaVagaCandidaturasPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
    redirect("/entrar");
  }

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      category: true,
      applications: {
        include: {
          candidate: {
            include: {
              user: true,
              resumeVersions: {
                where: { isCurrent: true },
                include: {
                  experiences: true,
                  educations: true,
                  courses: true,
                },
                take: 1,
              },
              documents: true,
            },
          },
        },
        orderBy: { matchScore: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Verificar se a empresa tem permissão
  if (session.role === "COMPANY_MEMBER" && job.companyId !== session.companyId) {
    redirect("/empresa");
  }

  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    SUBMITTED: { label: "Novo / Enviado", bg: "bg-blue-50", text: "text-blue-700" },
    UNDER_REVIEW: { label: "Em Análise", bg: "bg-amber-50", text: "text-amber-800" },
    CONTACT_SELECTED: { label: "Selecionado p/ Contato", bg: "bg-purple-50", text: "text-purple-700" },
    INTERVIEW_SCHEDULED: { label: "Entrevista Agendada", bg: "bg-emerald-50", text: "text-emerald-700" },
    APPROVED: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-900" },
    NOT_SELECTED: { label: "Não Selecionado", bg: "bg-stone-100", text: "text-stone-600" },
    WITHDRAWN: { label: "Desistência", bg: "bg-red-50", text: "text-red-700" },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/empresa/vagas"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar para as vagas da empresa</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
              Candidaturas: {job.title}
            </h1>
            <p className="text-xs text-[#78716c]">
              {job.applications.length} {job.applications.length === 1 ? "candidato inscrito" : "candidatos inscritos"} • Ordenados por índice de aderência explicável
            </p>
          </div>
        </div>
      </div>

      {job.applications.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-[#E65100] mx-auto" />
          <h3 className="text-base font-bold text-[#2E221F]">Nenhuma candidatura recebida ainda</h3>
          <p className="text-xs text-[#78716c]">
            Assim que os candidatos de Arcoverde se inscreverem nesta vaga, você poderá visualizar seus currículos aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {job.applications.map((app) => {
            const currentResume = app.candidate.resumeVersions[0];
            const candidateSkills: string[] = currentResume?.skillsSnapshot
              ? JSON.parse(currentResume.skillsSnapshot)
              : [];

            const resumeFile = pickResumeDocument(app.candidate.documents || []);
            const systemResumeHref = `/empresa/vagas/${job.id}/candidaturas/${app.id}/curriculo`;
            const fileHref = resumeFile ? `/api/documents/${resumeFile.fileKey}` : null;
            const isWord = resumeFile ? isWordFile(resumeFile.mimeType, resumeFile.fileName) : false;

            const currentStatus = statusLabels[app.status] || {
              label: app.status,
              bg: "bg-stone-100",
              text: "text-stone-700",
            };

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-6"
              >
                {/* Topo do Candidato */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${currentStatus.bg} ${currentStatus.text}`}>
                        {currentStatus.label}
                      </span>
                      <span className="text-xs text-[#78716c]">
                        Inscrito em {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                      {app.origin === "ASSISTED" && (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          Atendimento Presencial Assistido
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-[#2E221F]">
                      {app.candidate.fullName}
                    </h3>

                    <p className="text-xs text-[#57433C]">
                      {app.candidate.city} - {app.candidate.state} {app.candidate.neighborhood && `(${app.candidate.neighborhood})`} • Escolaridade: {app.candidate.educationLevel}
                    </p>
                  </div>

                  {/* Match Score */}
                  <div className="bg-[#FFF8F2] p-3.5 rounded-2xl border border-[#FDCFA9] text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#BF360C]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aderência</span>
                    </div>
                    <span className="text-xl font-black text-[#E65100]">{app.matchScore}%</span>
                  </div>
                </div>

                {/* Contatos com Consentimento LGPD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#FFF8F2] rounded-2xl text-xs text-[#57433C]">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#E65100]" />
                    <span>Telefone: {app.candidate.phone || "Não informado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#E65100]" />
                    <span>E-mail: {app.candidate.user.email}</span>
                  </div>
                </div>

                {/* Resumo e Experiência do Candidato */}
                <div className="space-y-3 text-xs">
                  {currentResume?.summary && (
                    <div>
                      <span className="font-bold text-[#2E221F] block mb-1">Resumo Profissional:</span>
                      <p className="text-[#57433C] leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                        {currentResume.summary}
                      </p>
                    </div>
                  )}

                  {currentResume?.experiences?.length ? (
                    <div>
                      <span className="font-bold text-[#2E221F] block mb-1">Última Experiência:</span>
                      <div className="text-[#57433C] space-y-0.5">
                        <strong className="text-[#2E221F]">{currentResume.experiences[0].position}</strong> na {currentResume.experiences[0].company}
                        {currentResume.experiences[0].description && (
                          <p className="text-[11px] text-[#78716c]">{currentResume.experiences[0].description}</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {candidateSkills.length > 0 && (
                    <div className="pt-1">
                      <span className="font-bold text-[#2E221F] block mb-1">Habilidades Declaradas:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateSkills.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-[#2E221F] text-[11px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anexos de Currículo (Download Seguro) */}
                  {app.candidate.documents?.length > 0 && (
                    <div className="pt-2">
                      <span className="font-bold text-[#2E221F] block mb-1">Arquivos anexados:</span>
                      <div className="flex flex-wrap gap-2">
                        {app.candidate.documents.map((doc) => {
                          const word = isWordFile(doc.mimeType, doc.fileName);
                          return (
                            <a
                              key={doc.id}
                              href={word ? `/api/documents/${doc.fileKey}?download=1` : `/api/documents/${doc.fileKey}`}
                              target={word ? undefined : "_blank"}
                              rel={word ? undefined : "noopener noreferrer"}
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#1A1A1A] bg-white border border-[#E6E8EB] px-3 py-1.5 rounded-full hover:bg-[#F4F5F7]"
                            >
                              {word ? <Download className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                              <span>{doc.fileName}</span>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Formulário de Atualização de Status da Candidatura */}
                <form
                  action={`/api/company/applications/${app.id}/status`}
                  method="POST"
                  className="pt-4 border-t border-[#FEEDDF] flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <label className="text-xs font-bold text-[#57433C] shrink-0">
                      Alterar status
                    </label>
                    <select
                      name="status"
                      defaultValue={app.status}
                      className="text-xs p-2 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100] flex-1 sm:max-w-xs"
                    >
                      <option value="SUBMITTED">Novo / Enviado</option>
                      <option value="UNDER_REVIEW">Em Análise</option>
                      <option value="CONTACT_SELECTED">Selecionado para Contato</option>
                      <option value="INTERVIEW_SCHEDULED">Entrevista Agendada</option>
                      <option value="APPROVED">Aprovado</option>
                      <option value="NOT_SELECTED">Não Selecionado</option>
                    </select>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
                    {resumeFile && isWord ? (
                      <a
                        href={`${fileHref}?download=1`}
                        className="inline-flex items-center justify-center gap-2 bg-[#1C1410] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full"
                      >
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        Baixar currículo
                      </a>
                    ) : resumeFile ? (
                      <a
                        href={fileHref!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-[#1C1410] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        Ver currículo
                      </a>
                    ) : (
                      <Link
                        href={systemResumeHref}
                        target="_blank"
                        className="inline-flex items-center justify-center gap-2 bg-[#1C1410] hover:bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full"
                      >
                        <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                        Ver currículo
                      </Link>
                    )}
                    <button
                      type="submit"
                      className="bg-white hover:bg-[#F4F5F7] text-[#1A1A1A] font-bold text-xs px-5 py-2.5 rounded-full border border-[#E6E8EB]"
                    >
                      Salvar status
                    </button>
                  </div>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
