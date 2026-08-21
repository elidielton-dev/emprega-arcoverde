import type {
  LinkedInCourse,
  LinkedInEducation,
  LinkedInExperience,
  LinkedInProfileData,
} from "./types";

const SECTION_HEADERS: Record<string, string[]> = {
  about: ["about", "sobre", "resumo", "summary"],
  experience: ["experience", "experiência", "experiencia", "experiências", "experiencias"],
  education: [
    "education",
    "formação acadêmica",
    "formacao academica",
    "formação",
    "formacao",
    "escolaridade",
  ],
  courses: [
    "licenses & certifications",
    "licenses and certifications",
    "licenças e certificações",
    "licencas e certificacoes",
    "certifications",
    "certificações",
    "certificacoes",
    "cursos",
    "courses",
    "licenças",
    "licencas",
  ],
  skills: ["skills", "competências", "competencias", "habilidades"],
};

function normalize(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function detectSection(line: string): keyof typeof SECTION_HEADERS | null {
  const n = normalize(line);
  if (!n || n.length > 60) return null;
  for (const [key, aliases] of Object.entries(SECTION_HEADERS) as [keyof typeof SECTION_HEADERS, string[]][]) {
    if (aliases.some((a) => n === normalize(a) || n.startsWith(normalize(a)))) return key;
  }
  return null;
}

function parseMonthYear(raw: string): Date | null {
  const months: Record<string, number> = {
    jan: 0,
    janeiro: 0,
    fev: 1,
    fevereiro: 1,
    mar: 2,
    marco: 2,
    março: 2,
    abr: 3,
    abril: 3,
    mai: 4,
    maio: 4,
    jun: 5,
    junho: 5,
    jul: 6,
    julho: 6,
    ago: 7,
    agosto: 7,
    set: 8,
    setembro: 8,
    out: 9,
    outubro: 9,
    nov: 10,
    novembro: 10,
    dez: 11,
    dezembro: 11,
    jan_: 0,
  };

  const cleaned = normalize(raw);
  const pt = cleaned.match(
    /\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|marco|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\.?\s*(?:de\s*)?(\d{4})\b/,
  );
  if (pt) {
    const m = months[pt[1]] ?? 0;
    return new Date(Date.UTC(Number(pt[2]), m, 1));
  }

  const en = cleaned.match(
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/,
  );
  if (en) {
    const map: Record<string, number> = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11,
    };
    return new Date(Date.UTC(Number(en[2]), map[en[1]] ?? 0, 1));
  }

  const yearOnly = cleaned.match(/\b(19|20)\d{2}\b/);
  if (yearOnly) return new Date(Date.UTC(Number(yearOnly[0]), 0, 1));
  return null;
}

function parseDateRange(line: string): {
  startDate: Date | null;
  endDate: Date | null;
  isCurrent: boolean;
} {
  const n = normalize(line);
  const isCurrent = /\b(o momento|present|atual|current|hoje)\b/.test(n);
  const parts = line.split(/\s[-–—]\s|\sate\s|\saté\s|\sto\s/i);
  if (parts.length >= 2) {
    return {
      startDate: parseMonthYear(parts[0]),
      endDate: isCurrent ? null : parseMonthYear(parts[1]),
      isCurrent,
    };
  }
  const single = parseMonthYear(line);
  return { startDate: single, endDate: null, isCurrent };
}

function looksLikeDateLine(line: string) {
  const n = normalize(line);
  return (
    /\b(19|20)\d{2}\b/.test(n) &&
    (/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b/.test(n) ||
      /\b(o momento|present|atual|current)\b/.test(n) ||
      /\s[-–—]\s/.test(line))
  );
}

function guessEducationLevel(course: string): string {
  const n = normalize(course);
  if (/pos|mestrado|doutorado|mba|especializa/.test(n)) return "POS";
  if (/tecnologo|tecnico|técnico/.test(n)) return "TECNICO";
  if (/superior|bacharel|licenciatura|graduacao|graduação/.test(n)) return "SUPERIOR";
  if (/medio|médio|ensino medio/.test(n)) return "MEDIO";
  return "SUPERIOR";
}

function splitSections(text: string) {
  const lines = text
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // PDFs às vezes vêm em uma linha só — tenta quebrar por cabeçalhos
  let working = lines;
  if (lines.length < 8 && text.length > 200) {
    const soft = text
      .replace(/\s{2,}/g, "\n")
      .replace(
        /(About|Sobre|Experience|Experi[eê]ncia|Education|Forma[cç][aã]o|Skills|Compet[eê]ncias|Licen[cç]as|Certifica[cç][oõ]es|Courses|Cursos)/gi,
        "\n$1\n",
      )
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (soft.length > lines.length) working = soft;
  }

  const sections: Record<string, string[]> = {
    preamble: [],
    about: [],
    experience: [],
    education: [],
    courses: [],
    skills: [],
  };

  let current: keyof typeof sections = "preamble";
  for (const line of working) {
    const section = detectSection(line);
    if (section) {
      current = section;
      continue;
    }
    sections[current].push(line);
  }

  return sections;
}

