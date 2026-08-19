import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  FileText,
  Plus,
  Briefcase,
  GraduationCap,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  File,
  Download,
  Clock,
  Sparkles,
} from "lucide-react";

interface CurriculoPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
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
          <span>Currículo atualizado com sucesso! Nova versão histórica registrada.</span>
        </div>
      )}

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
        <form
          action="/api/candidate/documents"
          method="POST"
          encType="multipart/form-data"
          className="p-6 rounded-2xl bg-[#FFF8F2] border-2 border-dashed border-[#FDCFA9] text-center space-y-4"
        >
          <div className="max-w-xs mx-auto space-y-2">
            <Upload className="w-8 h-8 text-[#E65100] mx-auto" />
            <div className="text-xs text-[#57433C]">
              <label className="font-bold text-[#E65100] hover:underline cursor-pointer">
                <span>Clique para selecionar um arquivo</span>
                <input
                  type="file"
                  name="file"
                  required
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#A8A29E] mt-1">Formatos: PDF, DOCX, PNG ou JPG (até 10MB)</p>
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#2E221F] hover:bg-[#1F1614] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
          >
            Enviar Arquivo de Currículo
          </button>
        </form>

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
