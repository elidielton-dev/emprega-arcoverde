const test = require("node:test");
const assert = require("node:assert");

function isAdmin(role) {
  return role === "ACA_ADMIN" || role === "MUNICIPAL_ADMIN" || role === "SUPER_ADMIN";
}

function isMunicipalOrSuperAdmin(role) {
  return role === "MUNICIPAL_ADMIN" || role === "SUPER_ADMIN";
}

function canManageJobs(role) {
  return isAdmin(role);
}

function canManageCourses(role) {
  return isMunicipalOrSuperAdmin(role);
}

function canViewIndicators(role) {
  return isMunicipalOrSuperAdmin(role);
}

function canDeleteCurriculum(role) {
  return isMunicipalOrSuperAdmin(role);
}

function canValidateCurriculum(role) {
  return isAdmin(role);
}

const COMPANY_JOB_EDIT_WINDOW_MS = 12 * 60 * 60 * 1000;

function isWithinCompanyEditWindow(createdAt, now = new Date()) {
  return now.getTime() - createdAt.getTime() <= COMPANY_JOB_EDIT_WINDOW_MS;
}

test("RBAC: empresa não cadastra vagas; ACA/Prefeitura cadastram", () => {
  assert.strictEqual(canManageJobs("COMPANY_MEMBER"), false);
  assert.strictEqual(canManageJobs("ACA_ADMIN"), true);
  assert.strictEqual(canManageJobs("MUNICIPAL_ADMIN"), true);
});

test("RBAC: cursos e indicadores só Prefeitura/Super", () => {
  assert.strictEqual(canManageCourses("ACA_ADMIN"), false);
  assert.strictEqual(canViewIndicators("ACA_ADMIN"), false);
  assert.strictEqual(canManageCourses("MUNICIPAL_ADMIN"), true);
  assert.strictEqual(canViewIndicators("SUPER_ADMIN"), true);
});

test("RBAC: exclusão de currículo só Prefeitura; validação ACA permitida", () => {
  assert.strictEqual(canDeleteCurriculum("ACA_ADMIN"), false);
  assert.strictEqual(canDeleteCurriculum("MUNICIPAL_ADMIN"), true);
  assert.strictEqual(canValidateCurriculum("ACA_ADMIN"), true);
  assert.strictEqual(isAdmin("ASSISTED_OPERATOR"), false);
});

test("Janela de 12h: empresa edita só dentro do prazo", () => {
  const createdAt = new Date("2026-08-20T10:00:00.000Z");
  assert.strictEqual(
    isWithinCompanyEditWindow(createdAt, new Date("2026-08-20T21:59:00.000Z")),
    true,
  );
  assert.strictEqual(
    isWithinCompanyEditWindow(createdAt, new Date("2026-08-20T22:00:01.000Z")),
    false,
  );
});
