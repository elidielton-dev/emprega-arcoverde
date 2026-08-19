import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { ArrowLeft } from "lucide-react";

export default async function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const session = await getSession();
  if (!session || !canRegisterCompany(session.role)) {
    redirect("/entrar");
  }

  const needsInstitution = session.role === "ASSISTED_OPERATOR" || session.role === "SUPER_ADMIN";
  const erro = searchParams.erro;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Link
          href="/admin/empresas"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar às empresas
        </Link>
        <h1 className="text-2xl font-black text-[#2E221F] tracking-tight">Cadastrar empresa</h1>
        <p className="text-xs text-[#78716c]">
          Registro institucional. A empresa não preenche este formulário.
        </p>
      </div>

      {erro === "dados_invalidos" && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Informe razão social e um CNPJ com 14 dígitos.
        </p>
      )}
      {erro === "cnpj_duplicado" && (
        <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          Já existe empresa cadastrada com este CNPJ.
        </p>
      )}

      <form action="/api/admin/companies" method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Razão social</label>
          <input name="name" required className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Nome fantasia</label>
          <input name="tradeName" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">CNPJ</label>
          <input name="cnpj" required placeholder="00.000.000/0001-00" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">E-mail</label>
            <input type="email" name="email" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Telefone</label>
            <input name="phone" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Endereço</label>
          <input name="address" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#57433C] mb-1">Cidade</label>
            <input name="city" defaultValue="Arcoverde" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">UF</label>
            <input name="state" defaultValue="PE" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Setor</label>
            <input name="sector" placeholder="Comércio, serviços..." className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Responsável</label>
            <input name="contactName" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Observações</label>
          <textarea name="notes" rows={3} className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
        </div>
        {needsInstitution && (
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Instituição que cadastra</label>
            <select name="createdByInstitution" className="w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm">
              <option value="PREFEITURA">Prefeitura</option>
              <option value="ACA">ACA</option>
            </select>
          </div>
        )}
        <button type="submit" className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl">
          Salvar cadastro
        </button>
      </form>
    </div>
  );
}
