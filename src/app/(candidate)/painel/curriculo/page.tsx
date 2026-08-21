import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  File,
  Download,
} from "lucide-react";
import { ResumeFileUpload } from "@/components/candidate/ResumeFileUpload";
import { ResumeStructuredForm } from "@/components/candidate/ResumeStructuredForm";

interface CurriculoPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
    aviso?: string;
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
          experiences: { orderBy: { createdAt: "asc" } },
          educations: { orderBy: { createdAt: "asc" } },
          courses: { orderBy: { createdAt: "asc" } },
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
            {searchParams.sucesso === "preenchido" || searchParams.sucesso === "linkedin_anexo"
              ? "Currículo enviado e formulário preenchido automaticamente. Revise os campos abaixo e clique em Salvar se quiser ajustar."
              : searchParams.sucesso === "importado"
                ? `Currículo importado: ${searchParams.exp || 0} experiência(s), ${searchParams.edu || 0} formação(ões). Revise e salve.`
                : searchParams.sucesso === "anexo_enviado"
                  ? searchParams.aviso === "sem_texto"
                    ? "Anexo salvo. Imagens não preenchem o formulário — use PDF ou DOCX para preenchimento automático."
                    : searchParams.aviso === "parse_falhou"
                      ? "Anexo salvo, mas não foi possível ler o texto. Preencha o formulário manualmente."
                      : "Anexo enviado. Se o PDF tiver texto, o formulário acima deve estar atualizado — atualize a página se não aparecer."
                  : "Currículo atualizado com sucesso!"}
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
                : "Não foi possível enviar o currículo. Tente PDF ou DOCX novamente."}
          </span>
        </div>
      )}

      {/* Upload primeiro → preenche o formulário abaixo */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        <div className="border-b border-[#FEEDDF] pb-3">
          <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#E65100]" />
            <span>Enviar currículo (PDF ou Word)</span>
          </h2>
          <p className="text-xs text-[#78716c] mt-1">
            Ao enviar, lemos o arquivo e preenchemos automaticamente o formulário abaixo (experiência, formação,
            cursos e habilidades). Depois você pode revisar e salvar.
          </p>
        </div>

        <ResumeFileUpload />

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

      {/* Formulário do Currículo Estruturado */}
      <ResumeStructuredForm
        headline={currentResume?.headline || profile.professionalHeadline || ""}
        summary={currentResume?.summary || profile.summary || ""}
        skills={skillsArray.join(", ")}
        educationLevelDefault={profile.educationLevel || "MEDIO"}
        experiences={
          currentResume?.experiences?.length
            ? currentResume.experiences.map((e) => ({
                company: e.company,
                position: e.position,
                description: e.description || "",
                isCurrent: e.isCurrent,
              }))
            : []
        }
        educations={
          currentResume?.educations?.length
            ? currentResume.educations.map((e) => ({
                institution: e.institution,
                course: e.course,
                level: e.level,
              }))
            : []
        }
        courses={
          currentResume?.courses?.length
            ? currentResume.courses.map((c) => ({
                title: c.title,
                institution: c.institution,
              }))
            : []
        }
      />
    </div>
  );
}
