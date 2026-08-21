/**
 * Auditoria estática de RBAC / menus / rotas (sem browser).
 * Garante que a matriz de permissões do código bate com o produto.
 */
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const root = path.join(__dirname, "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

describe("RBAC matriz de produto", () => {
  const rbac = read("src/lib/auth/rbac.ts");
  const middleware = read("src/middleware.ts");
  const adminNav = read("src/lib/admin/context.ts");
  const companyJobs = read("src/app/api/company/jobs/route.ts");

  it("empresa não cria vagas", () => {
    assert.match(companyJobs, /403/);
    assert.match(rbac, /canManageJobs[\s\S]*isAdmin/);
  });

  it("Sala não acessa módulos de governança no middleware", () => {
    assert.match(middleware, /admin\/indicadores/);
    assert.match(middleware, /admin\/vagas/);
    assert.match(middleware, /ASSISTED_OPERATOR/);
  });

  it("admin nav inclui CMS e links para isAdmin", () => {
    assert.match(adminNav, /canManageContent|conteudos/);
    assert.match(adminNav, /links-uteis/);
  });

  it("ACA e Prefeitura compartilham isAdmin", () => {
    assert.match(rbac, /ACA_ADMIN.*MUNICIPAL_ADMIN|isAdmin/);
    assert.ok(rbac.includes('role === "ACA_ADMIN"'));
    assert.ok(rbac.includes('role === "MUNICIPAL_ADMIN"'));
  });
});

describe("Nav pública expõe conteúdos e links", () => {
  it("Navbar e Footer linkam /conteudos e /links-uteis", () => {
    const nav = read("src/components/layout/Navbar.tsx");
    const footer = read("src/components/layout/Footer.tsx");
    assert.match(nav, /\/conteudos/);
    assert.match(nav, /\/links-uteis/);
    assert.match(footer, /\/conteudos/);
    assert.match(footer, /\/links-uteis/);
  });
});

describe("E-mail respeita preferências em entrevista", () => {
  it("agendar/reagendar usa sendEmailIfAllowed", () => {
    const create = read("src/app/api/company/interviews/route.ts");
    const update = read("src/app/api/company/interviews/[id]/route.ts");
    assert.match(create, /sendEmailIfAllowed/);
    assert.match(update, /sendEmailIfAllowed/);
  });
});

describe("LGPD remove arquivos do storage", () => {
  it("deletion processa tryDeleteFile", () => {
    const del = read("src/app/api/admin/privacy/deletion/[id]/route.ts");
    assert.match(del, /tryDeleteFile/);
  });
});
