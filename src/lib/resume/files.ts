export function isPdfFile(mimeType: string, fileName: string) {
  return mimeType.includes("pdf") || /\.pdf$/i.test(fileName);
}

export function isWordFile(mimeType: string, fileName: string) {
  return (
    mimeType.includes("word") ||
    mimeType.includes("msword") ||
    mimeType.includes("officedocument.wordprocessing") ||
    /\.docx?$/i.test(fileName)
  );
}

export function pickResumeDocument<T extends { documentType: string; mimeType: string; fileName: string }>(
  documents: T[]
): T | null {
  if (!documents.length) return null;
  const resumes = documents.filter((d) => d.documentType === "RESUME");
  const pool = resumes.length ? resumes : documents;
  return (
    pool.find((d) => isPdfFile(d.mimeType, d.fileName)) ||
    pool.find((d) => isWordFile(d.mimeType, d.fileName)) ||
    pool[0]
  );
}

export const educationLabels: Record<string, string> = {
  FUNDAMENTAL: "Ensino Fundamental",
  MEDIO: "Ensino Médio",
  TECNICO: "Ensino Técnico",
  SUPERIOR: "Ensino Superior",
  POS: "Pós-graduação",
};
