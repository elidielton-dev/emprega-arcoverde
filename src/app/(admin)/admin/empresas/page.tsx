import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { Building2, ArrowLeft, CheckCircle2, ShieldAlert, MapPin, Phone, Mail, Briefcase } from "lucide-react";

export default async function AdminEmpresasPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { jobs: true, members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel de governança</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Empresas Parceiras Cadastradas
        </h1>
        <p className="text-xs text-[#78716c]">
          Gestão de empresas locais, validação de CNPJ e moderação de perfis corporativos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((comp) => (
          <div
            key={comp.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {comp.isVerified ? "Verificada pela ACA" : "Pendente"}
                </span>
                {comp.isConfidentialDefault && (
                  <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-semibold">
                    Confidencial
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-[#2E221F] leading-snug">
                {comp.tradeName || comp.name}
              </h3>

              {comp.tradeName && (
                <p className="text-xs text-[#78716c]">{comp.name}</p>
              )}

              <p className="text-xs text-[#57433C] line-clamp-2">
                {comp.description || "Sem descrição informada."}
              </p>

              <div className="space-y-1 pt-2 text-xs text-[#78716c]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                  <span>{comp.city} - {comp.state}</span>
                </div>
                {comp.cnpj && (
                  <div>
                    <span className="font-semibold text-[#57433C]">CNPJ:</span> {comp.cnpj}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#FEEDDF] flex items-center justify-between text-xs text-[#78716c]">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-[#E65100]" />
                <strong>{comp._count.jobs}</strong> vagas cadastradas
              </span>
              <span>{comp._count.members} gestores</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
