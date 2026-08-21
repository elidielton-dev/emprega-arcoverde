/**
 * Parser de currículos brasileiros (PDF/DOCX → texto).
 * Mapeia seções típicas para os campos do formulário Emprega Arcoverde.
 *
 * Modelos cobertos:
 * 1) Clássico BR: Nome → Contato → Objetivo → Experiência → Formação → Cursos → Habilidades
 * 2) Com Resumo/Perfil separado do Objetivo
 * 3) LinkedIn-like / seções em inglês misturadas
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
  // PDF colado: força quebras antes de cabeçalhos
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
    // Só quebra quando o cabeçalho está sozinho na linha (não no meio da frase)
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

function detectSection(line) {
  const n = normalize(line);
  if (!n || n.length > 70) return null;
  // Exige linha quase só com o cabeçalho (evita "conhecimentos básicos em Java")
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
  if (/\b(rua|av\.|avenida|travessa|bairro|cep|cidade)\b/.test(n)) return true;
  if (/^\(?\d{2}\)?\s?\d{4,5}/.test(n.replace(/\s/g, ""))) return true;
  if (/\d{4,5}[-\s]?\d{4}/.test(line) && line.length < 40) return true;
  if (/linkedin\.com|github\.com|whatsapp/i.test(line)) return true;
  // Endereço misturado com tel/email na mesma linha (caso do usuário)
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
  // Prefer lines that look like people names (2+ words, mostly letters)
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  const letterRatio = (line.replace(/[^A-Za-zÀ-ÿ]/g, "").length || 0) / line.length;
  return letterRatio > 0.7;
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

  // "Atuar como Developer Júnior, ..." → "Developer Júnior"
  const asRole = text.match(
    /atuar\s+como\s+([^,.\n]{3,60})/i,
  );
  if (asRole) return asRole[1].trim().slice(0, 120);

  const short = text.split(/[.\n]/)[0].trim();
  if (short.length <= 120) return short;
  return short.slice(0, 117) + "…";
}

function parseSkills(lines) {
  const blob = lines.join("\n");
  const parts = blob
    .split(/[\n•·|;,]/)
    .map((s) => s.replace(/^[-–—]\s*/, "").trim())
    .map((s) => s.replace(/^(conhecimentos?\s*(b[aá]sicos?\s*(em)?)?)\s*/i, "").trim())
    .filter((s) => s.length > 1 && s.length < 80)
    .filter((s) => !/^conhecimentos?$/i.test(s))
    .filter((s) => !isContactLine(s));

  // Dedup case-insensitive
  const seen = new Set();
  const out = [];
  for (const p of parts) {
    const key = normalize(p);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length >= 25) break;
  }
  return out;
}

function looksLikeDateLine(line) {
  const n = normalize(line);
  return (
    /\b(19|20)\d{2}\b/.test(n) &&
    (/\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|feb|apr|may|aug|sep|oct|dec)\b/.test(n) ||
      /\s[-–—]\s/.test(line) ||
      /\b(atual|momento|presente|hoje|current|present)\b/.test(n))
  );
}

function parseExperiences(lines) {
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const a = lines[i];
    const b = lines[i + 1];
    if (!a) break;

    // Pattern: Cargo \n Empresa \n datas?
    if (b && !looksLikeDateLine(a) && !detectSection(a)) {
      let position = a;
      let company = b;
      let cursor = i + 2;
      let isCurrent = false;
      const desc = [];

      if (looksLikeDateLine(b)) {
        // Cargo \n datas (empresa desconhecida)
        company = "Empresa";
        cursor = i + 2;
        isCurrent = /\b(atual|momento|presente|hoje|current)\b/i.test(b);
      } else if (lines[cursor] && looksLikeDateLine(lines[cursor])) {
        isCurrent = /\b(atual|momento|presente|hoje|current)\b/i.test(lines[cursor]);
        cursor += 1;
      }

      while (cursor < lines.length) {
        const next = lines[cursor];
        const next2 = lines[cursor + 1];
        if (
          next &&
          next2 &&
          !looksLikeDateLine(next) &&
          (looksLikeDateLine(next2) || cursor + 2 >= lines.length) &&
          !isContactLine(next)
        ) {
          // possible new job block
          break;
        }
        if (detectSection(next)) break;
        desc.push(next);
        cursor += 1;
        if (cursor - i > 10) break;
      }

      if (!isContactLine(position) && position.length > 1) {
        items.push({
          company: company.slice(0, 180),
          position: position.slice(0, 180),
          startDate: new Date("2020-01-01"),
          endDate: null,
          isCurrent,
          description: desc.join("\n").slice(0, 2000) || null,
        });
      }
      i = Math.max(cursor, i + 2);
    } else {
      i += 1;
    }
    if (items.length >= 8) break;
  }
  return items;
}

