/**
 * Parser profissional de currículos brasileiros (PDF/DOCX → texto).
 *
 * Regras de mapeamento:
 * - Contato (rua/tel/email) → nunca vira título/empresa/escola
 * - Objetivo → título curto + resumo (se não houver seção Resumo)
 * - Experiência → N blocos (cargo + empresa reais)
 * - Formação → N blocos (instituição + curso/nível)
 * - Cadeira/disciplina / skill / "aprendendo X" → Habilidades ou Cursos (NÃO universidade)
 * - Curso curto (Senac/Sebrae) → Cursos complementares
 */

function normalize(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanLines(raw) {
  let text = String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const headers = [
    "objetivo profissional",
    "objetivo",
    "resumo profissional",
    "resumo",
    "perfil profissional",
    "perfil",
    "sobre mim",
    "dados pessoais",
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
    "disciplinas",
    "disciplinas relevantes",
    "cadeiras",
    "cursos complementares",
    "cursos e certificacoes",
    "cursos e certificações",
    "certificacoes",
    "certificações",
    "cursos",
    "habilidades tecnicas",
    "habilidades técnicas",
    "habilidades",
    "competencias",
    "competências",
    "conhecimentos tecnicos",
    "conhecimentos técnicos",
    "conhecimentos",
    "idiomas",
    "informacoes adicionais",
    "informações adicionais",
    "experience",
    "education",
    "skills",
    "about",
    "summary",
    "objective",
  ];

  for (const h of headers.sort((a, b) => b.length - a.length)) {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(
      new RegExp(`(^|\\n)[ \\t]*(${esc})[ \\t]*[:\\-]?[ \\t]*(?=\\n|$)`, "gi"),
      "$1\n$2\n",
    );
  }

  return text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);
}

const SECTION_ALIASES = {
  objective: [
    "objetivo profissional",
    "objetivo",
    "objective",
    "cargo desejado",
    "titulo profissional",
    "título profissional",
  ],
  summary: [
    "resumo profissional",
    "resumo",
    "perfil profissional",
    "perfil",
    "sobre mim",
    "sobre",
    "about",
    "summary",
  ],
  experience: [
    "experiencia profissional",
    "experiência profissional",
    "historico profissional",
    "histórico profissional",
    "experiencia",
    "experiência",
    "experience",
  ],
  education: [
    "formacao academica",
    "formação acadêmica",
    "formacao",
    "formação",
    "educacao",
    "educação",
    "escolaridade",
    "education",
  ],
  courses: [
    "cursos complementares",
    "cursos e certificacoes",
    "cursos e certificações",
    "certificacoes",
    "certificações",
    "cursos",
    "disciplinas",
    "disciplinas relevantes",
    "cadeiras",
    "licenses & certifications",
    "certifications",
  ],
  skills: [
    "habilidades tecnicas",
    "habilidades técnicas",
    "habilidades",
    "competencias",
    "competências",
    "conhecimentos tecnicos",
    "conhecimentos técnicos",
    "conhecimentos",
    "skills",
  ],
};

const SKILL_TERMS = [
  "java",
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "react",
  "node",
  "sql",
  "excel",
  "word",
  "powerpoint",
  "powerpoint",
  "outlook",
  "teams",
  "onedrive",
  "microsoft 365",
  "pacote office",
  "office",
  "git",
  "github",
  "linux",
  "windows",
  "android",
  "ios",
  "figma",
  "photoshop",
  "atendimento",
  "vendas",
  "comunicacao",
  "organização",
  "organizacao",
  "trabalho em equipe",
  "instalacao",
  "instalação",
  "configuracao",
  "configuração",
  "manutencao",
  "manutenção",
  "redes",
  "hardware",
  "software",
  "logica",
  "lógica",
  "algoritmo",
  "banco de dados",
  "spring",
  "dotnet",
  "c#",
  "php",
  "kotlin",
  "swift",
];

