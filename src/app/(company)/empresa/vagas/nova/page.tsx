import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

/** ERS RN025: empresa não cadastra vaga — ACA/Prefeitura cadastram. */
export default function NovaVagaEmpresaBloqueadaPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="rounded-2xl border border-[#E4E9E6] bg-white p-8 text-center shadow-sm">
        <Building2 className="mx-auto h-10 w-10 text-[#E65100]" />
        <h1 className="mt-3 text-xl font-extrabold text-[#1C1410]">Cadastro de vaga pela empresa</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57433C]">
          Pelo regulamento do portal, a empresa não cadastra vagas diretamente. Informe os dados da
          oportunidade à ACA ou à Sala do Empreendedor (Prefeitura).
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <Link
            href="/contato"
            className="inline-flex justify-center rounded-xl bg-[#E65100] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D84315]"
          >
            Ver contatos
          </Link>
          <Link
            href="/empresa/vagas"
            className="inline-flex justify-center rounded-xl border border-[#E4E9E6] px-5 py-2.5 text-sm font-bold text-[#1C1410] hover:bg-[#F3F5F4]"
          >
            Minhas vagas
          </Link>
        </div>
      </div>
    </div>
  );
}
