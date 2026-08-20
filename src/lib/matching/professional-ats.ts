/**
 * Motor ATS profissional (determinístico, auditável).
 * Ranking assistido — não elimina candidatos automaticamente.
 */

export type AtsBand = "STRONG" | "ADEQUATE" | "REVIEW";

export interface AtsBreakdown {
  keywordCoverage: number;
  titleAlignment: number;
  experience: number;
  education: number;
  documentQuality: number;
  engagement: number;
  locationHint: number;
  requiredMatched: string[];
  requiredMissing: string[];
  preferredMatched: string[];
  preferredMissing: string[];
  alerts: string[];
  locationLabel: string;
  parseLabel: string;
  experienceYears: number;
}

export interface AtsResult {
  score: number;
  band: AtsBand;
  explanations: string[];
  breakdown: AtsBreakdown;
}

export interface AtsCandidateInput {
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  skills?: string[] | null;
  experienceYears?: number | null;
  headline?: string | null;
  summary?: string | null;
  recentTitles?: string[] | null;
  educationCourses?: string[] | null;
  coverNote?: string | null;
  parsedResumeText?: string | null;
  parseStatus?: string | null;
  hasStructuredResume?: boolean;
  applied?: boolean;
}

export interface AtsJobInput {
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  requirements?: string | null;
  skillsText?: string | null;
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  experienceRequired?: string | null;
  categoryName?: string | null;
}

const EDUCATION_HIERARCHY: Record<string, number> = {
  FUNDAMENTAL: 1,
  MEDIO: 2,
  TECNICO: 3,
  SUPERIOR: 4,
  POS: 5,
};

const EXPERIENCE_REQUIRED_YEARS: Record<string, number> = {
  SEM_EXPERIENCIA: 0,
  "6_MESES": 0.5,
  "1_ANO": 1,
  "2_ANOS": 2,
  "3_ANOS_MAIS": 3,
};

