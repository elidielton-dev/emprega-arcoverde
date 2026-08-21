import type { LinkedInProfileData } from "@/lib/linkedin/types";
import { parseLinkedInProfileText } from "@/lib/linkedin/parse-profile-text";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function prepareText(raw: string): string {
  let text = (raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const headers = [
    "objetivo profissional",
    "objetivo",
    "resumo profissional",
    "perfil profissional",
    "sobre mim",
    "sobre",
    "experiencia profissional",
    "experiência profissional",
    "historico profissional",
    "histórico profissional",
    "experiencia",
    "experiência",
    "formacao academica",
    "formação acadêmica",
    "formacao",
    "formação",
    "educacao",
    "educação",
    "escolaridade",
    "cursos complementares",
    "cursos e certificacoes",
    "cursos e certificações",
    "certificacoes",
    "certificações",
    "cursos",
    "habilidades",
    "competencias",
    "competências",
    "conhecimentos tecnicos",
    "conhecimentos técnicos",
    "conhecimentos",
    "idiomas",
  ];

  for (const h of headers) {
    const re = new RegExp(`([^\\n])(\\s*)(${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s*[:\\-]?`, "gi");
    text = text.replace(re, `$1\n$3\n`);
  }

  return text
    .replace(/objetivo profissional/gi, "Sobre")
    .replace(/resumo profissional/gi, "Sobre")
    .replace(/perfil profissional/gi, "Sobre")
    .replace(/sobre mim/gi, "Sobre")
    .replace(/experi[eê]ncia profissional/gi, "Experiência")
    .replace(/hist[oó]rico profissional/gi, "Experiência")
    .replace(/forma[cç][aã]o acad[eê]mica/gi, "Formação")
    .replace(/escolaridade/gi, "Formação")
    .replace(/cursos complementares/gi, "Cursos")
    .replace(/cursos e certifica[cç][oõ]es/gi, "Cursos")
    .replace(/conhecimentos t[eé]cnicos/gi, "Competências")
    .replace(/habilidades t[eé]cnicas/gi, "Competências");
}

function extractSkillsHeuristic(text: string): string[] {
  const skillsBlock = text.match(
    /(?:habilidades|compet[eê]ncias|conhecimentos)[:\s]*\n?([\s\S]{8,500}?)(?=\n\s*(?:experi|forma|educa|curso|idioma|sobre|$))/i,
  );
  const blob = skillsBlock?.[1] || "";
  const fromBlock = blob
    .split(/[·•|,;/\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 45);

  if (fromBlock.length >= 2) return fromBlock.slice(0, 30);

  const common = [
    "excel",
    "word",
    "powerpoint",
    "pacote office",
    "atendimento",
    "vendas",
    "comunicação",
    "trabalho em equipe",
    "organização",
    "informática",
    "caixa",
    "estoque",
    "administrativo",
    "python",
    "javascript",
    "gestão",
  ];
  const lower = normalize(text);
  return common.filter((c) => lower.includes(normalize(c))).slice(0, 15);
}

/** Fallback quando o PDF não tem seções claras. */
function fallbackFromPlainText(text: string): Partial<LinkedInProfileData> {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const fullName = lines[0]?.slice(0, 120);
  let headline: string | undefined = lines[1]?.slice(0, 180);
  if (headline && /@|telefone|whatsapp|\d{5}/i.test(headline)) {
    headline = lines.find((l, i) => i > 0 && l.length > 8 && l.length < 100 && !/@/.test(l))?.slice(0, 180);
  }

  const summaryLines = lines.slice(1, 12).filter((l) => !/@/.test(l) && !/^\d/.test(l));
  const summary = summaryLines.join(" ").slice(0, 900);

  // Blocos com datas ≈ experiências
  const experiences: LinkedInProfileData["experiences"] = [];
  const dateRe =
    /\b((jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|mar[cç]o|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|\d{1,2})[\/\s.de-]+(19|20)\d{2}|\b(19|20)\d{2}\b)/i;

  for (let i = 0; i < lines.length - 1; i++) {
    if (!dateRe.test(lines[i + 1]) && !dateRe.test(lines[i])) continue;
    const maybeTitle = lines[i];
    const maybeCompany = lines[i - 1] || lines[i + 1];
    if (!maybeTitle || maybeTitle.length < 2 || maybeTitle.length > 80) continue;
    if (/experiencia|formacao|objetivo|habilidade|curso/i.test(maybeTitle)) continue;

    const position = dateRe.test(lines[i]) ? lines[i - 1] || maybeTitle : maybeTitle;
    const company = dateRe.test(lines[i]) ? maybeTitle : maybeCompany;
    if (!position || !company || position === company) continue;

    experiences.push({
      company: company.slice(0, 180),
      position: position.slice(0, 180),
      startDate: new Date("2020-01-01"),
      endDate: null,
      isCurrent: /atual|momento|presente|hoje/i.test(lines[i] + lines[i + 1]),
      description: null,
    });
    if (experiences.length >= 6) break;
  }

  return {
    fullName,
    headline,
    summary: summary.length > 40 ? summary : undefined,
    experiences,
  };
}

/**
 * Interpreta texto de PDF/DOCX e devolve dados para o formulário.
 */
export function parseResumeToStructured(rawText: string): LinkedInProfileData {
  const prepared = prepareText(rawText || "");
  const parsed = parseLinkedInProfileText(prepared);
  const fallback = fallbackFromPlainText(prepared);

  if (!parsed.skills.length) {
    parsed.skills = extractSkillsHeuristic(prepared);
  }

  if (!parsed.fullName && fallback.fullName) parsed.fullName = fallback.fullName;
  if (!parsed.headline && fallback.headline) parsed.headline = fallback.headline;
  if (!parsed.summary && fallback.summary) parsed.summary = fallback.summary;
  if (!parsed.experiences.length && fallback.experiences?.length) {
    parsed.experiences = fallback.experiences;
  }

  if (!parsed.summary && prepared.length > 80) {
    const lines = prepared
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const body = lines.slice(1, 10).join(" ").slice(0, 800);
    if (body.length > 40) parsed.summary = body;
  }

  // Garante pelo menos headline a partir do nome/objetivo
  if (!parsed.headline && parsed.fullName) {
    parsed.headline = `Profissional — ${parsed.fullName}`;
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
      (data.summary && data.summary.length > 40) ||
      data.headline,
  );
}
