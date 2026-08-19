const test = require("node:test");
const assert = require("node:assert");

// Simulação da função determinística de compatibilidade
function calculateJobMatch(candidate, job) {
  let score = 0;
  const explanations = [];

  const EDUCATION_HIERARCHY = {
    FUNDAMENTAL: 1,
    MEDIO: 2,
    TECNICO: 3,
    SUPERIOR: 4,
    POS: 5,
  };

  // 1. Categoria (30 pts)
  if (job.categorySlug && candidate.categorySlug === job.categorySlug) {
    score += 30;
    explanations.push("Sua área principal corresponde à vaga (+30 pts)");
  } else {
    score += 10;
  }

  // 2. Habilidades (25 pts)
  const jobSkills = (job.requiredSkills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const candSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

  if (jobSkills.length === 0) {
    score += 25;
    explanations.push("Sem requisitos excludentes (+25 pts)");
  } else {
    const matched = jobSkills.filter((js) => candSkills.some((cs) => cs.includes(js) || js.includes(cs)));
    const skillRatio = matched.length / jobSkills.length;
    const skillPoints = Math.round(skillRatio * 25);
    score += skillPoints;
    if (matched.length > 0) {
      explanations.push(`Você possui ${matched.length} de ${jobSkills.length} habilidades (+${skillPoints} pts)`);
    }
  }

  // 3. Escolaridade (20 pts)
  const jobEduRank = EDUCATION_HIERARCHY[job.educationLevel || "MEDIO"] || 2;
  const candEduRank = EDUCATION_HIERARCHY[candidate.educationLevel || "MEDIO"] || 2;

  if (candEduRank >= jobEduRank) {
    score += 20;
    explanations.push("Sua escolaridade atende ao requisito (+20 pts)");
  }

  // 4. Localidade (10 pts)
  if ((candidate.city || "").toLowerCase() === (job.city || "").toLowerCase()) {
    score += 10;
    explanations.push("Localidade compatível (+10 pts)");
  } else {
    score += 5;
  }

  // 5. CNH (10 pts)
  if (job.driverLicense === "NENHUMA" || !job.driverLicense) {
    score += 10;
    explanations.push("Não exige CNH (+10 pts)");
  } else if (candidate.driverLicense === job.driverLicense) {
    score += 10;
    explanations.push("CNH atende ao requisito (+10 pts)");
  }

  // 6. Base geral
  score += 5;

  return {
    score: Math.min(100, Math.max(0, score)),
    explanations,
  };
}

test("Cálculo de compatibilidade com candidato 100% aderente", () => {
  const candidate = {
    categorySlug: "administracao",
    skills: ["Excel", "Atendimento", "Notas Fiscais"],
    educationLevel: "SUPERIOR",
    city: "Arcoverde",
    driverLicense: "B",
  };

  const job = {
    categorySlug: "administracao",
    requiredSkills: ["Excel", "Atendimento"],
    educationLevel: "MEDIO",
    city: "Arcoverde",
    driverLicense: "NENHUMA",
  };

  const result = calculateJobMatch(candidate, job);
  assert.strictEqual(result.score, 100);
  assert.ok(result.explanations.length >= 4);
});

test("Cálculo de compatibilidade com candidato sem habilidades específicas", () => {
  const candidate = {
    categorySlug: "comercio",
    skills: [],
    educationLevel: "FUNDAMENTAL",
    city: "Pesqueira",
    driverLicense: "NENHUMA",
  };

  const job = {
    categorySlug: "administracao",
    requiredSkills: ["Excel Avançado", "ERP SAP"],
    educationLevel: "SUPERIOR",
    city: "Arcoverde",
    driverLicense: "B",
  };

  const result = calculateJobMatch(candidate, job);
  assert.ok(result.score < 50);
});
