import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { ArrowLeft } from "lucide-react";
import { CompanyRegisterForm } from "@/components/admin/CompanyRegisterForm";

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
          Registro institucional. Digite o CNPJ para preencher os dados automaticamente.
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

      <CompanyRegisterForm needsInstitution={needsInstitution} />
    </div>
  );
}
