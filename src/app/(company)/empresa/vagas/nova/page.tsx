import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ArrowLeft, Building2 } from "lucide-react";

/** ERS RN025: empresa não cadastra vaga — ACA/Prefeitura cadastram. */
export default async function NovaVagaEmpresaBloqueadaPage() {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_MEMBER") {
    redirect("/entrar");
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
      <Link
        href="/empresa/vagas"
        className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-[#E65100]"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar às vagas
      </Link>

      <div className="bg-white rounded-3xl border border-[#FEEDDF] p-8 space-y-4 text-center">
        <Building2 className="w-10 h-10 text-[#E65100] mx-auto" />
        <h1 className="text-xl font-extrabold text-[#1A1A1A]">Cadastro de vaga pela empresa</h1>
        <p className="text-sm text-[#4B5563] leading-relaxed">
          Pelo regulamento do portal, a empresa não cadastra vagas diretamente. Informe os dados da
          oportunidade à ACA ou à Sala do Empreendedor (Prefeitura). A equipe autorizada registra e
          publica a vaga no painel.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/contato"
            className="inline-flex justify-center bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm px-5 py-2.5 rounded-full"
          >
            Ver contatos
          </Link>
          <Link
            href="/empresa/vagas"
            className="inline-flex justify-center border border-[#E6E8EB] text-[#1A1A1A] font-bold text-sm px-5 py-2.5 rounded-full hover:bg-[#F4F5F7]"
          >
            Minhas vagas
          </Link>
        </div>
      </div>
    </div>
  );
}
