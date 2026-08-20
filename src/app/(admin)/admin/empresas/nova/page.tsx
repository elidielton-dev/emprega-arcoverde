import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
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
    <div className="space-y-4">
      {erro === "dados_invalidos" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Informe razão social e um CNPJ com 14 dígitos.
        </p>
      )}
      {erro === "cnpj_duplicado" && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Já existe empresa cadastrada com este CNPJ.
        </p>
      )}
      <CompanyRegisterForm
        needsInstitution={needsInstitution}
        operatorName={session.name || session.email}
      />
    </div>
  );
}
