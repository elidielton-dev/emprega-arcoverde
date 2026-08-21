import { prisma } from "@/lib/db/prisma";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_UPLOADS_PER_HOUR = 5;
const MAX_RESUME_DOCS = 1;

const uploadHits = new Map<string, number[]>();

export type UploadRejectReason =
  | "tipo_invalido"
  | "arquivo_corrompido"
  | "arquivo_muito_grande"
  | "rate_limit"
  | "limite_anexos"
  | "nao_curriculo"
  | "sem_texto";

const ALLOWED_EXT = /\.pdf$/i;
const ALLOWED_DOCX = /\.docx$/i;

export function isAllowedResumeFileName(fileName: string) {
  return ALLOWED_EXT.test(fileName) || ALLOWED_DOCX.test(fileName);
}

export function detectResumeMimeFromBuffer(buffer: Buffer, fileName: string): string | null {
  if (buffer.length < 5) return null;

  // PDF
  if (buffer.subarray(0, 4).toString("utf8") === "%PDF") {
    return "application/pdf";
  }

  // DOCX = ZIP (PK) contendo word/
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    const head = buffer.subarray(0, Math.min(buffer.length, 8000)).toString("latin1");
    if (head.includes("word/") || ALLOWED_DOCX.test(fileName)) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
  }

  return null;
}

export function validateResumeFileBasics(file: {
  name: string;
  size: number;
  type?: string;
}, buffer: Buffer): { ok: true; mimeType: string } | { ok: false; reason: UploadRejectReason } {
  if (!file.name || !isAllowedResumeFileName(file.name)) {
    return { ok: false, reason: "tipo_invalido" };
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, reason: "arquivo_muito_grande" };
  }

  const mime = detectResumeMimeFromBuffer(buffer, file.name);
  if (!mime) {
    return { ok: false, reason: "arquivo_corrompido" };
  }

  return { ok: true, mimeType: mime };
}

/** Rate limit em memória por usuário (ok para 1 instância; em multi-instância pode afrouxar). */
export function checkUploadRateLimit(userId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const prev = (uploadHits.get(userId) || []).filter((t) => now - t < windowMs);
  if (prev.length >= MAX_UPLOADS_PER_HOUR) {
    uploadHits.set(userId, prev);
    return false;
  }
  prev.push(now);
  uploadHits.set(userId, prev);
  return true;
}

export async function checkResumeDocLimit(candidateId: string): Promise<boolean> {
  const count = await prisma.candidateDocument.count({
    where: { candidateId, documentType: "RESUME" },
  });
  return count < MAX_RESUME_DOCS;
}

const RESUME_KEYWORDS = [
  "experiencia",
  "experiência",
  "formacao",
  "formação",
  "educacao",
  "educação",
  "objetivo",
  "curriculo",
  "currículo",
  "habilidade",
  "competencia",
  "competência",
  "empresa",
  "cargo",
  "profissional",
  "resumo",
  "escolaridade",
  "curso",
  "certific",
  "trabalho",
  "atuacao",
  "atuação",
  "qualifica",
  "endereco",
  "endereço",
  "telefone",
  "whatsapp",
  "email",
  "e-mail",
  "linkedin",
  "ensino medio",
  "ensino médio",
  "superior",
  "tecnico",
  "técnico",
];

/**
 * Heurística: texto deve parecer currículo (não PDF aleatório).
 */
export function looksLikeResumeText(text: string): boolean {
  const cleaned = (text || "").replace(/\s+/g, " ").trim();
  if (cleaned.length < 80) return false;

  const lower = cleaned
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const hits = RESUME_KEYWORDS.filter((k) =>
    lower.includes(
      k
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase(),
    ),
  ).length;

  // Pelo menos 2 sinais de CV, ou 1 + e-mail/telefone
  const hasContact =
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cleaned) ||
    /(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/.test(cleaned);

  if (hits >= 2) return true;
  if (hits >= 1 && hasContact) return true;
  if (hits >= 1 && cleaned.length > 400) return true;
  return false;
}

export const UPLOAD_LIMITS = {
  MAX_BYTES,
  MAX_UPLOADS_PER_HOUR,
  MAX_RESUME_DOCS,
};
