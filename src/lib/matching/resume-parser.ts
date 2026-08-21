import { createRequire } from "module";
import path from "path";
import mammoth from "mammoth";
import { readLocalFile } from "@/lib/storage/storage";
import { isPdfFile, isWordFile } from "@/lib/resume/files";

export type ParseResult = {
  text: string;
  status: "OK" | "FAILED" | "UNSUPPORTED";
};

const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));

/** Mantém quebras de linha (necessárias para preencher o formulário). */
function tidyText(raw: string, preserveLines = true): string {
  let text = (raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (preserveLines) {
    return text
      .split("\n")
      .map((l) => l.replace(/[ \t]+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return text.replace(/\s+/g, " ").trim();
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParseMod = nodeRequire("pdf-parse") as {
    PDFParse: new (opts: { data: Buffer | Uint8Array }) => {
      getText: () => Promise<{ text?: string }>;
      destroy: () => Promise<void>;
    };
  };
  const parser = new pdfParseMod.PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return tidyText(result.text || "", true);
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return tidyText(result.value || "", true);
}

export async function parseResumeBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName: string,
): Promise<ParseResult> {
  try {
    if (!buffer?.length) return { text: "", status: "FAILED" };

    if (isPdfFile(mimeType, fileName)) {
      const text = await extractPdfText(buffer);
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    if (isWordFile(mimeType, fileName)) {
      const text = await extractDocxText(buffer);
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    if (mimeType.startsWith("text/") || /\.txt$/i.test(fileName)) {
      const text = tidyText(buffer.toString("utf8"), true);
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    // Imagens: salva o anexo, mas não extrai texto sem OCR
    if (mimeType.startsWith("image/") || /\.(png|jpe?g|webp)$/i.test(fileName)) {
      return { text: "", status: "UNSUPPORTED" };
    }

    return { text: "", status: "UNSUPPORTED" };
  } catch (error) {
    console.error("Falha ao parsear currículo (buffer):", fileName, error);
    return { text: "", status: "FAILED" };
  }
}

export async function parseResumeFile(fileKey: string, mimeType: string, fileName: string): Promise<ParseResult> {
  try {
    const buffer = await readLocalFile(fileKey);
    if (!buffer) return { text: "", status: "FAILED" };
    return parseResumeBuffer(buffer, mimeType, fileName);
  } catch (error) {
    console.error("Falha ao parsear currículo:", fileKey, error);
    return { text: "", status: "FAILED" };
  }
}
