import fs from "fs";
import path from "path";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

export interface StoredFileInfo {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<StoredFileInfo> {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }

  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileKey = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
  const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);

  await fs.promises.writeFile(filePath, buffer);

  return {
    fileKey,
    fileName: originalName,
    fileSize: buffer.length,
    mimeType,
    url: `/api/documents/${fileKey}`,
  };
}

export async function getFileSignedUrl(fileKey: string, _expiresInSeconds = 300): Promise<string> {
  // Ponto de integração para S3 presigned URLs:
  // Se S3 configurado, gera AWS S3 Presigned URL.
  // Em dev / local, retorna o endpoint seguro de autorização:
  return `/api/documents/${fileKey}`;
}

export async function readLocalFile(fileKey: string): Promise<Buffer | null> {
  const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);
  if (!fs.existsSync(filePath)) return null;
  return await fs.promises.readFile(filePath);
}
