export type UserRole =
  | "VISITOR"
  | "CANDIDATE"
  | "COMPANY_MEMBER"
  | "ASSISTED_OPERATOR"
  | "ACA_ADMIN"
  | "MUNICIPAL_ADMIN"
  | "SUPER_ADMIN";

export const ROLES = {
  VISITOR: "VISITOR" as UserRole,
  CANDIDATE: "CANDIDATE" as UserRole,
  COMPANY_MEMBER: "COMPANY_MEMBER" as UserRole,
  ASSISTED_OPERATOR: "ASSISTED_OPERATOR" as UserRole,
  ACA_ADMIN: "ACA_ADMIN" as UserRole,
  MUNICIPAL_ADMIN: "MUNICIPAL_ADMIN" as UserRole,
  SUPER_ADMIN: "SUPER_ADMIN" as UserRole,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  VISITOR: "Visitante",
  CANDIDATE: "Candidato(a)",
  COMPANY_MEMBER: "Empresa",
  ASSISTED_OPERATOR: "Operador(a) de Atendimento",
  ACA_ADMIN: "Administrador(a) ACA",
  MUNICIPAL_ADMIN: "Administrador(a) Municipal",
  SUPER_ADMIN: "Super Administrador(a)",
};

/** ACA, Prefeitura ou Super — operação geral (vagas, candidatos, empresas). */
export function isAdmin(role?: string): boolean {
  return role === "ACA_ADMIN" || role === "MUNICIPAL_ADMIN" || role === "SUPER_ADMIN";
}

/** Prefeitura, Super ou ACA — governança ampliada (cursos, usuários, LGPD, indicadores). */
export function isMunicipalOrSuperAdmin(role?: string): boolean {
  return (
    role === "MUNICIPAL_ADMIN" ||
    role === "SUPER_ADMIN" ||
    role === "ACA_ADMIN"
  );
}

/** ERS: só ACA/Prefeitura cadastram e gerenciam vagas (empresa não cria). */
export function canManageJobs(role?: string): boolean {
  return isAdmin(role);
}

export function canEditJobAsCompany(role?: string): boolean {
  return role === "COMPANY_MEMBER";
}

export function canPerformAssistedService(role?: string): boolean {
  return role === "ASSISTED_OPERATOR" || isAdmin(role);
}

export function canRegisterCompany(role?: string): boolean {
  return role === "ASSISTED_OPERATOR" || isAdmin(role);
}

export function canPublishJobDirectly(role?: string): boolean {
  return isAdmin(role);
}

export function canViewAllCandidates(role?: string): boolean {
  return isAdmin(role) || role === "ASSISTED_OPERATOR";
}

/** Cursos: ACA e Prefeitura. */
export function canManageCourses(role?: string): boolean {
  return isAdmin(role);
}

export function canViewIndicators(role?: string): boolean {
  return isAdmin(role);
}

/** Exclusão de currículo / LGPD: ACA e Prefeitura. */
export function canDeleteCurriculum(role?: string): boolean {
  return isAdmin(role);
}

/** Validação de currículo: ACA e Prefeitura. */
export function canValidateCurriculum(role?: string): boolean {
  return isAdmin(role);
}

/** Gestão de usuários administrativos: ACA e Prefeitura. */
export function canManageUsers(role?: string): boolean {
  return isAdmin(role);
}

/** Gestão de conteúdos e links: ACA e Prefeitura. */
export function canManageContent(role?: string): boolean {
  return isAdmin(role);
}

/** Configurações do portal: ACA e Prefeitura. */
export function canManageSiteSettings(role?: string): boolean {
  return isAdmin(role);
}
