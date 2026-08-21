import type { LinkedInProfileData } from "@/lib/linkedin/types";
import { parseLinkedInProfileText } from "@/lib/linkedin/parse-profile-text";

const EXTRA_HEADERS: Record<string, string[]> = {
  about: [
    "objetivo",
    "objetivo profissional",
    "perfil profissional",
    "resumo profissional",
    "apresentação",
    "apresentacao",
  ],
  experience: [
    "experiência profissional",
    "experiencia profissional",
    "histórico profissional",
    "historico profissional",
    "atuação profissional",
    "atuacao profissional",
  ],
  education: ["educação", "educacao", "formação escolar", "formacao escolar"],
  courses: [
    "cursos complementares",
    "cursos e certificações",
    "cursos e certificacoes",
    "qualificações",
    "qualificacoes",
    "certificados",
  ],
  skills: [
    "conhecimentos",
    "conhecimentos técnicos",
    "conhecimentos tecnicos",
    "habilidades técnicas",
    "habilidades tecnicas",
    "competências técnicas",
    "competencias tecnicas",
  ],
};

/**
 * Normaliza texto de currículo genérico (PT) para o parser de seções
 * (reaproveita o mesmo motor do LinkedIn).
 */
function normalizeGenericResumeText(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Insere quebras antes de cabeçalhos comuns colados na mesma linha
  const allHeaders = Object.values(EXTRA_HEADERS).flat().concat([
    "experiência",
    "experiencia",
    "formação",
    "formacao",
    "educação",
    "educacao",
    "habilidades",
    "competências",
    "competencias",
    "certificações",
    "certificacoes",
    "cursos",
    "sobre",
    "resumo",
    "objetivo",
  ]);

  for (const h of allHeaders) {
    const re = new RegExp(`([^\\n])(\\s*)(${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*[:\\-]?\\s*`, "gi");
    text = text.replace(re, `$1\n$3\n`);
  }

  // Prefixa aliases extras como seções reconhecidas pelo parser LinkedIn
  text = text
    .replace(/objetivo profissional/gi, "Sobre")
    .replace(/resumo profissional/gi, "Sobre")
    .replace(/perfil profissional/gi, "Sobre")
    .replace(/experi[eê]ncia profissional/gi, "Experiência")
    .replace(/hist[oó]rico profissional/gi, "Experiência")
    .replace(/forma[cç][aã]o acad[eê]mica/gi, "Formação")
    .replace(/forma[cç][aã]o escolar/gi, "Formação")
    .replace(/cursos complementares/gi, "Cursos")
    .replace(/cursos e certifica[cç][oõ]es/gi, "Cursos")
    .replace(/conhecimentos t[eé]cnicos/gi, "Competências")
    .replace(/habilidades t[eé]cnicas/gi, "Competências");

  return text;
}

function extractSkillsHeuristic(text: string): string[] {
  const skillsBlock = text.match(
    /(?:habilidades|compet[eê]ncias|conhecimentos)[:\s]+([\s\S]{10,400}?)(?=\n\s*(?:experi|forma|educa|curso|idioma|$))/i,
  );
  const blob = skillsBlock?.[1] || "";
  const fromBlock = blob
    .split(/[·•|,;/\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40);

  if (fromBlock.length >= 2) return fromBlock.slice(0, 30);

  // Fallback: palavras comuns em CVs BR
  const common = [
    "excel",
    "word",
    "powerpoint",
    "pacote office",
    "atendimento",
    "vendas",
    "comunicação",
    "comunicacao",
    "trabalho em equipe",
    "organização",
    "organizacao",
    "informática",
    "informatica",
    "caixa",
    "estoque",
    "administrativo",
  ];
  const lower = text.toLowerCase();
  return common.filter((c) => lower.includes(c)).slice(0, 15);
}

/**
 * Interpreta texto de PDF/DOCX de currículo (genérico ou LinkedIn)
 * em dados para preencher o formulário estruturado.
 */
export function parseResumeToStructured(rawText: string): LinkedInProfileData {
  const prepared = normalizeGenericResumeText(rawText || "");
  const parsed = parseLinkedInProfileText(prepared);

  if (!parsed.skills.length) {
    parsed.skills = extractSkillsHeuristic(prepared);
  }

  // Se não achou seções mas há texto, usa primeiros parágrafos como resumo
  if (!parsed.summary && prepared.length > 80) {
    const lines = prepared
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const body = lines.slice(2, 8).join(" ").slice(0, 800);
    if (body.length > 40) parsed.summary = body;
  }

  parsed.source = "pdf";
  return parsed;
}

export function hasStructuredContent(data: LinkedInProfileData): boolean {
  return Boolean(
    data.experiences.length ||
      data.educations.length ||
      data.courses.length ||
      data.skills.length ||
      data.summary ||
      data.headline,
  );
}
