import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";
import { Users, ArrowLeft, Shield, CheckCircle2 } from "lucide-react";

export default async function AdminUsuariosPage() {
  const session = await getSession();
  if (!session || !isMunicipalOrSuperAdmin(session.role)) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const roleNames: Record<string, string> = {
    MUNICIPAL_ADMIN: "Administrador Municipal",
    ACA_ADMIN: "Administrador ACA",
    ASSISTED_OPERATOR: "Operador de Atendimento",
    COMPANY_MEMBER: "Empresa",
    CANDIDATE: "Candidato",
    SUPER_ADMIN: "Super Admin",
  };

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
          Gestão de Usuários & Operadores
        </h1>
        <p className="text-xs text-[#78716c]">
          Controle de acessos, papéis (RBAC) e auditabilidade de operadores da Sala do Empreendedor e ACA.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#FEEDDF] text-[#78716c] font-bold">
              <tr>
                <th className="pb-3">Nome</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Papel / Nível</th>
                <th className="pb-3">Criado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FEEDDF]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#FFF8F2]">
                  <td className="py-3 font-semibold text-[#2E221F]">{u.name}</td>
                  <td className="py-3 text-[#57433C]">{u.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                      {roleNames[u.role] || u.role}
                    </span>
                  </td>
                  <td className="py-3 text-[#78716c]">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
