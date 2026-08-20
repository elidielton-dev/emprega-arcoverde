import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { formatCnpj } from "@/lib/company/cnpj";
import { CompaniesBoard, type CompanyRow } from "@/components/admin/CompaniesBoard";

export default async function AdminEmpresasPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const session = await getSession();
  if (!session || !canRegisterCompany(session.role)) {
    redirect("/entrar");
  }

  const companies = await prisma.company.findMany({
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { jobs: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: CompanyRow[] = companies.map((c) => ({
    id: c.id,
    name: c.name,
    tradeName: c.tradeName,
    cnpj: c.cnpj ? formatCnpj(c.cnpj) : null,
    email: c.email,
    phone: c.phone,
    website: c.website,
    city: c.city,
    state: c.state,
    address: c.address,
    status: c.status,
    createdByInstitution: c.createdByInstitution,
    createdByName: c.createdBy?.name || null,
    jobsCount: c._count.jobs,
    membersCount: c._count.members,
    isVerified: c.isVerified,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <CompaniesBoard companies={rows} success={searchParams.sucesso === "cadastrada"} />
  );
}