const JOB_TITLE_HINTS =
  /\b(desenvolvedor|developer|analista|assistente|auxiliar|vendedor|atendente|estagi[aá]rio|operador|coordenador|gerente|supervisor|tecnico|t[eé]cnico|consultor|trainee|aprendiz|jovem aprendiz|caixa|recepcionista|motorista|professor|engenheiro|designer|programador|suporte|helpdesk|ti)\b/i;

const INSTITUTION_HINTS =
  /\b(universidade|faculdade|centro universit[aá]rio|instituto|escola|col[eé]gio|fundac|senac|senai|sesi|sebrae|ifpe|ifrn|ufrpe|ufpe|ufrn|univasf|aesa|anhanguera|est[aá]cio|unopar|uninter|unopar|cefet|e\.?e\.?|ee |em )\b/i;

const DEGREE_HINTS =
  /\b(ensino\s+(fundamental|m[eé]dio|t[eé]cnico|superior)|bacharel|licenciatura|tecn[oó]logo|mestrado|doutorado|mba|p[oó]s[\s-]?gradua[cç][aã]o|gradua[cç][aã]o|an[aá]lise\s+e\s+desenvolvimento|sistemas\s+de\s+informa[cç][aã]o|ci[eê]ncia\s+da\s+computa[cç][aã]o|administra[cç][aã]o|pedagogia|direito|enfermagem|contabilidade)\b/i;

const SUBJECT_HINTS =
  /\b(cadeira|disciplina|mat[eé]ria|unidade curricular|uc\s*\d|i{1,3}\s*$|\bii\b|\biii\b|introdu[cç][aã]o\s+[aà]|c[aá]lculo|algoritmos?|estrutura\s+de\s+dados|poo|orienta[cç][aã]o\s+a\s+objetos)\b/i;

const LEARNING_HINTS =
  /\b(aprendendo|conhecimentos?\s+b[aá]sicos?|no[cç][oõ]es?\s+de|familiaridade\s+com|em\s+aprendizagem|estudando)\b/i;

function detectSection(line) {
  const n = normalize(line);
  if (!n || n.length > 70) return null;
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    for (const a of aliases) {
      const an = normalize(a);
      if (n === an || n === an + ":") return key;
    }
  }
  return null;
}

function isContactLine(line) {
  const n = normalize(line);
  if (!n) return true;
  if (/@/.test(line)) return true;
  if (/\b(rua|av\.|avenida|travessa|bairro|cep)\b/.test(n)) return true;
  if (/^\(?\d{2}\)?\s?\d{4,5}/.test(n.replace(/\s/g, ""))) return true;
  if (/\d{4,5}[-\s]?\d{4}/.test(line) && line.length < 40) return true;
  if (/linkedin\.com|github\.com|whatsapp/i.test(line)) return true;
  if (/\brua\b/i.test(line) && (/@/.test(line) || /\d{8,}/.test(line.replace(/\D/g, "")))) {
    return true;
  }
  if ((line.match(/\|/g) || []).length >= 1 && (/@/.test(line) || /\d{8,}/.test(line.replace(/\D/g, "")))) {
    return true;
  }
  return false;
}

