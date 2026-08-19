import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { Building2, ArrowLeft, MapPin, Briefcase, Plus } from "lucide-react";
import { formatCnpj } from "@/lib/company/cnpj";

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao painel de governança</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Empresas cadastradas
          </h1>
          <p className="text-xs text-[#78716c]">
            Só ACA e Prefeitura cadastram empresa. A empresa não cria o próprio registro.
          </p>
        </div>
        <Link
          href="/admin/empresas/nova"
          className="inline-flex items-center justify-center gap-2 bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-5 py-3 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Cadastrar empresa
        </Link>
      </div>

      {searchParams.sucesso === "cadastrada" && (
        <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          Empresa cadastrada com auditoria do operador.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                {comp.createdByInstitution && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded border bg-[#FFF4EA] text-[#E65100] border-[#FEEDDF]">
                    {comp.createdByInstitution}
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-[#2E221F] leading-snug">
                {comp.tradeName || comp.name}
              </h3>
              {comp.tradeName && <p className="text-xs text-[#78716c]">{comp.name}</p>}

              <div className="space-y-1 pt-2 text-xs text-[#78716c]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                  <span>
                    {comp.city} - {comp.state}
                  </span>
                </div>
                {comp.cnpj && (
                  <div>
                    <span className="font-semibold text-[#57433C]">CNPJ:</span> {formatCnpj(comp.cnpj)}
                  </div>
                )}
                {comp.createdBy && <p>Cadastrada por {comp.createdBy.name}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-[#FEEDDF]">
              <div className="flex items-center justify-between text-xs text-[#78716c]">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-[#E65100]" />
                  <strong>{comp._count.jobs}</strong> vagas
                </span>
                <span>{comp._count.members} gestores</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="bg-white rounded-3xl border border-[#FEEDDF] p-10 text-center space-y-2">
          <Building2 className="w-10 h-10 text-[#E65100] mx-auto" />
          <p className="text-sm font-bold text-[#2E221F]">Nenhuma empresa cadastrada ainda</p>
        </div>
      )}
    </div>
  );
}
