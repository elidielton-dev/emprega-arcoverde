import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageUsers, isAdmin, isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";
import { PageHeader, StatusPill, SurfaceCard } from "@/components/admin/ui";

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
    <div className="space-y-5">
      <PageHeader
        title="Auditoria administrativa"
        description="Registro das ações recentes e solicitações de privacidade (LGPD)."
      />

      {deletionRequests.length > 0 && (
        <SurfaceCard className="space-y-4 border-amber-200 p-5">
          <h2 className="text-sm font-bold text-[#1C1410]">Solicitações de exclusão pendentes</h2>
          {deletionRequests.map((request) => (
            <form
              key={request.id}
              action={`/api/admin/privacy/deletion/${request.id}`}
              method="POST"
              className="grid items-center gap-3 border-t border-[#E6E8EB] pt-4 sm:grid-cols-[1fr_1fr_auto_auto]"
            >
              <div className="text-sm">
                <strong className="text-[#1C1410]">{request.user.name}</strong>
                <span className="block text-xs text-[#78716c]">{request.user.email}</span>
              </div>
              <input
                name="notes"
                placeholder="Observação do processamento"
                className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
              <button
                name="action"
                value="PROCESS"
                className="rounded-md bg-red-700 px-4 py-2 text-xs font-bold text-white"
              >
                Processar exclusão
              </button>
              <button
                name="action"
                value="REJECT"
                className="rounded-md border border-[#E6E8EB] px-4 py-2 text-xs font-bold"
              >
                Rejeitar
              </button>
            </form>
          ))}
        </SurfaceCard>
      )}

      <SurfaceCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#E6E8EB] bg-[#F4F5F7] text-xs text-[#78716c]">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Usuário</th>
                <th className="px-4 py-3 font-semibold">Ação</th>
                <th className="px-4 py-3 font-semibold">Recurso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E8EB]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F4F5F7]">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#78716c]">
                    {new Date(log.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-[#1C1410]">
                    {log.user?.name || "Sistema"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <StatusPill label={log.action} tone="neutral" />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#57433C]">
                    {log.resourceType}
                    {log.resourceId ? ` · ${log.resourceId}` : ""}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-xs text-[#78716c]">
                    Nenhum registro de auditoria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SurfaceCard>
    </div>
  );
}