function isNameLine(line) {
  if (!line || line.length < 3 || line.length > 70) return false;
  if (isContactLine(line)) return false;
  if (detectSection(line)) return false;
  if (/^\d/.test(line)) return false;
  if (/curriculo|curriculum|vitae/i.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  const letterRatio = (line.replace(/[^A-Za-zÀ-ÿ]/g, "").length || 0) / line.length;
  return letterRatio > 0.7;
}

function looksLikeDateLine(line) {
  const n = normalize(line);
  return (
    /\b(19|20)\d{2}\b/.test(n) &&
    (/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b/.test(n) ||
      /\s[-–—]\s/.test(line) ||
      /\b(atual|momento|presente|hoje|current|present)\b/.test(n) ||
      /\b\d{4}\s*[-–—\/]\s*(\d{4}|atual|presente)\b/.test(n))
  );
}

function isSkillLine(line) {
  const n = normalize(line);
  if (!n || n.length > 90) return false;
  if (isContactLine(line) || detectSection(line) || looksLikeDateLine(line)) return false;
  if (LEARNING_HINTS.test(n)) return true;
  if (SUBJECT_HINTS.test(n) && !INSTITUTION_HINTS.test(n) && !DEGREE_HINTS.test(n)) return true;
  // short tech token / list item
  if (n.length <= 40 && SKILL_TERMS.some((t) => n === t || n.includes(t))) return true;
  // "Java, HTML, CSS"
  if (/,/.test(line) && line.split(",").length >= 2 && line.length < 120) {
    const parts = line.split(",").map((p) => normalize(p));
    if (parts.filter((p) => SKILL_TERMS.some((t) => p.includes(t)) || p.length <= 25).length >= 2) {
      return true;
    }
  }
  return false;
}

function isInstitutionLine(line) {
  if (!line || isContactLine(line) || isSkillLine(line)) return false;
  if (SUBJECT_HINTS.test(line) && !INSTITUTION_HINTS.test(line)) return false;
  return INSTITUTION_HINTS.test(line) || /^[A-ZÁÉÍÓÚÂÊÔÃÕ]{2,12}$/.test(line.trim()); // AESA, UFPE
}

function isDegreeLine(line) {
  if (!line || isContactLine(line) || isSkillLine(line)) return false;
  return DEGREE_HINTS.test(line);
}

function isJobTitleLine(line) {
  if (!line || isContactLine(line) || isSkillLine(line) || looksLikeDateLine(line)) return false;
  if (isInstitutionLine(line) && !JOB_TITLE_HINTS.test(line)) return false;
  if (line.length > 90) return false; // description
  return JOB_TITLE_HINTS.test(line) || (line.length >= 4 && line.length <= 60 && !DEGREE_HINTS.test(line));
}

function isCompanyLine(line) {
  if (!line || isContactLine(line) || looksLikeDateLine(line) || detectSection(line)) return false;
  if (isSkillLine(line)) return false;
  if (SUBJECT_HINTS.test(line) && !INSTITUTION_HINTS.test(line)) return false;
  if (isDegreeLine(line)) return false;
  if (line.length > 100) return false; // description prose
  // Descriptions often start with verbs
  if (/^(apoio|atendimento|respons[aá]vel|desenvolvimento|manuten[cç][aã]o|realiza[cç][aã]o|participa[cç][aã]o)\b/i.test(line)) {
    return false;
  }
  if (JOB_TITLE_HINTS.test(line) && line.length < 50) return false; // likely another job title
  return true;
}

function isSubjectOrCadeira(line) {
  if (!line || isContactLine(line)) return false;
  if (SUBJECT_HINTS.test(line)) return true;
  // "I I", "II", "III" alone or with subject name
  if (/^(i{1,3}|[ivx]{1,4})$/i.test(line.trim())) return true;
  if (/\b(i|ii|iii|iv)\b/i.test(line) && line.length < 60 && !INSTITUTION_HINTS.test(line)) return true;
  return false;
}

function extractEmail(text) {
  return String(text).match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || undefined;
}

function extractPhone(text) {
  return String(text).match(/(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/)?.[0] || undefined;
}

function splitSections(lines) {
  const sections = {
    preamble: [],
    objective: [],
    summary: [],
    experience: [],
    education: [],
    courses: [],
    skills: [],
  };
  let current = "preamble";
  for (const line of lines) {
    const sec = detectSection(line);
    if (sec) {
      current = sec;
      continue;
    }
    sections[current].push(line);
  }
  return sections;
}

function headlineFromObjective(objectiveLines) {
  const text = objectiveLines.join(" ").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  const asRole = text.match(/atuar\s+como\s+([^,.\n]{3,60})/i);
  if (asRole) return asRole[1].trim().slice(0, 120);
  const short = text.split(/[.\n]/)[0].trim();
  if (short.length <= 120) return short;
  return short.slice(0, 117) + "…";
}

function parseSkills(lines) {
  const parts = [];
  for (const line of lines) {
    if (isSubjectOrCadeira(line) || isSkillLine(line) || /,/.test(line) || line.length < 50) {
      const chunks = line.split(/[\n•·|;,]/).map((s) => s.replace(/^[-–—]\s*/, "").trim());
      for (let s of chunks) {
        s = s.replace(/^(conhecimentos?\s*(b[aá]sicos?\s*(em)?)?)\s*/i, "").trim();
        if (s.length > 1 && s.length < 80 && !isContactLine(s) && !/^conhecimentos?$/i.test(s)) {
          parts.push(s);
        }
      }
    }
  }
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const key = normalize(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= 30) break;
  }
  return out;
}

function guessEducationLevel(course) {
  const n = normalize(course);
  if (/pos|mestrado|doutorado|mba|especializa/.test(n)) return "POS";
  if (/tecnologo|tecnico/.test(n)) return "TECNICO";
  if (/superior|bacharel|licenciatura|graduacao|ads|analise|sistemas|computacao/.test(n)) return "SUPERIOR";
  if (/fundamental/.test(n)) return "FUNDAMENTAL";
  return "MEDIO";
}

/**
 * Experiências: bloco = Cargo + Empresa (+ datas) + descrição.
 * Só aceita empresa se passar no classificador isCompanyLine.
 */
function parseExperiences(lines) {
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line || detectSection(line) || isContactLine(line) || isSkillLine(line)) {
      i += 1;
      continue;
    }

    if (!isJobTitleLine(line) && !JOB_TITLE_HINTS.test(line)) {
      i += 1;
      continue;
    }

    const position = line;
    let company = null;
    let cursor = i + 1;
    let isCurrent = false;
    const desc = [];

    // Skip date if immediately after title
    if (lines[cursor] && looksLikeDateLine(lines[cursor])) {
      isCurrent = /\b(atual|momento|presente|hoje|current|present)\b/i.test(lines[cursor]);
      cursor += 1;
    }

    // Next valid company line
    if (lines[cursor] && isCompanyLine(lines[cursor])) {
      company = lines[cursor];
      cursor += 1;
    }

    if (lines[cursor] && looksLikeDateLine(lines[cursor])) {
      isCurrent = /\b(atual|momento|presente|hoje|current|present)\b/i.test(lines[cursor]);
      cursor += 1;
    }

    while (cursor < lines.length) {
      const next = lines[cursor];
      if (detectSection(next)) break;
      // New job block starts with another title (+ company/date)
      if (
        isJobTitleLine(next) &&
        (isCompanyLine(lines[cursor + 1] || "") ||
          looksLikeDateLine(lines[cursor + 1] || "") ||
          isJobTitleLine(lines[cursor + 1] || ""))
      ) {
        break;
      }
      if (isSkillLine(next) || isSubjectOrCadeira(next)) break;
      if (!isContactLine(next)) desc.push(next);
      cursor += 1;
      if (cursor - i > 12) break;
    }

    if (company || desc.length || JOB_TITLE_HINTS.test(position)) {
      items.push({
        company: (company || "Empresa não informada").slice(0, 180),
        position: position.slice(0, 180),
        startDate: new Date("2020-01-01"),
        endDate: null,
        isCurrent,
        description: desc.join("\n").slice(0, 2000) || null,
      });
    }

    i = Math.max(cursor, i + 1);
    if (items.length >= 10) break;
  }
  return items;
}

