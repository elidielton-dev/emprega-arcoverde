import React from "react";
import { requireCompanyContext } from "@/lib/company/context";
import { SettingsBoard } from "@/components/company/SettingsBoard";

export default async function EmpresaConfiguracoesPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const { company } = await requireCompanyContext();

  return (
    <SettingsBoard
      company={{
        name: company.name,
        tradeName: company.tradeName,
        cnpj: company.cnpj,
        phone: company.phone,
        email: company.email,
        address: company.address,
        city: company.city,
        description: company.description,
        isConfidentialDefault: company.isConfidentialDefault,
      }}
      sucesso={Boolean(searchParams.sucesso)}
      erro={searchParams.erro}
    />
  );
}
