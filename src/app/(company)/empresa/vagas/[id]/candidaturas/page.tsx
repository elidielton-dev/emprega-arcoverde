import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { getAtsBand, getMatchBandLabel } from "@/lib/matching/calculator";
import type { AtsBreakdown, AtsBand } from "@/lib/matching/professional-ats";
import {
  ArrowLeft,
  Users,
  Phone,
  Mail,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import { isWordFile, pickResumeDocument } from "@/lib/resume/files";

function parseBreakdown(raw?: string | null): AtsBreakdown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AtsBreakdown;
  } catch {
    return null;
  }
}

function ChipList({
  items,
  tone,
}: {
  items: string[];
  tone: "ok" | "miss" | "pref";
}) {
  if (!items.length) return <span className="text-[11px] text-[#78716c]">—</span>;
  const styles =
    tone === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : tone === "miss"
        ? "bg-stone-100 text-stone-600 border-stone-200"
        : "bg-amber-50 text-amber-900 border-amber-200";
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.slice(0, 12).map((item) => (
        <span key={item} className={`px-2 py-0.5 rounded border text-[11px] font-medium ${styles}`}>
          {item}
        </span>
      ))}
      {items.length > 12 && (
        <span className="text-[11px] text-[#78716c]">+{items.length - 12}</span>
      )}
    </div>
  );
}

export default async function EmpresaVagaCandidaturasPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sucesso?: string; faixa?: string };
}) {
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
      },
    },
  });

  if (!job) {
    notFound();
  }

  if (session.role === "COMPANY_MEMBER" && job.companyId !== session.companyId) {
    redirect("/empresa");
  }

  type RankedApp = (typeof job.applications)[number] & {
    band: AtsBand;
    breakdown: AtsBreakdown | null;
  };

  const ranked: RankedApp[] = job.applications.map((app) => ({
    ...app,
    band: getAtsBand(app.matchScore),
    breakdown: parseBreakdown(app.matchBreakdown),
  }));
  ranked.sort((a, b) => b.matchScore - a.matchScore || b.createdAt.getTime() - a.createdAt.getTime());
  const needsRefresh = ranked.some((a) => !a.breakdown);
  const faixaFilter = (searchParams.faixa || "").toUpperCase() as AtsBand | "";
  const filtered =
    faixaFilter === "STRONG" || faixaFilter === "ADEQUATE" || faixaFilter === "REVIEW"
      ? ranked.filter((a) => a.band === faixaFilter)
      : ranked;

  const counts = {
    all: ranked.length,
    STRONG: ranked.filter((a) => a.band === "STRONG").length,
    ADEQUATE: ranked.filter((a) => a.band === "ADEQUATE").length,
    REVIEW: ranked.filter((a) => a.band === "REVIEW").length,
  };

  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    SUBMITTED: { label: "Novo / Enviado", bg: "bg-blue-50", text: "text-blue-700" },
    UNDER_REVIEW: { label: "Em Análise", bg: "bg-amber-50", text: "text-amber-800" },
    CONTACT_SELECTED: { label: "Selecionado p/ Contato", bg: "bg-purple-50", text: "text-purple-700" },
    INTERVIEW_SCHEDULED: { label: "Entrevista Agendada", bg: "bg-emerald-50", text: "text-emerald-700" },
    APPROVED: { label: "Aprovado", bg: "bg-emerald-100", text: "text-emerald-900" },
    NOT_SELECTED: { label: "Não Selecionado", bg: "bg-stone-100", text: "text-stone-600" },
    WITHDRAWN: { label: "Desistência", bg: "bg-red-50", text: "text-red-700" },
  };

  const basePath = `/empresa/vagas/${job.id}/candidaturas`;

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
              Triagem ATS: {job.title}
            </h1>
            <p className="text-xs text-[#78716c] max-w-2xl mt-1">
              Ranking assistido com leitura do currículo (PDF/DOCX), cobertura de requisitos e sinais
              suaves. A cidade e lacunas não eliminam — a entrevista decide.
            </p>
          </div>
          <form action={`/api/company/jobs/${job.id}/ats-refresh`} method="POST">
            <button
              type="submit"
              className="inline-flex items-center gap-2 text-xs font-bold bg-white border border-[#E6E8EB] hover:bg-[#F4F5F7] text-[#1A1A1A] px-4 py-2.5 rounded-full"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar triagem
            </button>
          </form>
        </div>
      </div>

      {searchParams.sucesso === "triagem_atualizada" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          Ranking ATS recalculado com currículos e anexos atuais.
        </p>
      )}

      {needsRefresh && (
        <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Há candidaturas sem breakdown detalhado. Clique em <strong>Atualizar triagem</strong> para
          ler os PDFs/DOCX e recalcular o ranking profissional.
        </p>
      )}

      {ranked.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              { key: "", label: `Todos (${counts.all})` },
              { key: "STRONG", label: `Forte (${counts.STRONG})` },
              { key: "ADEQUATE", label: `Adequado (${counts.ADEQUATE})` },
              { key: "REVIEW", label: `Revisar (${counts.REVIEW})` },
            ] as const
          ).map((f) => {
            const active = (faixaFilter || "") === f.key;
            return (
              <Link
                key={f.key || "all"}
                href={f.key ? `${basePath}?faixa=${f.key}` : basePath}
                className={`text-xs font-bold px-3.5 py-2 rounded-full border ${
                  active
                    ? "bg-[#1C1410] text-white border-[#1C1410]"
                    : "bg-white text-[#57433C] border-[#E6E8EB] hover:bg-[#F4F5F7]"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
          <Users className="w-12 h-12 text-[#E65100] mx-auto" />
          <h3 className="text-base font-bold text-[#2E221F]">
            {ranked.length === 0 ? "Nenhuma candidatura recebida ainda" : "Nenhum candidato nesta faixa"}
          </h3>
          <p className="text-xs text-[#78716c]">
            {ranked.length === 0
              ? "Assim que os candidatos se inscreverem, a triagem por compatibilidade aparece aqui."
              : "Ajuste o filtro de faixa ou atualize a triagem."}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((app, index) => {
            const currentResume = app.candidate.resumeVersions[0];
            let candidateSkills: string[] = [];
            try {
              candidateSkills = currentResume?.skillsSnapshot
                ? JSON.parse(currentResume.skillsSnapshot)
                : [];
            } catch {
              candidateSkills = [];
            }

            const resumeFile = pickResumeDocument(app.candidate.documents || []);
            const systemResumeHref = `/empresa/vagas/${job.id}/candidaturas/${app.id}/curriculo`;
            const fileHref = resumeFile ? `/api/documents/${resumeFile.fileKey}` : null;
            const isWord = resumeFile ? isWordFile(resumeFile.mimeType, resumeFile.fileName) : false;

            const currentStatus = statusLabels[app.status] || {
              label: app.status,
              bg: "bg-stone-100",
              text: "text-stone-700",
            };

            let explanations: string[] = [];
            try {
              explanations = app.matchExplanation ? JSON.parse(app.matchExplanation) : [];
            } catch {
              explanations = [];
            }

            const breakdown = app.breakdown;
            const band = getMatchBandLabel(app.matchScore);
            const rankIndex = ranked.findIndex((r) => r.id === app.id);

            return (
              <div
                key={app.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black text-[#E65100] bg-[#FFF4EA] px-2.5 py-0.5 rounded-full">
                        #{rankIndex + 1} no ranking
                      </span>
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

                    <h3 className="text-xl font-bold text-[#2E221F]">{app.candidate.fullName}</h3>

                    <p className="text-xs text-[#57433C]">
                      {app.candidate.city} - {app.candidate.state}{" "}
                      {app.candidate.neighborhood && `(${app.candidate.neighborhood})`} · Escolaridade:{" "}
                      {app.candidate.educationLevel}
                    </p>
                  </div>

                  <div className={`rounded-2xl border px-4 py-3 text-center min-w-[140px] ${band.bg} ${band.border}`}>
                    <div className={`flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wide ${band.text}`}>
                      <Sparkles className={`w-3.5 h-3.5 ${band.text}`} />
                      <span className={band.text}>ATS</span>
                    </div>
                    <p className={`text-3xl font-black ${band.text}`}>{app.matchScore}</p>
                    <p className={`text-[11px] font-semibold ${band.text}`}>{band.label}</p>
                  </div>
                </div>

                {breakdown && (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#78716c]">Requisitos</p>
                      <p className="text-lg font-black text-[#2E221F] mt-0.5">
                        {breakdown.requiredMatched.length}/
                        {breakdown.requiredMatched.length + breakdown.requiredMissing.length}
                      </p>
                      <p className="text-[11px] text-[#57433C]">+{breakdown.keywordCoverage} pts cobertura</p>
                    </div>
                    <div className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#78716c]">Experiência</p>
                      <p className="text-lg font-black text-[#2E221F] mt-0.5">
                        ~{breakdown.experienceYears} ano(s)
                      </p>
                      <p className="text-[11px] text-[#57433C]">+{breakdown.experience} pts</p>
                    </div>
                    <div className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#78716c] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Localidade
                      </p>
                      <p className="text-[12px] font-semibold text-[#2E221F] mt-1 leading-snug">
                        {breakdown.locationLabel}
                      </p>
                      <p className="text-[11px] text-[#57433C] mt-0.5">+{breakdown.locationHint} pts (não elimina)</p>
                    </div>
                    <div className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#78716c]">Arquivo</p>
                      <p className="text-[12px] font-semibold text-[#2E221F] mt-1 leading-snug">
                        {breakdown.parseLabel}
                      </p>
                      <p className="text-[11px] text-[#57433C] mt-0.5">+{breakdown.documentQuality} pts</p>
                    </div>
                  </div>
                )}

                {breakdown && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#2E221F] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Requisitos encontrados
                      </p>
                      <ChipList items={breakdown.requiredMatched} tone="ok" />
                      <p className="text-xs font-bold text-[#2E221F] flex items-center gap-1.5 pt-2">
                        <CircleDashed className="w-3.5 h-3.5 text-stone-500" />
                        Em aberto (avaliar na entrevista)
                      </p>
                      <ChipList items={breakdown.requiredMissing} tone="miss" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-[#2E221F]">Desejáveis encontrados</p>
                      <ChipList items={breakdown.preferredMatched} tone="pref" />
                      {breakdown.alerts.length > 0 && (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-1.5">
                          <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Alertas (não eliminatórios)
                          </p>
                          {breakdown.alerts.map((alert, i) => (
                            <p key={i} className="text-[11px] text-amber-900 leading-relaxed">
                              · {alert}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {explanations.length > 0 && (
                  <details className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-4 group">
                    <summary className="text-xs font-bold text-[#2E221F] cursor-pointer list-none flex items-center justify-between">
                      Detalhamento do score
                      <span className="text-[10px] font-semibold text-[#78716c] group-open:hidden">ver</span>
                      <span className="text-[10px] font-semibold text-[#78716c] hidden group-open:inline">ocultar</span>
                    </summary>
                    <ul className="space-y-1 mt-3">
                      {explanations.map((item, i) => (
                        <li key={i} className="text-xs text-[#57433C] leading-relaxed">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

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

                <div className="space-y-3 text-xs">
                  {currentResume?.summary && (
                    <div>
                      <span className="font-bold text-[#2E221F] block mb-1">Resumo profissional</span>
                      <p className="text-[#57433C] leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200">
                        {currentResume.summary}
                      </p>
                    </div>
                  )}

                  {currentResume?.experiences?.length ? (
                    <div>
                      <span className="font-bold text-[#2E221F] block mb-1">Última experiência</span>
                      <div className="text-[#57433C] space-y-0.5">
                        <strong className="text-[#2E221F]">{currentResume.experiences[0].position}</strong> na{" "}
                        {currentResume.experiences[0].company}
                        {currentResume.experiences[0].description && (
                          <p className="text-[11px] text-[#78716c]">{currentResume.experiences[0].description}</p>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {candidateSkills.length > 0 && (
                    <div className="pt-1">
                      <span className="font-bold text-[#2E221F] block mb-1">Habilidades declaradas</span>
                      <div className="flex flex-wrap gap-1.5">
                        {candidateSkills.map((sk, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-[#2E221F] text-[11px]">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.candidate.documents?.length > 0 && (
                    <div className="pt-2">
                      <span className="font-bold text-[#2E221F] block mb-1">Arquivos anexados</span>
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
                              {doc.parseStatus === "OK" && (
                                <span className="text-[10px] text-emerald-700 font-semibold">ATS</span>
                              )}
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <form
                  action={`/api/company/applications/${app.id}/status`}
                  method="POST"
                  className="pt-4 border-t border-[#FEEDDF] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs font-bold text-[#57433C] shrink-0">Alterar status</label>
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

                  <div className="grid sm:grid-cols-3 gap-2">
                    <label className="text-xs font-bold text-[#57433C]">
                      Data da entrevista
                      <input type="datetime-local" name="scheduledAt" className="mt-1 w-full p-2 rounded-xl border border-[#FEEDDF] text-base" />
                    </label>
                    <label className="text-xs font-bold text-[#57433C]">
                      Local ou link
                      <input name="location" className="mt-1 w-full p-2 rounded-xl border border-[#FEEDDF] text-base" />
                    </label>
                    <label className="text-xs font-bold text-[#57433C]">
                      Orientações
                      <input name="instructions" className="mt-1 w-full p-2 rounded-xl border border-[#FEEDDF] text-base" />
                    </label>
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
