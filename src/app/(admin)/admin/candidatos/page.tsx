import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canDeleteCurriculum, canValidateCurriculum, canViewAllCandidates } from "@/lib/auth/rbac";
import { containsInsensitive } from "@/lib/db/search";
import {
  Users,
  Search,
  ArrowLeft,
  GraduationCap,
  Car,
  FileText,
  Phone,
  Mail,
  Download,
  ShieldCheck,
} from "lucide-react";

interface AdminCandidatosPageProps {
  searchParams: {
    q?: string;
    origem?: string;
  };
}

export default async function AdminCandidatosPage({ searchParams }: AdminCandidatosPageProps) {
  const session = await getSession();
  if (!session || !canViewAllCandidates(session.role)) {
    redirect("/entrar");
  }

  const query = searchParams.q?.trim() || "";
  const origem = searchParams.origem || "";
  const mayValidate = canValidateCurriculum(session.role);
  const mayDelete = canDeleteCurriculum(session.role);

  const where: any = {};
  if (query) {
    where.OR = [
      { fullName: containsInsensitive(query) },
      { professionalHeadline: containsInsensitive(query) },
      { summary: containsInsensitive(query) },
    ];
  }
  if (origem === "ASSISTED") {
    where.isAssisted = true;
  } else if (origem === "SELF") {
    where.isAssisted = false;
  }

  const candidates = await prisma.candidateProfile.findMany({
    where,
    include: {
      user: true,
      resumeVersions: {
        where: { isCurrent: true },
        take: 1,
      },
      documents: true,
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel de governança</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
              Banco de Talentos & Candidatos
            </h1>
            <p className="text-xs text-[#78716c]">
              Consulte os profissionais cadastrados para triagem e encaminhamento na Feira de Empregabilidade.
            </p>
          </div>

          <Link
            href="/admin/atendimento-assistido"
            className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            + Novo Atendimento Assistido
          </Link>
        </div>
      </div>

      {/* Busca e Filtro de Origem */}
      <form method="GET" action="/admin/candidatos" className="bg-white p-4 rounded-2xl border border-[#FEEDDF] flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Buscar por nome, profissão ou palavras-chave..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#FEEDDF] text-xs focus:outline-none focus:border-[#E65100]"
          />
        </div>

        <select
          name="origem"
          defaultValue={origem}
          className="text-xs p-2 rounded-xl border border-[#FEEDDF] bg-[#FFF8F2] focus:outline-none"
        >
          <option value="">Todas as origens</option>
          <option value="ASSISTED">Cadastros Assistidos (Presenciais)</option>
          <option value="SELF">Auto-Cadastros (Web)</option>
        </select>

        <button
          type="submit"
          className="bg-[#2E221F] hover:bg-[#1F1614] text-white font-bold text-xs px-5 py-2 rounded-xl transition"
        >
          Filtrar
        </button>
      </form>

      {/* Lista de Candidatos */}
      <div className="space-y-4">
        {candidates.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
            <Users className="w-12 h-12 text-[#E65100] mx-auto" />
            <h3 className="text-base font-bold text-[#2E221F]">Nenhum candidato encontrado</h3>
            <p className="text-xs text-[#78716c]">Tente alterar seus termos de busca.</p>
          </div>
        ) : (
          candidates.map((cand) => {
            const currentResume = cand.resumeVersions[0];
            const skills: string[] = currentResume?.skillsSnapshot ? JSON.parse(currentResume.skillsSnapshot) : [];

            return (
              <div
                key={cand.id}
                className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        cand.validationStatus === "VALIDATED"
                          ? "bg-emerald-100 text-emerald-800"
                          : cand.validationStatus === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-900"
                      }`}>
                        {cand.validationStatus === "VALIDATED"
                          ? "Currículo validado"
                          : cand.validationStatus === "REJECTED"
                            ? "Currículo rejeitado"
                            : "Validação pendente"}
                      </span>
                      {cand.isAssisted ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded">
                          Atendimento Presencial ({cand.assistedUnit || "Sala do Empreendedor"})
                        </span>
                      ) : (
                        <span className="text-[10px] bg-stone-100 text-stone-700 font-medium px-2 py-0.5 rounded">
                          Auto-Cadastro Portal
                        </span>
                      )}
                      <span className="text-xs text-[#78716c]">
                        {cand.city} - {cand.state} {cand.neighborhood && `• ${cand.neighborhood}`}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#2E221F]">{cand.fullName}</h3>
                    <p className="text-xs font-semibold text-[#57433C]">
                      {cand.professionalHeadline || "Perfil Geral"}
                    </p>
                  </div>

                  <div className="text-right text-xs text-[#78716c]">
                    <span className="font-semibold text-[#2E221F]">{cand._count.applications}</span> candidaturas ativas
                  </div>
                </div>

                {/* Qualificações */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#57433C] p-3 bg-[#FFF8F2] rounded-2xl">
                  <div>
                    <span className="text-[#78716c] block">Escolaridade</span>
                    <strong className="text-[#2E221F]">{cand.educationLevel}</strong>
                  </div>
                  <div>
                    <span className="text-[#78716c] block">CNH</span>
                    <strong className="text-[#2E221F]">{cand.driverLicense === "NENHUMA" ? "Não possui" : cand.driverLicense}</strong>
                  </div>
                  <div>
                    <span className="text-[#78716c] block">Telefone</span>
                    <strong className="text-[#2E221F]">{cand.phone || "Não informado"}</strong>
                  </div>
                  <div>
                    <span className="text-[#78716c] block">E-mail</span>
                    <strong className="text-[#2E221F]">{cand.user.email}</strong>
                  </div>
                </div>

                {/* Resumo */}
                {currentResume?.summary && (
                  <p className="text-xs text-[#57433C] leading-relaxed">
                    {currentResume.summary}
                  </p>
                )}

                {/* Habilidades & Anexos */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#FEEDDF] text-xs">
                  <div className="flex flex-wrap gap-1">
                    {skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-stone-100 text-[#2E221F] text-[11px]">
                        {s}
                      </span>
                    ))}
                  </div>

                  {cand.documents.length > 0 && (
                    <a
                      href={`/api/documents/${cand.documents[0].fileKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#E65100] hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar Currículo Anexo ({cand.documents[0].fileName})</span>
                    </a>
                  )}
                </div>

                {mayValidate && (
                  <form action={`/api/admin/candidates/${cand.id}/validate`} method="POST" className="grid sm:grid-cols-[1fr_auto_auto] gap-2 pt-3 border-t border-[#FEEDDF]">
                    <input
                      name="notes"
                      defaultValue={cand.validationNotes || ""}
                      placeholder="Observações da validação (opcional)"
                      className="px-3 py-2 rounded-xl border border-[#FEEDDF] text-xs"
                    />
                    <button name="status" value="VALIDATED" className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold">
                      Validar
                    </button>
                    <button name="status" value="REJECTED" className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 font-bold">
                      Rejeitar
                    </button>
                  </form>
                )}

                {mayDelete ? (
                  <form action={`/api/admin/candidates/${cand.id}/delete`} method="POST" className="text-right">
                    <button className="text-xs font-bold text-red-700 hover:underline">
                      Excluir currículo e dados relacionados
                    </button>
                  </form>
                ) : session.role === "ACA_ADMIN" ? (
                  <p className="text-[11px] text-[#78716c]">A ACA pode validar, mas a exclusão é restrita à gestão municipal.</p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
