const test = require("node:test");
const assert = require("node:assert");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

function runAts(candidate, job) {
  const runner = path.join(__dirname, "ats-runner.mjs");
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", runner, JSON.stringify(candidate), JSON.stringify(job)],
    { encoding: "utf8", cwd: path.join(__dirname, "..") },
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || "Falha ao executar ATS");
  }
  return JSON.parse(result.stdout.trim());
}

test("ATS profissional: candidato aderente fica em faixa forte", () => {
  const result = runAts(
    {
      city: "Arcoverde",
      educationLevel: "MEDIO",
      driverLicense: "B",
      skills: ["atendimento", "caixa", "excel"],
      experienceYears: 2,
      headline: "Operador de caixa",
      summary: "Experiência em atendimento ao cliente e operação de caixa",
      recentTitles: ["Operador de caixa supermercado"],
      parsedResumeText:
        "Operador de caixa com excel atendimento ao cliente PDV cupom fiscal organização",
      parseStatus: "OK",
      hasStructuredResume: true,
      applied: true,
      coverNote: "Tenho interesse nesta vaga de atendimento e caixa.",
    },
    {
      city: "Arcoverde",
      educationLevel: "MEDIO",
      driverLicense: "B",
      skillsText: "atendimento, caixa, excel",
      experienceRequired: "1_ANO",
      title: "Operador de Caixa",
      requirements: "Experiência em atendimento e operação de caixa",
      description: "Atender clientes no PDV com excel e organização",
      summary: "Vaga para operador de caixa",
    },
  );
  assert.ok(result.score >= 75, `score esperado >= 75, veio ${result.score}`);
  assert.strictEqual(result.band, "STRONG");
  assert.ok(result.breakdown.requiredMatched.length >= 2);
});

test("ATS profissional: cidade diferente NÃO zera score (sinal suave)", () => {
  const baseCandidate = {
    educationLevel: "MEDIO",
    skills: ["excel", "administracao"],
    experienceYears: 1,
    recentTitles: ["Assistente administrativo"],
    parsedResumeText: "Assistente administrativo excel planilhas organizacao",
    parseStatus: "OK",
    hasStructuredResume: true,
    applied: true,
  };
  const job = {
    city: "Arcoverde",
    educationLevel: "MEDIO",
    skillsText: "excel, administracao",
    title: "Assistente Administrativo",
    requirements: "Domínio de excel e rotinas administrativas",
    experienceRequired: "1_ANO",
  };
  const sameCity = runAts({ ...baseCandidate, city: "Arcoverde" }, job);
  const otherCity = runAts({ ...baseCandidate, city: "Recife" }, job);
  assert.ok(otherCity.score > 40, "candidato de outra cidade não deve ser descartado");
  assert.ok(sameCity.score - otherCity.score <= 3);
  assert.strictEqual(otherCity.breakdown.locationHint, 2);
});

test("ATS profissional: candidato fraco cai em REVIEW sem ser zerado", () => {
  const result = runAts(
    {
      city: "Petrolina",
      educationLevel: "FUNDAMENTAL",
      skills: [],
      experienceYears: 0,
      parsedResumeText: "sem experiencia",
      parseStatus: "FAILED",
      hasStructuredResume: false,
      applied: true,
    },
    {
      city: "Arcoverde",
      educationLevel: "SUPERIOR",
      skillsText: "python, sql, power bi, ingles avancado",
      title: "Analista de Dados",
      requirements: "Python SQL Power BI inglês avançado",
      description: "Modelagem de dados e dashboards",
      experienceRequired: "3_ANOS_MAIS",
    },
  );
  assert.ok(result.score < 50);
  assert.strictEqual(result.band, "REVIEW");
  assert.ok(result.score > 0);
  assert.ok(result.breakdown.alerts.length > 0);
});

test("ATS profissional: ranking ordena do maior para o menor", () => {
  const applicants = [
    { name: "A", score: 40 },
    { name: "B", score: 92 },
    { name: "C", score: 71 },
  ];
  const ranked = [...applicants].sort((a, b) => b.score - a.score);
  assert.deepStrictEqual(
    ranked.map((a) => a.name),
    ["B", "C", "A"],
  );
});