/**
 * Formação: só instituição real + curso/nível.
 * Skills/cadeiras na seção educação são desviadas (retornadas em diverted).
 */
function parseEducations(lines) {
  const items = [];
  const divertedSkills = [];
  const divertedCourses = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line || detectSection(line) || isContactLine(line) || looksLikeDateLine(line)) {
      i += 1;
      continue;
    }

    if (isSkillLine(line) || isSubjectOrCadeira(line)) {
      if (isSubjectOrCadeira(line)) {
        divertedCourses.push({
          title: line.slice(0, 180),
          institution: "Disciplina curricular",
          completionDate: null,
          hours: null,
        });
      } else {
        divertedSkills.push(line);
      }
      i += 1;
      continue;
    }

    let institution = null;
    let course = null;

    if (isInstitutionLine(line) && isDegreeLine(lines[i + 1] || "")) {
      institution = line;
      course = lines[i + 1];
      i += 2;
    } else if (isDegreeLine(line) && isInstitutionLine(lines[i + 1] || "")) {
      course = line;
      institution = lines[i + 1];
      i += 2;
    } else if (isDegreeLine(line)) {
      course = line;
      institution = "Instituição de ensino";
      i += 1;
    } else if (isInstitutionLine(line)) {
      institution = line;
      if (isDegreeLine(lines[i + 1] || "")) {
        course = lines[i + 1];
        i += 2;
      } else if (lines[i + 1] && !isSkillLine(lines[i + 1]) && !isSubjectOrCadeira(lines[i + 1]) && !looksLikeDateLine(lines[i + 1])) {
        // "AESA" + "Análise e Desenvolvimento..."
        course = lines[i + 1];
        i += 2;
      } else {
        course = "Formação";
        i += 1;
      }
    } else if (DEGREE_HINTS.test(line) || /desenvolvimento|administra|sistemas|pedagog/i.test(line)) {
      // Course name without clear institution marker
      if (isSkillLine(line) || isSubjectOrCadeira(line)) {
        divertedSkills.push(line);
        i += 1;
        continue;
      }
      course = line;
      institution = "Instituição de ensino";
      i += 1;
    } else {
      // Unknown line in education — if short tech-like → skill, else skip
      if (isSkillLine(line) || line.length < 35) divertedSkills.push(line);
      i += 1;
      continue;
    }

    if (looksLikeDateLine(lines[i] || "")) i += 1;

    // Guard: never allow skill/cadeira as institution
    if (institution && (isSkillLine(institution) || isSubjectOrCadeira(institution))) {
      divertedSkills.push(institution);
      institution = "Instituição de ensino";
    }
    if (course && (isSkillLine(course) && !DEGREE_HINTS.test(course))) {
      divertedSkills.push(course);
      course = null;
    }

    if (institution && course) {
      items.push({
        institution: institution.slice(0, 180),
        course: course.slice(0, 180),
        level: guessEducationLevel(course + " " + institution),
        status: "CONCLUIDO",
        startDate: null,
        endDate: null,
      });
    }

    if (items.length >= 8) break;
  }

  return { items, divertedSkills, divertedCourses };
}