const STOPWORDS = new Set([
  "a", "o", "os", "as", "de", "da", "do", "das", "dos", "e", "em", "no", "na", "nos", "nas",
  "um", "uma", "para", "com", "por", "ao", "à", "ou", "se", "que", "como", "mais", "menos",
  "ser", "ter", "seu", "sua", "seus", "suas", "pela", "pelo", "pelos", "pelas", "entre",
  "sobre", "até", "após", "antes", "também", "já", "não", "sim", "the", "and", "for", "with",
  "vaga", "empresa", "candidato", "trabalho", "área", "anos", "ano", "meses", "mês",
]);

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/[\s,/|;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/** Extrai keywords da vaga: obrigatórias (requisitos/skills) e desejáveis (descrição). */
export function extractJobKeywords(job: AtsJobInput): { required: string[]; preferred: string[] } {
  const requiredSource = [job.skillsText || "", job.requirements || "", job.title || ""].join(" ");
  const preferredSource = [job.description || "", job.summary || "", job.categoryName || ""].join(" ");

  const requiredFreq = new Map<string, number>();
  for (const token of tokenize(requiredSource)) {
    requiredFreq.set(token, (requiredFreq.get(token) || 0) + 1);
  }

  const preferredFreq = new Map<string, number>();
  for (const token of tokenize(preferredSource)) {
    if (requiredFreq.has(token)) continue;
    preferredFreq.set(token, (preferredFreq.get(token) || 0) + 1);
  }

  // Skills explícitas (vírgula) entram como obrigatórias com prioridade
  const explicitSkills = (job.skillsText || "")
    .split(/[,;|/]/)
    .map((s) => normalizeText(s))
    .filter((s) => s.length >= 2);

  const required = Array.from(
    new Set([
      ...explicitSkills,
      ...Array.from(requiredFreq.entries())
        .filter(([, n]) => n >= 1)
        .sort((a, b) => b[1] - a[1])
        .map(([t]) => t)
        .slice(0, 20),
    ]),
  ).slice(0, 25);

  const preferred = Array.from(preferredFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([t]) => t)
    .filter((t) => !required.includes(t))
    .slice(0, 20);

  return { required, preferred };
}

function textContains(haystack: string, needle: string) {
  const h = normalizeText(haystack);
  const n = normalizeText(needle);
  if (!n) return false;
  if (h.includes(n)) return true;
  // match parcial para compostos curtos
  if (n.length >= 5 && h.split(" ").some((w) => w.includes(n) || n.includes(w))) return true;
  return false;
}

function titleSimilarity(jobTitle: string, candidateTitles: string[]): number {
  const jobTokens = new Set(tokenize(jobTitle));
  if (!jobTokens.size || !candidateTitles.length) return 0;
  let best = 0;
  for (const title of candidateTitles) {
    const candTokens = tokenize(title);
    if (!candTokens.length) continue;
    const hit = candTokens.filter((t) => jobTokens.has(t)).length;
    best = Math.max(best, hit / jobTokens.size);
  }
  return best;
}

export function getAtsBand(score: number): AtsBand {
  if (score >= 75) return "STRONG";
  if (score >= 50) return "ADEQUATE";
  return "REVIEW";
}

export function getAtsBandMeta(band: AtsBand) {
  if (band === "STRONG") {
    return { label: "Forte aderência", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" };
  }
  if (band === "ADEQUATE") {
    return { label: "Adequado para entrevista", bg: "bg-amber-50", text: "text-amber-900", border: "border-amber-200" };
  }
  return { label: "Revisar manualmente", bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" };
}

export function calculateProfessionalAts(candidate: AtsCandidateInput, job: AtsJobInput): AtsResult {
  const { required, preferred } = extractJobKeywords(job);
  const corpus = [
    candidate.parsedResumeText || "",
    candidate.headline || "",
    candidate.summary || "",
    ...(candidate.skills || []),
    ...(candidate.recentTitles || []),
    ...(candidate.educationCourses || []),
    candidate.coverNote || "",
  ].join(" \n ");

  const requiredMatched = required.filter((k) => textContains(corpus, k));
  const requiredMissing = required.filter((k) => !textContains(corpus, k));
  const preferredMatched = preferred.filter((k) => textContains(corpus, k));
  const preferredMissing = preferred.filter((k) => !textContains(corpus, k));

  // 1) Keywords 45
  let keywordCoverage = 0;
  const explanations: string[] = [];
  const alerts: string[] = [];

  if (required.length === 0 && preferred.length === 0) {
    keywordCoverage = 28;
    explanations.push("Vaga com poucos termos técnicos; cobertura textual parcial (+28)");
  } else {
    const reqRatio = required.length ? requiredMatched.length / required.length : 1;
    const prefRatio = preferred.length ? preferredMatched.length / preferred.length : 0;
    keywordCoverage = Math.round(reqRatio * 35 + prefRatio * 10);
    explanations.push(
      `Cobertura de requisitos: ${requiredMatched.length}/${Math.max(required.length, 1)} obrigatórios · ${preferredMatched.length}/${Math.max(preferred.length, 1)} desejáveis (+${keywordCoverage})`,
    );
    if (requiredMissing.length) {
      alerts.push(`Requisitos em aberto: ${requiredMissing.slice(0, 6).join(", ")}`);
    }
  }

  // 2) Title alignment 15
  const sim = titleSimilarity(job.title || "", [
    ...(candidate.recentTitles || []),
    candidate.headline || "",
  ].filter(Boolean) as string[]);
  const titleAlignment = Math.round(sim * 15);
  if (titleAlignment >= 10) {
    explanations.push(`Cargo/trajetória alinhada ao título da vaga (+${titleAlignment})`);
  } else if (titleAlignment > 0) {
    explanations.push(`Alinhamento parcial de cargo (+${titleAlignment})`);
  } else {
    explanations.push("Título da vaga pouco refletido nos cargos do currículo");
  }

  // 3) Experience 15
  const requiredYears = EXPERIENCE_REQUIRED_YEARS[job.experienceRequired || "SEM_EXPERIENCIA"] ?? 0;
  const years = candidate.experienceYears ?? 0;
  let experience = 0;
  if (requiredYears <= 0) {
    experience = years > 0 ? 15 : 10;
    explanations.push(years > 0 ? `Experiência declarada (~${years} ano(s)) (+${experience})` : "Sem exigência mínima de experiência (+10)");
  } else if (years >= requiredYears) {
    experience = 15;
    explanations.push(`Experiência (~${years} ano(s)) atende o pedido (+15)`);
  } else if (years > 0) {
    experience = Math.max(4, Math.round((years / requiredYears) * 15));
    explanations.push(`Experiência parcial (~${years}/${requiredYears} anos) (+${experience})`);
    alerts.push("Experiência abaixo do ideal — avaliar na entrevista");
  } else {
    experience = 3;
    explanations.push("Pouca experiência estruturada no currículo (+3)");
    alerts.push("Experiência não comprovada no currículo estruturado");
  }

  // 4) Education 10
  const jobEdu = EDUCATION_HIERARCHY[job.educationLevel || "MEDIO"] || 2;
  const candEdu = EDUCATION_HIERARCHY[candidate.educationLevel || "MEDIO"] || 2;
  let education = 0;
  if (candEdu >= jobEdu) {
    education = 10;
    explanations.push("Escolaridade atende ao requisito (+10)");
  } else {
    education = Math.max(2, 10 - (jobEdu - candEdu) * 3);
    explanations.push(`Escolaridade abaixo do pedido — sinal suave (+${education})`);
    alerts.push("Escolaridade abaixo do requisito formal — validar na entrevista");
  }

  // 5) Document quality 10
  let documentQuality = 0;
  let parseLabel = "Sem arquivo anexado";
  if (candidate.parseStatus === "OK" && (candidate.parsedResumeText || "").length > 120) {
    documentQuality = 10;
    parseLabel = "Arquivo do currículo parseado com sucesso";
    explanations.push("Currículo em arquivo lido pelo ATS (+10)");
  } else if (candidate.parseStatus === "OK") {
    documentQuality = 7;
    parseLabel = "Arquivo parseado (texto curto)";
    explanations.push("Arquivo parseado com pouco texto (+7)");
  } else if (candidate.hasStructuredResume) {
    documentQuality = 6;
    parseLabel = "Usando currículo estruturado do portal";
    explanations.push("Currículo estruturado no portal (+6)");
  } else if (candidate.parseStatus === "FAILED" || candidate.parseStatus === "UNSUPPORTED") {
    documentQuality = 2;
    parseLabel = "Arquivo não pôde ser lido automaticamente";
    alerts.push("Anexo presente, mas o ATS não conseguiu extrair texto — revise o arquivo");
    explanations.push("Arquivo ilegível para o parser (+2)");
  } else {
    documentQuality = 3;
    parseLabel = "Aguardando ou sem parse de arquivo";
    explanations.push("Sem texto de arquivo para cruzar (+3)");
  }

  // 6) Engagement 5 — candidatou-se conta
  let engagement = 0;
  if (candidate.applied !== false) engagement += 3;
  if ((candidate.coverNote || "").trim().length > 20) engagement += 2;
  explanations.push(
    engagement >= 5
      ? "Candidatura completa com mensagem (+5)"
      : "Candidatura registrada — interesse demonstrado (+3)",
  );

  // 7) Location soft 0-3 — NUNCA elimina
  const jobCity = normalizeText(job.city || "Arcoverde");
  const candCity = normalizeText(candidate.city || "");
  let locationHint = 0;
  let locationLabel = "Localidade não informada";
  if (!candCity) {
    locationHint = 1;
    locationLabel = "Cidade do candidato não informada";
  } else if (jobCity === "remoto" || jobCity === candCity || candCity.includes("arcoverde")) {
    locationHint = 3;
    locationLabel = "Mesma região / compatível";
    explanations.push("Localidade compatível (+3)");
  } else {
    locationHint = 2;
    locationLabel = `Outra cidade (${candidate.city}) — avaliar deslocamento na entrevista`;
    explanations.push("Cidade diferente: sinal informativo, não eliminatório (+2)");
  }

  // CNH as alert only
  if (job.driverLicense && job.driverLicense !== "NENHUMA") {
    const candLic = candidate.driverLicense || "NENHUMA";
    if (candLic !== job.driverLicense && !candLic.includes(job.driverLicense)) {
      alerts.push(`Vaga cita CNH ${job.driverLicense}; candidato informou ${candLic}`);
    }
  }

  const score = Math.min(
    100,
    Math.max(
      0,
      keywordCoverage + titleAlignment + experience + education + documentQuality + engagement + locationHint,
    ),
  );

  const band = getAtsBand(score);
  explanations.unshift(`Score ATS profissional: ${score}/100 · faixa ${getAtsBandMeta(band).label}`);

  return {
    score,
    band,
    explanations,
    breakdown: {
      keywordCoverage,
      titleAlignment,
      experience,
      education,
      documentQuality,
      engagement,
      locationHint,
      requiredMatched,
      requiredMissing,
      preferredMatched,
      preferredMissing,
      alerts,
      locationLabel,
      parseLabel,
      experienceYears: years,
    },
  };
}

/** Compatível com UI antiga. */
export function getMatchBandLabel(score: number) {
  const band = getAtsBand(score);
  const meta = getAtsBandMeta(band);
  return { ...meta, band };
}
