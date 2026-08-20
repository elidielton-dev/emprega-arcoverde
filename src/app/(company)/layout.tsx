import React from "react";
import { CompanyShell } from "@/components/company/CompanyShell";
import { requireCompanyContext } from "@/lib/company/context";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await requireCompanyContext();

  return (
    <CompanyShell
      companyName={company.tradeName || company.name}
      userName={session.name || session.email}
      userRoleLabel={session.role === "COMPANY_MEMBER" ? "Membro da empresa" : "Administração"}
    >
      {children}
    </CompanyShell>
  );
}
