import { createRequire } from "module";
import path from "path";
import mammoth from "mammoth";
import { readLocalFile } from "@/lib/storage/storage";
import { isPdfFile, isWordFile } from "@/lib/resume/files";

export type ParseResult = {
  text: string;
  status: "OK" | "FAILED" | "UNSUPPORTED";
};

// Âncora estável para o Node resolver pdf-parse fora do bundle Webpack
const nodeRequire = createRequire(path.join(process.cwd(), "package.json"));

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
    return (result.text || "").replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return (result.value || "").replace(/\s+/g, " ").trim();
}

export async function parseResumeFile(fileKey: string, mimeType: string, fileName: string): Promise<ParseResult> {
  try {
    const buffer = await readLocalFile(fileKey);
    if (!buffer) return { text: "", status: "FAILED" };

    if (isPdfFile(mimeType, fileName)) {
      const text = await extractPdfText(buffer);
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    if (isWordFile(mimeType, fileName)) {
      const text = await extractDocxText(buffer);
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    if (mimeType.startsWith("text/") || /\.txt$/i.test(fileName)) {
      const text = buffer.toString("utf8").replace(/\s+/g, " ").trim();
      return { text, status: text.length > 20 ? "OK" : "FAILED" };
    }

    return { text: "", status: "UNSUPPORTED" };
  } catch (error) {
    console.error("Falha ao parsear currículo:", fileKey, error);
    return { text: "", status: "FAILED" };
  }
}
