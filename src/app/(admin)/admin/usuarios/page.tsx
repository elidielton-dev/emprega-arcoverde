import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageUsers } from "@/lib/auth/rbac";
import { ArrowLeft } from "lucide-react";

export default async function AdminUsuariosPage({ searchParams }: { searchParams: { erro?: string; sucesso?: string } }) {
  const session = await getSession();
  if (!session || !canManageUsers(session.role)) {
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

      <form action="/api/admin/users" method="POST" className="bg-white rounded-3xl p-6 border border-[#FEEDDF] space-y-4">
        <h2 className="text-base font-bold text-[#2E221F]">Criar acesso administrativo</h2>
        {searchParams.erro && (
          <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
            {searchParams.erro === "email_existente" ? "Este e-mail já está cadastrado." : "Revise os dados. A senha deve ter pelo menos 8 caracteres."}
          </p>
        )}
        {searchParams.sucesso && <p className="text-sm text-emerald-800">Operação concluída com sucesso.</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-xs font-bold text-[#57433C]">Nome<input name="name" required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" /></label>
          <label className="text-xs font-bold text-[#57433C]">E-mail<input name="email" type="email" required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" /></label>
          <label className="text-xs font-bold text-[#57433C]">Senha inicial<input name="password" type="password" minLength={8} required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" /></label>
          <label className="text-xs font-bold text-[#57433C]">
            Papel
            <select name="role" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] bg-white text-base">
              <option value="ASSISTED_OPERATOR">Operador de Atendimento</option>
              <option value="ACA_ADMIN">Administrador ACA</option>
              <option value="MUNICIPAL_ADMIN">Administrador Municipal</option>
            </select>
          </label>
        </div>
        <button className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm px-5 py-3 rounded-xl">Criar usuário</button>
      </form>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#FEEDDF] text-[#78716c] font-bold">
              <tr>
                <th className="pb-3">Nome</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">Papel / Nível</th>
                <th className="pb-3">Criado em</th>
                <th className="pb-3 text-right">Ações</th>
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
                  <td className="py-3 text-right">
                    {u.id !== session.userId && ["ASSISTED_OPERATOR", "ACA_ADMIN", "MUNICIPAL_ADMIN"].includes(u.role) && (
                      <form action={`/api/admin/users/${u.id}`} method="POST">
                        <input type="hidden" name="_method" value="DELETE" />
                        <button className="font-bold text-red-700 hover:underline">Excluir</button>
                      </form>
                    )}
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