function guessEducationLevel(course) {
  const n = normalize(course);
  if (/pos|mestrado|doutorado|mba|especializa/.test(n)) return "POS";
  if (/tecnologo|tecnico/.test(n)) return "TECNICO";
  if (/superior|bacharel|licenciatura|graduacao|ads|analise/.test(n)) return "SUPERIOR";
  if (/fundamental/.test(n)) return "FUNDAMENTAL";
  return "MEDIO";
}

function parseEducations(lines) {
  const items = [];
  let i = 0;
  while (i < lines.length) {
    const institution = lines[i];
    const course = lines[i + 1] || institution;
    if (!institution || isContactLine(institution)) {
      i += 1;
      continue;
    }
    // Single line: "Ensino Médio — Escola X"
    if (!lines[i + 1] || looksLikeDateLine(lines[i + 1]) || detectSection(lines[i + 1])) {
      const one = institution;
      const parts = one.split(/\s[-–—|]\s/);
      items.push({
        institution: (parts[1] || "Instituição de ensino").slice(0, 180),
        course: (parts[0] || one).slice(0, 180),
        level: guessEducationLevel(one),
        status: "CONCLUIDO",
        startDate: null,
        endDate: null,
      });
      i += 1;
    } else {
      items.push({
        institution: institution.slice(0, 180),
        course: course.slice(0, 180),
        level: guessEducationLevel(course + " " + institution),
        status: "CONCLUIDO",
        startDate: null,
        endDate: null,
      });
      i += 2;
      if (lines[i] && looksLikeDateLine(lines[i])) i += 1;
    }
    if (items.length >= 6) break;
  }
  return items;
}

function parseCourses(lines) {
  const items = [];
  for (let i = 0; i < lines.length; i++) {
    const title = lines[i];
    if (!title || isContactLine(title) || detectSection(title) || looksLikeDateLine(title)) continue;
    const institution =
      lines[i + 1] && !looksLikeDateLine(lines[i + 1]) && !detectSection(lines[i + 1])
        ? lines[i + 1]
        : "Instituição";
    items.push({
      title: title.slice(0, 180),
      institution: institution.slice(0, 180),
      completionDate: null,
      hours: null,
    });
    if (institution !== "Instituição") i += 1;
    if (items.length >= 12) break;
  }
  return items;
}

/**
 * @param {string} rawText
 * @returns {import('./types').LinkedInProfileData-like}
 */
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

  // Título = objetivo curto (NUNCA endereço/contato)
  let headline = headlineFromObjective(sections.objective);
  if (!headline && sections.objective.length === 0) {
    // Alguns CVs põem o cargo desejado no preamble (após nome, sem cabeçalho)
    const candidate = preambleUseful.find(
      (l, idx) =>
        idx > 0 &&
        l.length > 8 &&
        l.length < 140 &&
        !isContactLine(l) &&
        !detectSection(l) &&
        /desenvolvedor|developer|analista|assistente|auxiliar|vendedor|atendente|estagi[aá]rio|junior|júnior|pleno|s[eê]nior/i.test(
          l,
        ),
    );
    if (candidate) headline = candidate.slice(0, 120);
  }
  if (!headline && objectiveText) {
    headline = objectiveText.slice(0, 120);
  }
  if (headline && isContactLine(headline)) {
    headline = undefined;
  }

  // Sobre = resumo/perfil; se só houver objetivo longo, usa o objetivo completo no resumo
  // e mantém headline curto. NÃO cola endereço/telefone no resumo.
  let summary = summaryText;
  if (!summary && objectiveText && objectiveText.length > 40) {
    summary = objectiveText.slice(0, 900);
  }
  if (summary && isContactLine(summary) && summary.length < 120) {
    summary = undefined;
  }

  const skills = parseSkills(sections.skills);
  const experiences = parseExperiences(sections.experience);
  const educations = parseEducations(sections.education);
  const courses = parseCourses(sections.courses);

  // Fallback formação no texto inteiro
  let educationsOut = educations;
  if (!educationsOut.length) {
    const eduMatch = fullText.match(
      /(?:ensino\s+(?:fundamental|m[eé]dio|t[eé]cnico|superior)|bacharel|licenciatura|tecn[oó]logo|ads|an[aá]lise\s+e\s+desenvolvimento)[^\n]{0,100}/i,
    );
    if (eduMatch) {
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
  detectSection,
  cleanLines,
  headlineFromObjective,
};
