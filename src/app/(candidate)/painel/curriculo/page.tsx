import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  FileText,
  Briefcase,
  GraduationCap,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  File,
  Download,
} from "lucide-react";
import { ResumeFileUpload } from "@/components/candidate/ResumeFileUpload";

interface CurriculoPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
    exp?: string;
    edu?: string;
    cursos?: string;
    skills?: string;
  };
}

export default async function CurriculoPage({ searchParams }: CurriculoPageProps) {
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
      documents: true,
    },
  });

  if (!profile) {
    redirect("/painel/perfil");
  }

  const currentResume = profile.resumeVersions[0];
  const skillsArray = currentResume?.skillsSnapshot ? JSON.parse(currentResume.skillsSnapshot) : [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#E65100] uppercase tracking-wider">
            Versão {currentResume?.versionNumber || 1} Ativa
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Currículo Estruturado Digital
          </h1>
          <p className="text-xs text-[#78716c]">
            Preencha seus dados de forma organizada para que os recrutadores encontrem você nas buscas e triagens.
          </p>
        </div>

        <Link
          href="/painel"
          className="text-xs font-bold text-[#78716c] hover:text-[#E65100] self-start sm:self-center"
        >
          ← Voltar ao painel
        </Link>
      </div>

      {searchParams.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {searchParams.sucesso === "importado"
              ? `Currículo importado do LinkedIn: ${searchParams.exp || 0} experiência(s), ${searchParams.edu || 0} formação(ões), ${searchParams.cursos || 0} curso(s)/certificado(s), ${searchParams.skills || 0} competência(s). Revise e ajuste se precisar.`
              : searchParams.sucesso === "linkedin_anexo"
                ? "Anexo do LinkedIn lido e aplicado ao currículo estruturado. Revise os dados abaixo."
                : searchParams.sucesso === "anexo_enviado"
                  ? "Anexo enviado com sucesso."
                  : "Currículo atualizado com sucesso! Nova versão histórica registrada."}
          </span>
        </div>
      )}

      {searchParams.erro && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>
            {searchParams.erro === "arquivo_obrigatorio"
              ? "Selecione um arquivo antes de enviar."
              : searchParams.erro === "arquivo_muito_grande"
                ? "Arquivo acima de 10 MB."
                : "Não foi possível enviar o currículo. Tente novamente."}
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-[#D0E2F7] bg-[#F0F7FC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#0A66C2]">Veio do LinkedIn?</p>
          <p className="text-xs text-[#4B5563]">
            Importe experiências, cargos, formação e certificados pelo PDF do seu perfil.
          </p>
        </div>
        <Link
          href="/painel/importar-linkedin"
          className="inline-flex items-center justify-center rounded-xl bg-[#0A66C2] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#004182]"
        >
          Importar do LinkedIn
        </Link>
      </div>

      {/* Formulário do Currículo Estruturado */}
      <form action="/api/candidate/resume" method="POST" className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-8">
        {/* Resumo Profissional */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <FileText className="w-4 h-4 text-[#E65100]" />
            <span>Resumo Profissional & Habilidades</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">
              Título / Objetivo Principal
            </label>
            <input
              type="text"
              name="headline"
              defaultValue={currentResume?.headline || profile.professionalHeadline || ""}
              placeholder="Ex: Assistente Administrativo | Vendas e Atendimento"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">
              Sobre Você (Resumo da sua trajetória)
            </label>
            <textarea
              name="summary"
              rows={4}
              defaultValue={currentResume?.summary || profile.summary || ""}
              placeholder="Descreva suas principais conquistas, pontos fortes e disposição para o trabalho..."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">
              Principais Habilidades (Separadas por vírgula)
            </label>
            <input
              type="text"
              name="skills"
              defaultValue={skillsArray.join(", ")}
              placeholder="Ex: Atendimento ao Cliente, Excel, Vendas, Organização, Boa Comunicação"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Experiência Profissional */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <Briefcase className="w-4 h-4 text-[#E65100]" />
            <span>Experiência Profissional Mais Recente</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Empresa / Estabelecimento</label>
              <input
                type="text"
                name="expCompany"
                defaultValue={currentResume?.experiences[0]?.company || ""}
                placeholder="Ex: Comercial Silva / Autônomo"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Cargo / Função</label>
              <input
                type="text"
                name="expPosition"
                defaultValue={currentResume?.experiences[0]?.position || ""}
                placeholder="Ex: Auxiliar de Vendas / Operador de Caixa"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Principais Atividades Realizadas</label>
            <textarea
              name="expDescription"
              rows={3}
              defaultValue={currentResume?.experiences[0]?.description || ""}
              placeholder="Descreva o que você fazia no dia a dia nesta função..."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Formação Acadêmica & Cursos */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <GraduationCap className="w-4 h-4 text-[#E65100]" />
            <span>Formação & Cursos de Qualificação</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Instituição de Ensino</label>
              <input
                type="text"
                name="eduInstitution"
                defaultValue={currentResume?.educations[0]?.institution || ""}
                placeholder="Ex: Escola Rotary / AESA"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Curso / Nível</label>
              <input
                type="text"
                name="eduCourse"
                defaultValue={currentResume?.educations[0]?.course || ""}
                placeholder="Ex: Ensino Médio / Administração"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Nível de Escolaridade</label>
              <select
                name="eduLevel"
                defaultValue={currentResume?.educations[0]?.level || profile.educationLevel}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="FUNDAMENTAL">Ensino Fundamental</option>
                <option value="MEDIO">Ensino Médio</option>
                <option value="TECNICO">Ensino Técnico</option>
                <option value="SUPERIOR">Ensino Superior</option>
                <option value="POS">Pós-Graduação</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Curso Complementar (Ex: Sebrae / Senai)</label>
              <input
                type="text"
                name="courseTitle"
                defaultValue={currentResume?.courses[0]?.title || ""}
                placeholder="Ex: Atendimento ao Cliente / Informática Básica"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Instituição do Curso</label>
              <input
                type="text"
                name="courseInstitution"
                defaultValue={currentResume?.courses[0]?.institution || ""}
                placeholder="Ex: Sebrae PE / Senac Arcoverde"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full sm:w-auto bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-md transition"
        >
          Salvar Currículo Estruturado
        </button>
      </form>

      {/* Seção de Anexos (PDF/DOCX) */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#FEEDDF] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#E65100]" />
              <span>Currículo em Anexo (PDF ou Imagem)</span>
            </h2>
            <p className="text-xs text-[#78716c]">
              O anexo é complementar e será disponibilizado para download seguro aos recrutadores autorizados.
            </p>
          </div>
        </div>

        {/* Upload Form */}
        <ResumeFileUpload />

        {/* Documentos Anexados */}
        {profile.documents.length > 0 && (
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold text-[#57433C]">Seus arquivos anexados:</h3>
            <div className="space-y-2">
              {profile.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 rounded-xl border border-[#FEEDDF] bg-stone-50 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <File className="w-4 h-4 text-[#E65100]" />
                    <span className="font-semibold text-[#2E221F]">{doc.fileName}</span>
                    <span className="text-[11px] text-[#A8A29E]">
                      ({(doc.fileSize / 1024).toFixed(1)} KB)
                    </span>
                  </div>

                  <a
                    href={`/api/documents/${doc.fileKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-[#E65100] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
