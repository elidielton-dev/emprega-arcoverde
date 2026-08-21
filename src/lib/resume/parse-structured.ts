import type { LinkedInProfileData } from "@/lib/linkedin/types";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const brParser = require("./br-resume-parser.js") as {
  parseBrazilianResume: (rawText: string) => LinkedInProfileData;
  hasStructuredContent: (data: LinkedInProfileData) => boolean;
  isContactLikeField: (value: string) => boolean;
};

/**
 * Interpreta texto de PDF/DOCX de currículo brasileiro e mapeia
 * cada seção ao campo correto do formulário.
 *
 * Modelos: clássico BR (Objetivo/Experiência/Formação/Habilidades),
 * com Resumo separado, e LinkedIn-like.
 */
export function parseResumeToStructured(rawText: string): LinkedInProfileData {
  const parsed = brParser.parseBrazilianResume(rawText || "");

  // Cinto de segurança: nunca deixar endereço/telefone no título
  if (parsed.headline && brParser.isContactLikeField(parsed.headline)) {
    parsed.headline = parsed.fullName
      ? `Profissional — ${parsed.fullName}`
      : "Currículo importado";
  }
  if (
    parsed.summary &&
    brParser.isContactLikeField(parsed.summary) &&
    (parsed.summary?.length || 0) < 140
  ) {
    parsed.summary = undefined;
  }

  parsed.source = "pdf";
  return parsed;
}

export function hasStructuredContent(data: LinkedInProfileData): boolean {
  return brParser.hasStructuredContent(data);
}
