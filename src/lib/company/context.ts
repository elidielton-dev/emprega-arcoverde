import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { redirect } from "next/navigation";

/** Carrega sessão + empresa do membro logado (ou admin). */
export async function requireCompanyContext() {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
    redirect("/entrar");
  }

  let membership = await prisma.companyMember.findFirst({
    where: { userId: session.userId },
    include: { company: true },
  });

  // Admin sem membership: permite usar companyId da sessão se houver
  if (!membership && isAdmin(session.role) && session.companyId) {
    const company = await prisma.company.findUnique({ where: { id: session.companyId } });
    if (company) {
      return {
        session,
        company,
        membership: null as null,
      };
    }
  }

  if (!membership) {
    redirect(isAdmin(session.role) ? "/admin" : "/entrar");
  }

  return { session, company: membership.company, membership };
}

export async function getCompanyIdForSession() {
  const ctx = await requireCompanyContext();
  return ctx.company.id;
}