function parseCourses(lines) {
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const title = lines[i];
    if (!title || isContactLine(title) || detectSection(title) || looksLikeDateLine(title)) {
      i += 1;
      continue;
    }
    // Skip pure degree lines (belong to education)
    if (isDegreeLine(title) && isInstitutionLine(lines[i + 1] || "")) {
      i += 1;
      continue;
    }

    let institution = "Instituição";
    if (lines[i + 1] && isInstitutionLine(lines[i + 1])) {
      institution = lines[i + 1];
      i += 2;
    } else if (lines[i + 1] && !isSkillLine(lines[i + 1]) && !looksLikeDateLine(lines[i + 1]) && lines[i + 1].length < 60) {
      institution = lines[i + 1];
      i += 2;
    } else {
      i += 1;
    }
    if (looksLikeDateLine(lines[i] || "")) i += 1;

    items.push({
      title: title.slice(0, 180),
      institution: institution.slice(0, 180),
      completionDate: null,
      hours: null,
    });
    if (items.length >= 15) break;
  }
  return items;
}

function mergeSkills(base, extraLines) {
  const extra = parseSkills(extraLines);
  const seen = new Set(base.map((s) => normalize(s)));
  const out = [...base];
  for (const s of extra) {
    const k = normalize(s);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out.slice(0, 30);
}

function parseBrazilianResume(rawText) {
  const lines = cleanLines(rawText);
  const sections = splitSections(lines);
  const fullText = lines.join("\n");

  const preambleUseful = sections.preamble.filter((l) => !isContactLine(l));
  const fullName =
    preambleUseful.find(isNameLine) ||
    lines.find(isNameLine) ||
    preambleUseful[0] ||
    undefined;

  const objectiveText = sections.objective.join(" ").replace(/\s+/g, " ").trim();
  const summaryText = sections.summary.join(" ").replace(/\s+/g, " ").trim();

  let headline = headlineFromObjective(sections.objective);
  if (!headline && sections.objective.length === 0) {
    const candidate = preambleUseful.find(
      (l, idx) =>
        idx > 0 &&
        l.length > 8 &&
        l.length < 140 &&
        !isContactLine(l) &&
        !detectSection(l) &&
        JOB_TITLE_HINTS.test(l),
    );
    if (candidate) headline = candidate.slice(0, 120);
  }
  if (!headline && objectiveText) headline = objectiveText.slice(0, 120);
  if (headline && isContactLine(headline)) headline = undefined;

  let summary = summaryText;
  if (!summary && objectiveText && objectiveText.length > 40) {
    summary = objectiveText.slice(0, 900);
  }
  if (summary && isContactLine(summary) && summary.length < 120) summary = undefined;

  let skills = parseSkills(sections.skills);
  // Skills that leaked into preamble (rare)
  skills = mergeSkills(
    skills,
    sections.preamble.filter((l) => isSkillLine(l) || isSubjectOrCadeira(l)),
  );

  const experiences = parseExperiences(sections.experience);
  const edu = parseEducations(sections.education);
  let educationsOut = edu.items;
  skills = mergeSkills(skills, edu.divertedSkills);

  let courses = [...parseCourses(sections.courses), ...edu.divertedCourses];

  // Cadeiras na seção cursos já entram em courses; skills soltas na seção cursos → skills
  const courseSkillLeak = [];
  courses = courses.filter((c) => {
    if (isSkillLine(c.title) && !isSubjectOrCadeira(c.title) && c.institution === "Instituição") {
      courseSkillLeak.push(c.title);
      return false;
    }
    return true;
  });
  skills = mergeSkills(skills, courseSkillLeak);

  if (!educationsOut.length) {
    const eduMatch = fullText.match(
      /(?:ensino\s+(?:fundamental|m[eé]dio|t[eé]cnico|superior)|bacharel|licenciatura|tecn[oó]logo|ads|an[aá]lise\s+e\s+desenvolvimento)[^\n]{0,100}/i,
    );
    if (eduMatch && !isSkillLine(eduMatch[0]) && !isSubjectOrCadeira(eduMatch[0])) {
      educationsOut = [
        {
          institution: "Instituição de ensino",
          course: eduMatch[0].trim().slice(0, 180),
          level: guessEducationLevel(eduMatch[0]),
          status: "CONCLUIDO",
          startDate: null,
          endDate: null,
        },
      ];
    }
  }

  if (!headline) {
    headline = fullName ? `Profissional — ${fullName}` : "Currículo importado";
  }

  return {
    fullName: fullName ? String(fullName).slice(0, 120) : undefined,
    headline: String(headline).slice(0, 160),
    summary: summary ? String(summary).slice(0, 900) : undefined,
    email: extractEmail(rawText),
    skills,
    experiences,
    educations: educationsOut,
    courses,
    source: "pdf",
  };
}

function hasStructuredContent(data) {
  return Boolean(
    (data.experiences && data.experiences.length) ||
      (data.educations && data.educations.length) ||
      (data.courses && data.courses.length) ||
      (data.skills && data.skills.length) ||
      (data.summary && data.summary.length > 20) ||
      data.headline,
  );
}

function isContactLikeField(value) {
  return isContactLine(String(value || ""));
}

module.exports = {
  parseBrazilianResume,
  hasStructuredContent,
  isContactLine,
  isContactLikeField,
  isSkillLine,
  isInstitutionLine,
  isCompanyLine,
  isSubjectOrCadeira,
  detectSection,
  cleanLines,
  headlineFromObjective,
  parseExperiences,
  parseEducations,
};
