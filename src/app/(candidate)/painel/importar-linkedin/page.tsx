import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AlertCircle, CheckCircle2, FileUp, Linkedin, Sparkles } from "lucide-react";

interface PageProps {
  searchParams: {
    erro?: string;
  };
}

export default async function ImportarLinkedInPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const erroMsg =
    searchParams.erro === "arquivo_obrigatorio"
      ? "Envie o PDF do LinkedIn ou cole o texto do perfil."
      : searchParams.erro === "arquivo_muito_grande"
        ? "Arquivo acima de 10 MB."
        : searchParams.erro === "parse_falhou"
          ? "Não foi possível ler o arquivo. Tente PDF ou cole o texto."
          : searchParams.erro
            ? "Não foi possível importar. Tente novamente."
            : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0A66C2] text-white">
          <Linkedin className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1C1410]">
            Importar currículo do LinkedIn
          </h1>
          <p className="text-sm text-[#78716c]">
            O LinkedIn libera só nome e e-mail no login. Para experiências, cargos e certificados,
            use o PDF do seu perfil.
          </p>
        </div>
      </div>

      {erroMsg && (
        <div className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      <div className="space-y-5 rounded-2xl border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <div className="rounded-xl bg-[#F4F5F7] p-4 text-sm text-[#4B5563]">
          <p className="mb-2 flex items-center gap-2 font-bold text-[#1C1410]">
            <Sparkles className="h-4 w-4 text-[#E65100]" />
            Como exportar no LinkedIn
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-xs leading-relaxed">
            <li>Abra seu perfil no LinkedIn (pelo celular ou computador).</li>
            <li>
              Em <strong>Mais</strong> / <strong>Recursos</strong>, escolha{" "}
              <strong>Salvar em PDF</strong> (ou “Save to PDF”).
            </li>
            <li>Envie esse PDF abaixo — importamos experiências, formação, cursos e competências.</li>
          </ol>
        </div>

        <form
          action="/api/candidate/linkedin-import"
          method="POST"
          encType="multipart/form-data"
          className="space-y-4"
        >
          <div>
            <label htmlFor="file" className="mb-1 block text-xs font-bold text-[#57433C]">
              PDF do perfil LinkedIn
            </label>
            <input
              id="file"
              name="file"
              type="file"
              accept=".pdf,.doc,.docx,.txt,application/pdf"
              className="block w-full text-xs text-[#57433C] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0A66C2] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white"
            />
          </div>

          <div>
            <label htmlFor="pastedText" className="mb-1 block text-xs font-bold text-[#57433C]">
              Ou cole o texto do perfil (opcional)
            </label>
            <textarea
              id="pastedText"
              name="pastedText"
              rows={6}
              placeholder="Cole aqui seções como Experiência, Formação, Certificações e Competências…"
              className="w-full rounded-xl border border-[#E6E8EB] px-3 py-2 text-xs text-[#1C1410] focus:border-[#0A66C2] focus:outline-none focus:ring-1 focus:ring-[#0A66C2]"
            />
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A66C2] py-3 text-sm font-bold text-white hover:bg-[#004182]"
          >
            <FileUp className="h-4 w-4" />
            Importar para meu currículo
          </button>
        </form>

        <div className="flex items-center justify-between gap-3 border-t border-[#E6E8EB] pt-4 text-xs">
          <p className="flex items-center gap-1.5 text-[#78716c]">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Você pode revisar e editar tudo depois em Currículo.
          </p>
          <Link href="/painel/curriculo" className="font-bold text-[#E65100] hover:underline">
            Pular por agora
          </Link>
        </div>
      </div>
    </div>
  );
}
