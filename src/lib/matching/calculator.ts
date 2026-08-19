export interface CandidateMatchInput {
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  categorySlug?: string | null;
  interestCategories?: string[] | null;
}

export interface JobMatchInput {
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  requiredSkills?: string[] | null;
  categorySlug?: string | null;
  experienceRequired?: string | null;
}

export interface MatchResult {
  score: number; // 0 to 100
  explanations: string[];
}

const EDUCATION_HIERARCHY: Record<string, number> = {
  FUNDAMENTAL: 1,
  MEDIO: 2,
  TECNICO: 3,
  SUPERIOR: 4,
  POS: 5,
};

const DRIVER_LICENSE_HIERARCHY: Record<string, string[]> = {
  NENHUMA: [],
  A: ["A", "AB"],
  B: ["B", "AB", "C", "D", "E"],
  AB: ["AB"],
  C: ["C", "D", "E"],
  D: ["D", "E"],
  E: ["E"],
};

export function calculateJobMatch(
  candidate: CandidateMatchInput,
  job: JobMatchInput
): MatchResult {
  let score = 0;
  const explanations: string[] = [];

  // 1. Categoria de interesse (30 pts)
  if (job.categorySlug && candidate.interestCategories?.length) {
    if (candidate.interestCategories.includes(job.categorySlug)) {
      score += 30;
      explanations.push("Você indicou interesse direto nesta área profissional (+30 pts)");
    }
  } else if (job.categorySlug && candidate.categorySlug === job.categorySlug) {
    score += 30;
    explanations.push("Sua área principal corresponde à vaga (+30 pts)");
  } else {
    // Parcial neutro para vagas gerais
    score += 10;
  }

  // 2. Habilidades exigidas atendidas (25 pts)
  const jobSkills = (job.requiredSkills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const candSkills = (candidate.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);

  if (jobSkills.length === 0) {
    score += 25;
    explanations.push("Não há requisitos técnicos excludentes para esta vaga (+25 pts)");
  } else {
    const matched = jobSkills.filter((js) => candSkills.some((cs) => cs.includes(js) || js.includes(cs)));
    const skillRatio = matched.length / jobSkills.length;
    const skillPoints = Math.round(skillRatio * 25);
    score += skillPoints;
    if (matched.length > 0) {
      explanations.push(
        `Você possui ${matched.length} de ${jobSkills.length} habilidades desejadas (+${skillPoints} pts)`
      );
    }
  }

  // 3. Escolaridade compatível (20 pts)
  const jobEduRank = EDUCATION_HIERARCHY[job.educationLevel || "MEDIO"] || 2;
  const candEduRank = EDUCATION_HIERARCHY[candidate.educationLevel || "MEDIO"] || 2;

  if (candEduRank >= jobEduRank) {
    score += 20;
    explanations.push("Sua escolaridade atende ao requisito da vaga (+20 pts)");
  } else {
    const diff = jobEduRank - candEduRank;
    const partial = Math.max(0, 20 - diff * 10);
    score += partial;
    if (partial > 0) {
      explanations.push("Escolaridade parcialmente compatível");
    }
  }

  // 4. Localidade (10 pts)
  const jobCity = (job.city || "Arcoverde").toLowerCase().trim();
  const candCity = (candidate.city || "Arcoverde").toLowerCase().trim();

  if (jobCity === candCity || candCity.includes("arcoverde") || jobCity === "remoto") {
    score += 10;
    explanations.push("Sua cidade/localidade é compatível com a vaga (+10 pts)");
  } else {
    score += 5; // Municípios vizinhos do Moxotó/Ipanema
    explanations.push("Localidade acessível na região (+5 pts)");
  }

  // 5. Carteira de Habilitação (CNH) (10 pts)
  const reqLicense = job.driverLicense || "NENHUMA";
  const candLicense = candidate.driverLicense || "NENHUMA";

  if (reqLicense === "NENHUMA") {
    score += 10;
    explanations.push("Não exige CNH específica (+10 pts)");
  } else {
    const validLicenses = DRIVER_LICENSE_HIERARCHY[reqLicense] || [];
    if (validLicenses.includes(candLicense) || candLicense === reqLicense) {
      score += 10;
      explanations.push(`Sua CNH atende ao requisito (${reqLicense}) (+10 pts)`);
    } else {
      explanations.push(`Requer CNH categoria ${reqLicense}`);
    }
  }

  // 6. Experiência / cursos correlatos (5 pts)
  score += 5;
  explanations.push("Perfil profissional elegível para análise (+5 pts)");

  const finalScore = Math.min(100, Math.max(0, score));

  return {
    score: finalScore,
    explanations,
  };
}
