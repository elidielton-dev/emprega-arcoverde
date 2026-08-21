import type { LinkedInProfileData } from "@/lib/linkedin/types";
import { parseLinkedInProfileText } from "@/lib/linkedin/parse-profile-text";

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** PDFs frequentemente vêm sem quebra de linha — força seções. */
function prepareText(raw: string): string {
  let text = (raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Se quase não há linhas, quebra por cabeçalhos no meio do parágrafo
  const lineCount = text.split("\n").filter((l) => l.trim()).length;
  if (lineCount < 6 && text.length > 120) {
    text = text.replace(/\s{2,}/g, "\n");
  }

  const headers = [
    "objetivo profissional",
    "objetivo",
    "resumo profissional",
    "perfil profissional",
    "dados pessoais",
    "sobre mim",
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
    "informacoes adicionais",
    "informações adicionais",
  ];

  for (const h of headers) {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${escaped})\\s*[:\\-]?\\s*`, "gi");
    text = text.replace(re, "\n$1\n");
  }

  return text
    .replace(/objetivo profissional/gi, "Sobre")
    .replace(/resumo profissional/gi, "Sobre")
    .replace(/perfil profissional/gi, "Sobre")
    .replace(/dados pessoais/gi, "Sobre")
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
  const n = normalize(text);
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
    "python",
    "javascript",
    "gestão",
    "gestao",
    "liderança",
    "lideranca",
  ];
  return common.filter((c) => n.includes(normalize(c))).slice(0, 15);
}

function extractEmail(text: string) {
  return text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
}

function extractPhone(text: string) {
  return text.match(/(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/)?.[0];
}

/**
 * Interpreta texto de PDF/DOCX e devolve dados para o formulário.
 * Sempre tenta preencher pelo menos nome, título e resumo.
 */
export function parseResumeToStructured(rawText: string): LinkedInProfileData {
  const prepared = prepareText(rawText || "");
  const parsed = parseLinkedInProfileText(prepared);
  const flat = prepared.replace(/\s+/g, " ").trim();
  const lines = prepared
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!parsed.skills.length) {
    parsed.skills = extractSkillsHeuristic(prepared);
  }

  // Nome: primeira linha “humana”
  if (!parsed.fullName) {
    const nameLine = lines.find(
      (l) =>
        l.length > 3 &&
        l.length < 80 &&
        !/@/.test(l) &&
        !/experiencia|formacao|objetivo|curriculo|telefone/i.test(l),
    );
    parsed.fullName = nameLine?.slice(0, 120);
  }

  if (!parsed.headline) {
    const objective = prepared.match(
      /(?:objetivo|titulo|cargo desejado)\s*[:\-]?\s*([^\n]{8,120})/i,
    );
    parsed.headline =
      objective?.[1]?.trim() ||
      lines.find(
        (l, i) =>
          i > 0 &&
          l.length > 8 &&
          l.length < 100 &&
          !/@/.test(l) &&
          !/^\d/.test(l) &&
          !/experiencia|formacao|habilidade/i.test(l),
      ) ||
      (parsed.fullName ? `Profissional — ${parsed.fullName}` : "Currículo importado");
  }

  if (!parsed.summary || parsed.summary.length < 40) {
    const about = prepared.match(
      /(?:sobre|resumo|objetivo)[^\n]*\n([\s\S]{40,800}?)(?=\n\s*(?:experi|forma|educa|curso|habili|competen)|$)/i,
    );
    parsed.summary =
      about?.[1]?.replace(/\s+/g, " ").trim().slice(0, 900) ||
      flat.slice(0, 900);
  }

  // Experiência: padrões "Cargo - Empresa" / "Cargo na Empresa"
  if (!parsed.experiences.length) {
    const expBlock = prepared.match(
      /experi[eê]ncia[^\n]*\n([\s\S]{20,2000}?)(?=\n\s*(?:forma|educa|curso|habili|competen|idioma)|$)/i,
    );
    const block = expBlock?.[1] || prepared;
    const pairs = block.matchAll(
      /([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s\/\-]{2,60}?)\s+(?:[-–—]|em|na|no)\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9\s\.\&\-]{2,60})/gi,
    );
    for (const m of pairs) {
      const position = m[1].trim();
      const company = m[2].trim();
      if (/experiencia|formacao|objetivo|habilidade/i.test(position)) continue;
      parsed.experiences.push({
        company: company.slice(0, 180),
        position: position.slice(0, 180),
        startDate: new Date("2020-01-01"),
        endDate: null,
        isCurrent: false,
        description: null,
      });
      if (parsed.experiences.length >= 5) break;
    }
  }

  // Formação
  if (!parsed.educations.length) {
    const eduMatch = prepared.match(
      /(?:ensino\s+(?:fundamental|m[eé]dio|t[eé]cnico|superior)|bacharel|licenciatura|tecn[oó]logo)[^\n]{0,80}/i,
    );
    if (eduMatch) {
      parsed.educations.push({
        institution: "Instituição de ensino",
        course: eduMatch[0].trim().slice(0, 180),
        level: /superior|bacharel|licenciatura/i.test(eduMatch[0])
          ? "SUPERIOR"
          : /t[eé]cnico|tecn[oó]logo/i.test(eduMatch[0])
            ? "TECNICO"
            : /fundamental/i.test(eduMatch[0])
              ? "FUNDAMENTAL"
              : "MEDIO",
        status: "CONCLUIDO",
      });
    }
  }

  // Metadados úteis no resumo
  const email = extractEmail(rawText);
  const phone = extractPhone(rawText);
  if (email || phone) {
    const contact = [email, phone].filter(Boolean).join(" · ");
    if (parsed.summary && !parsed.summary.includes(contact)) {
      parsed.summary = `${parsed.summary}\n\nContato: ${contact}`.slice(0, 1000);
    }
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
      (data.summary && data.summary.length > 20) ||
      data.headline,
  );
}