function parseExperiences(lines: string[]): LinkedInExperience[] {
  const items: LinkedInExperience[] = [];
  let i = 0;
  while (i < lines.length) {
    const position = lines[i];
    const company = lines[i + 1];
    if (!position || !company) break;

    let startDate = new Date();
    let endDate: Date | null = null;
    let isCurrent = true;
    let cursor = i + 2;
    const desc: string[] = [];

    if (lines[cursor] && looksLikeDateLine(lines[cursor])) {
      const range = parseDateRange(lines[cursor]);
      startDate = range.startDate || startDate;
      endDate = range.endDate;
      isCurrent = range.isCurrent;
      cursor += 1;
    }

    while (cursor < lines.length) {
      const nextPos = lines[cursor];
      const nextCompany = lines[cursor + 1];
      if (
        nextPos &&
        nextCompany &&
        !looksLikeDateLine(nextPos) &&
        !looksLikeDateLine(nextCompany) &&
        detectSection(nextPos) === null &&
        // heuristic: new block starts when following line looks like company and later has dates
        (looksLikeDateLine(lines[cursor + 2] || "") || cursor + 2 >= lines.length)
      ) {
        // could be ambiguous; prefer ending if date line appears two ahead
        if (looksLikeDateLine(lines[cursor + 2] || "")) break;
      }
      // End block when we see a date line preceded by two title-like lines — handled by outer loop restart
      if (
        cursor + 2 < lines.length &&
        looksLikeDateLine(lines[cursor + 2]) &&
        !looksLikeDateLine(lines[cursor]) &&
        !looksLikeDateLine(lines[cursor + 1])
      ) {
        break;
      }
      desc.push(lines[cursor]);
      cursor += 1;
      if (cursor - i > 12) break;
    }

    items.push({
      company: company.slice(0, 180),
      position: position.slice(0, 180),
      startDate,
      endDate,
      isCurrent,
      description: desc.join("\n").slice(0, 2000) || null,
    });
    i = Math.max(cursor, i + 2);
  }
  return items.slice(0, 12);
}

function parseEducations(lines: string[]): LinkedInEducation[] {
  const items: LinkedInEducation[] = [];
  let i = 0;
  while (i < lines.length) {
    const institution = lines[i];
    const course = lines[i + 1] || "Formação";
    if (!institution) break;
    let cursor = i + 2;
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    let status = "CONCLUIDO";
    if (lines[cursor] && looksLikeDateLine(lines[cursor])) {
      const range = parseDateRange(lines[cursor]);
      startDate = range.startDate;
      endDate = range.endDate;
      status = range.isCurrent ? "EM_ANDAMENTO" : "CONCLUIDO";
      cursor += 1;
    }
    items.push({
      institution: institution.slice(0, 180),
      course: course.slice(0, 180),
      level: guessEducationLevel(course),
      startDate,
      endDate,
      status,
    });
    i = cursor;
    if (items.length >= 8) break;
  }
  return items;
}

function parseCourses(lines: string[]): LinkedInCourse[] {
  const items: LinkedInCourse[] = [];
  for (let i = 0; i < lines.length; i++) {
    const title = lines[i];
    if (!title || looksLikeDateLine(title) || detectSection(title)) continue;
    const institution = lines[i + 1] && !looksLikeDateLine(lines[i + 1]) ? lines[i + 1] : "Certificação";
    let completionDate: Date | null = null;
    if (lines[i + 1] && looksLikeDateLine(lines[i + 1])) {
      completionDate = parseMonthYear(lines[i + 1]);
    } else if (lines[i + 2] && looksLikeDateLine(lines[i + 2])) {
      completionDate = parseMonthYear(lines[i + 2]);
      i += 1;
    }
    items.push({
      title: title.slice(0, 180),
      institution: institution.slice(0, 180),
      completionDate,
    });
    i += 1;
    if (items.length >= 15) break;
  }
  return items;
}

function parseSkills(lines: string[]): string[] {
  const blob = lines.join(" · ");
  return blob
    .split(/[·•|,;/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 60)
    .slice(0, 40);
}

/**
 * Interpreta texto de PDF/exportação do LinkedIn (PT/EN) em dados de currículo.
 */
export function parseLinkedInProfileText(rawText: string): LinkedInProfileData {
  const text = (rawText || "").trim();
  const sections = splitSections(text);
  const preamble = sections.preamble;

  const fullName = preamble[0]?.slice(0, 120);
  const headline = preamble[1]?.slice(0, 200);

  return {
    fullName,
    headline,
    summary: sections.about.join("\n").slice(0, 4000) || undefined,
    skills: parseSkills(sections.skills),
    experiences: parseExperiences(sections.experience),
    educations: parseEducations(sections.education),
    courses: parseCourses(sections.courses),
    source: "pdf",
  };
}

export function looksLikeLinkedInResume(text: string): boolean {
  const n = normalize(text);
  return (
    n.includes("linkedin") ||
    (n.includes("experiencia") && n.includes("formacao")) ||
    (n.includes("experience") && n.includes("education")) ||
    n.includes("competencias") ||
    n.includes("licencas e certificacoes")
  );
}
