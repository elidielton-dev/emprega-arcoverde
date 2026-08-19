import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Building2, ArrowLeft, Save, CheckCircle2, ShieldAlert } from "lucide-react";

interface EmpresaPerfilPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
  };
}

export default async function EmpresaPerfilPage({ searchParams }: EmpresaPerfilPageProps) {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && session.role !== "SUPER_ADMIN")) {
    redirect("/entrar");
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.userId },
    include: { company: true },
  });

  if (!membership) {
    redirect("/empresa");
  }

  const company = membership.company;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/empresa"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel da empresa</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Perfil da Empresa Contratante
        </h1>
        <p className="text-xs text-[#78716c]">
          Mantenha a razão social, CNPJ e canais de contato da sua empresa atualizados para a validação da ACA.
        </p>
      </div>

      {searchParams.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Dados da empresa atualizados com sucesso!</span>
        </div>
      )}

      <form action="/api/company/profile" method="POST" className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Nome Fantasia (Como a vaga aparece)</label>
            <input
              type="text"
              name="tradeName"
              defaultValue={company.tradeName || company.name}
              placeholder="Ex: Comercial Silva"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Razão Social / Nome Oficial *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={company.name}
              placeholder="Ex: Comércio Silva & Filhos Ltda"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              defaultValue={company.cnpj || ""}
              placeholder="00.000.000/0001-00"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Telefone Comercial / RH</label>
            <input
              type="text"
              name="phone"
              defaultValue={company.phone || ""}
              placeholder="(87) 3821-0000"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">E-mail do RH</label>
            <input
              type="email"
              name="email"
              defaultValue={company.email || ""}
              placeholder="rh@empresa.com.br"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#57433C] mb-1">Endereço Comercial</label>
            <input
              type="text"
              name="address"
              defaultValue={company.address || ""}
              placeholder="Av. Cel. Antônio Japiassu, Centro"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Cidade / UF</label>
            <input
              type="text"
              name="city"
              defaultValue={company.city || "Arcoverde"}
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Apresentação da Empresa</label>
          <textarea
            name="description"
            rows={4}
            defaultValue={company.description || ""}
            placeholder="Conte brevemente sobre o segmento, história e ambiente de trabalho da sua empresa..."
            className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
          />
        </div>

        <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF]">
          <label className="flex items-center gap-2 text-xs font-bold text-[#2E221F] cursor-pointer">
            <input
              type="checkbox"
              name="isConfidentialDefault"
              defaultChecked={company.isConfidentialDefault}
              className="rounded text-[#E65100] focus:ring-[#E65100]"
            />
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-[#E65100]" />
              <span>Publicar novas vagas como Confidenciais por padrão</span>
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Perfil da Empresa</span>
        </button>
      </form>
    </div>
  );
}
