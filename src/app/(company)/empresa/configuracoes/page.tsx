import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { SettingsBoard } from "@/components/company/SettingsBoard";

export default async function EmpresaConfiguracoesPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string; tab?: string };
}) {
  const { company, membership, session } = await requireCompanyContext();

  const members = await prisma.companyMember.findMany({
    where: { companyId: company.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const canManageMembers =
    session.role !== "COMPANY_MEMBER" ||
    membership?.role === "OWNER" ||
    membership?.role === "ADMIN";

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
      members={members.map((m) => ({
        id: m.id,
        role: m.role,
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
      }))}
      canManageMembers={Boolean(canManageMembers)}
      initialTab={searchParams.tab}
      sucesso={Boolean(searchParams.sucesso)}
      erro={searchParams.erro}
    />
  );
}
