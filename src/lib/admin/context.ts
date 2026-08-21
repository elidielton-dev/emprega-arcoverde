import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  ROLE_LABELS,
  canManageCourses,
  canManageContent,
  canManageSiteSettings,
  canManageUsers,
  canPerformAssistedService,
  canRegisterCompany,
  canViewAllCandidates,
  canViewIndicators,
  isAdmin,
  type UserRole,
} from "@/lib/auth/rbac";

export type AdminNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  group?: "operation" | "governance";
};

export type AdminContext = {
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
  orgLabel: string;
  orgHint: string;
  roleLabel: string;
  navItems: AdminNavItem[];
};

function orgFromRole(role: string): { orgLabel: string; orgHint: string } {
  switch (role) {
    case "ACA_ADMIN":
      return { orgLabel: "ACA — Associação Comercial", orgHint: "Painel institucional" };
    case "MUNICIPAL_ADMIN":
      return { orgLabel: "Prefeitura de Arcoverde", orgHint: "Governança municipal" };
    case "SUPER_ADMIN":
      return { orgLabel: "Super administração", orgHint: "Governança municipal" };
    case "ASSISTED_OPERATOR":
      return { orgLabel: "Sala do Empreendedor", orgHint: "Atendimento presencial" };
    default:
      return { orgLabel: "Emprega Arcoverde", orgHint: "Painel institucional" };
  }
}

/**
 * Menu filtrado por papel.
 */
export function buildAdminNav(role: string): AdminNavItem[] {
  const items: AdminNavItem[] = [
    { href: "/admin", label: "Visão geral", exact: true, group: "operation" },
  ];

  if (isAdmin(role)) {
    items.push({ href: "/admin/vagas", label: "Vagas", group: "operation" });
  }
  if (canRegisterCompany(role)) {
    items.push({ href: "/admin/empresas", label: "Empresas parceiras", group: "operation" });
  }
  if (canViewAllCandidates(role)) {
    items.push({ href: "/admin/candidatos", label: "Candidatos", group: "operation" });
  }
  if (canPerformAssistedService(role)) {
    items.push({
      href: "/admin/atendimento-assistido",
      label: "Atendimento assistido",
      group: "operation",
    });
  }
  if (canManageSiteSettings(role)) {
    items.push({ href: "/admin/configuracoes", label: "Configurações", group: "governance" });
  }
  if (canManageContent(role)) {
    items.push({ href: "/admin/conteudos", label: "Conteúdos", group: "governance" });
    items.push({ href: "/admin/links-uteis", label: "Links úteis", group: "governance" });
  }
  if (canManageCourses(role)) {
    items.push({ href: "/admin/cursos", label: "Cursos", group: "governance" });
  }
  if (canViewIndicators(role)) {
    items.push({ href: "/admin/indicadores", label: "Indicadores", group: "governance" });
  }
  if (canManageUsers(role)) {
    items.push({ href: "/admin/usuarios", label: "Usuários", group: "governance" });
  }
  if (isAdmin(role)) {
    items.push({ href: "/admin/auditoria", label: "Auditoria", group: "governance" });
  }

  return items;
}

export async function requireAdminContext(): Promise<AdminContext> {
  const session = await getSession();
  if (!session || (!isAdmin(session.role) && session.role !== "ASSISTED_OPERATOR")) {
    redirect("/entrar");
  }

  const { orgLabel, orgHint } = orgFromRole(session.role);
  const roleLabel = ROLE_LABELS[session.role as UserRole] || session.role;

  return {
    session,
    orgLabel,
    orgHint,
    roleLabel,
    navItems: buildAdminNav(session.role),
  };
}
