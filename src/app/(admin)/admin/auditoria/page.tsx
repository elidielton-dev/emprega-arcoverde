import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageUsers, isAdmin, isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";

export default async function AuditoriaPage() {
  const session = await getSession();
  if (!session || (!canManageUsers(session.role) && !isAdmin(session.role))) redirect("/admin");

  const [logs, deletionRequests] = await Promise.all([
    prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    isMunicipalOrSuperAdmin(session.role)
      ? prisma.deletionRequest.findMany({
          where: { status: "PENDING" },
          include: { user: { select: { name: true, email: true } } },
          orderBy: { requestedAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <div>
        <Link href="/admin" className="text-xs font-bold text-[#E65100]">← Voltar ao painel</Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] mt-2">Auditoria administrativa</h1>
        <p className="text-sm text-[#78716c]">Registro das ações recentes realizadas na plataforma.</p>
      </div>

      {deletionRequests.length > 0 && (
        <section className="bg-white rounded-3xl border border-amber-200 p-6 space-y-4">
          <h2 className="text-base font-bold text-[#2E221F]">Solicitações de exclusão pendentes</h2>
          {deletionRequests.map((request) => (
            <form key={request.id} action={`/api/admin/privacy/deletion/${request.id}`} method="POST" className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-center border-t border-[#FEEDDF] pt-4">
              <div className="text-sm"><strong>{request.user.name}</strong><span className="block text-xs text-[#78716c]">{request.user.email}</span></div>
              <input name="notes" placeholder="Observação do processamento" className="px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm" />
              <button name="action" value="PROCESS" className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-bold">Processar exclusão</button>
              <button name="action" value="REJECT" className="px-4 py-2 rounded-xl border border-[#FEEDDF] text-xs font-bold">Rejeitar</button>
            </form>
          ))}
        </section>
      )}

      <section className="bg-white rounded-3xl border border-[#FEEDDF] overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#FFF8F2] text-[#57433C]">
            <tr><th className="p-4">Data</th><th className="p-4">Usuário</th><th className="p-4">Ação</th><th className="p-4">Recurso</th></tr>
          </thead>
          <tbody className="divide-y divide-[#FEEDDF]">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-4 whitespace-nowrap text-[#78716c]">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                <td className="p-4 font-semibold text-[#2E221F]">{log.user?.name || "Sistema/usuário removido"}</td>
                <td className="p-4 text-[#57433C]">{log.action}</td>
                <td className="p-4 text-[#57433C]">{log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ""}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-[#78716c]">Nenhum registro de auditoria.</td></tr>}
          </tbody>
        </table>
      </section>
    </main>
  );
}
