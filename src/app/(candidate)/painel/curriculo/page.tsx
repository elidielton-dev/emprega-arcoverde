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
        orderBy: { versionNumber: "desc" },
        take: 1,
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    redirect("/painel/perfil");
  }

  const currentResume = profile.resumeVersions[0];
  let skillsArray: string[] = [];
  try {
    skillsArray = currentResume?.skillsSnapshot ? JSON.parse(currentResume.skillsSnapshot) : [];
  } catch {
    skillsArray = [];
  }

  const formKey = `${currentResume?.id || "new"}-v${currentResume?.versionNumber || 0}`;

  const errorMessage =
    searchParams.erro === "arquivo_obrigatorio"
      ? "Selecione um arquivo PDF ou DOCX antes de enviar."
      : searchParams.erro === "arquivo_muito_grande"
        ? "Arquivo acima de 5 MB."
        : searchParams.erro === "tipo_invalido"
          ? "Só aceitamos PDF ou DOCX."
          : searchParams.erro === "arquivo_corrompido"
            ? "Arquivo inválido ou corrompido. Envie um PDF/DOCX legítimo."
            : searchParams.erro === "rate_limit"
              ? "Muitos envios em pouco tempo. Aguarde e tente de novo (máx. 5 por hora)."
              : searchParams.erro === "limite_anexos"
                ? "Você atingiu o limite de anexos de currículo. Remova algum ou fale com o suporte."
                : searchParams.erro === "nao_curriculo"
                  ? "O arquivo não parece um currículo. Envie um PDF/DOCX com dados profissionais."
                  : searchParams.erro === "sem_texto"
                    ? "Não conseguimos ler texto no arquivo (PDF escaneado/imagem). Use PDF com texto ou DOCX."
                    : searchParams.erro
                      ? "Não foi possível enviar o currículo. Tente novamente com PDF ou DOCX."
                      : null;

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
            {searchParams.sucesso === "preenchido"
              ? "Arquivo aceito e formulário preenchido automaticamente. Revise abaixo e clique em Salvar se quiser ajustar."
              : searchParams.sucesso === "anexo_enviado"
                ? searchParams.aviso === "pouco_dado"
                  ? "Anexo salvo. Extraímos pouco dado estruturado — complete o formulário manualmente."
                  : "Anexo enviado com sucesso."
                : "Currículo atualizado com sucesso!"}
          </span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload primeiro → preenche o formulário abaixo */}
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        <div className="border-b border-[#FEEDDF] pb-3">
          <h2 className="text-base font-bold text-[#2E221F] flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#E65100]" />
            <span>Enviar currículo (PDF ou DOCX)</span>
          </h2>
          <p className="text-xs text-[#78716c] mt-1">
            Apenas PDF/DOCX (até 5 MB). Limitamos envios para evitar abuso. Ao enviar, preenchemos o formulário
            abaixo automaticamente.
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
        key={formKey}
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
