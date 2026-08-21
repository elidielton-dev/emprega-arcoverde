const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const { createRequire } = require("module");

// Carrega módulos TS via ts-node não disponível — duplica as regras críticas em JS puro
// e valida pdf-parse + heurísticas espelhadas do código de produção.

const requireFromRoot = createRequire(path.join(process.cwd(), "package.json"));

function looksLikeResumeText(text) {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length < 80) return false;
  const lower = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const keywords = [
    "experiencia",
    "formacao",
    "objetivo",
    "curriculo",
    "habilidade",
    "empresa",
    "cargo",
    "profissional",
    "resumo",
    "curso",
    "trabalho",
    "telefone",
    "email",
  ];
  const hits = keywords.filter((k) => lower.includes(k)).length;
  const hasContact =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cleaned) ||
    /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/.test(cleaned);
  if (hits >= 2) return true;
  if (hits >= 1 && hasContact) return true;
  if (hits >= 1 && cleaned.length > 400) return true;
  return false;
}

function detectResumeMimeFromBuffer(buffer, fileName) {
  if (buffer.length < 5) return null;
  if (buffer.subarray(0, 4).toString("utf8") === "%PDF") return "application/pdf";
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const head = buffer.subarray(0, Math.min(buffer.length, 8000)).toString("latin1");
    if (head.includes("word/") || /\.docx$/i.test(fileName)) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  }
  return null;
}

function parseResumeToStructuredLite(rawText) {
  const text = (rawText || "").replace(/\r/g, "\n");
  const prepared = text
    .replace(/experiencia profissional/gi, "\nExperiência\n")
    .replace(/formacao academica/gi, "\nFormação\n")
    .replace(/objetivo/gi, "\nSobre\n");
  const lines = prepared
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const fullName = lines[0]?.slice(0, 120) || "Candidato";
  const summary = prepared.replace(/\s+/g, " ").trim().slice(0, 900);
  return {
    fullName,
    headline: `Profissional — ${fullName}`,
    summary,
    skills: [],
    experiences: [],
    educations: [],
    courses: [],
  };
}

describe("upload de currículo — validações", () => {
  it("detecta PDF pelos magic bytes", () => {
    const buf = Buffer.from("%PDF-1.4 rest of file");
    assert.equal(detectResumeMimeFromBuffer(buf, "cv.pdf"), "application/pdf");
  });

  it("rejeita executável disfarçado de pdf", () => {
    const buf = Buffer.from("MZ\x90\x00fake");
    assert.equal(detectResumeMimeFromBuffer(buf, "cv.pdf"), null);
  });

  it("reconhece texto de currículo", () => {
    const text =
      "Maria Silva. Objetivo: vaga administrativa. Experiencia em atendimento. Formacao: Ensino Medio. Habilidades: Excel, Word.";
    assert.equal(looksLikeResumeText(text), true);
  });

  it("rejeita texto sem relação com currículo", () => {
    const text = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.";
    assert.equal(looksLikeResumeText(text), false);
  });

  it("extrai nome e resumo mínimos do texto", () => {
    const structured = parseResumeToStructuredLite(
      "João Souza\nObjetivo auxiliar de vendas\nExperiencia profissional em comércio\nFormacao academica ensino medio",
    );
    assert.ok(structured.fullName.includes("João") || structured.fullName.length > 3);
    assert.ok(structured.summary.length > 40);
    assert.ok(structured.headline.includes("Profissional"));
  });
});

describe("pdf-parse no ambiente Node", () => {
  it("extrai texto de PDF mínimo com palavras de currículo", async () => {
    const { PDFParse } = requireFromRoot("pdf-parse");
    // PDF simples com string literal
    const content =
      "BT /F1 12 Tf 50 700 Td (Maria Silva Experiencia profissional e formacao academica) Tj ET";
    const pdf = Buffer.from(
      `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length ${content.length} >>stream
${content}
endstream
endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000068 00000 n 
0000000125 00000 n 
0000000279 00000 n 
0000000389 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
466
%%EOF`,
    );

    const parser = new PDFParse({ data: pdf });
    try {
      const result = await parser.getText();
      const text = (result.text || "").replace(/\s+/g, " ");
      assert.ok(text.length > 10, `texto curto: ${text}`);
      assert.match(text, /Experiencia|Maria|formacao/i);
    } finally {
      await parser.destroy();
    }
  });
});
