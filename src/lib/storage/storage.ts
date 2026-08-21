import fs from "fs";
import os from "os";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function localStorageDir() {
  // No Vercel o filesystem do projeto é read-only; /tmp funciona.
  if (process.env.VERCEL || process.env.STORAGE_USE_TMP === "1") {
    return path.join(os.tmpdir(), "emprega-arcoverde-uploads");
  }
  return path.join(process.cwd(), "uploads");
}

export interface StoredFileInfo {
  fileKey: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

function bucketName() {
  return (
    process.env.STORAGE_BUCKET?.trim() ||
    process.env.SUPABASE_STORAGE_BUCKET?.trim() ||
    "emprega-arcoverde-docs"
  );
}

function supabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function useSupabaseStorage() {
  if (process.env.STORAGE_DRIVER === "local") return false;
  if (process.env.STORAGE_DRIVER === "supabase") return true;
  return Boolean(supabaseAdmin());
}

function makeFileKey(originalName: string) {
  const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
}

async function uploadToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  fileKey: string,
): Promise<StoredFileInfo> {
  const client = supabaseAdmin();
  if (!client) {
    throw new Error("Supabase Storage não configurado (SERVICE_ROLE_KEY / URL).");
  }
  const { error } = await client.storage.from(bucketName()).upload(fileKey, buffer, {
    contentType: mimeType || "application/octet-stream",
    upsert: false,
  });
  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(`Falha ao enviar arquivo: ${error.message}`);
  }
  return {
    fileKey,
    fileName: originalName,
    fileSize: buffer.length,
    mimeType,
    url: `/api/documents/${fileKey}`,
  };
}

/** Salva arquivo (Supabase; fallback local/tmp). Nunca engole o erro sem tentar fallback. */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFileInfo> {
  const fileKey = makeFileKey(originalName);

  if (useSupabaseStorage()) {
    try {
      return await uploadToSupabase(buffer, originalName, mimeType, fileKey);
    } catch (err) {
      console.warn("Storage Supabase falhou; tentando disco local/tmp:", err);
      return saveFileLocally(buffer, originalName, mimeType, fileKey);
    }
  }

  return saveFileLocally(buffer, originalName, mimeType, fileKey);
}

/**
 * Tenta salvar; se falhar, retorna null em vez de lançar.
 * Útil para não bloquear o preenchimento do currículo.
 */
export async function trySaveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFileInfo | null> {
  try {
    return await saveFile(buffer, originalName, mimeType);
  } catch (err) {
    console.error("trySaveFile falhou:", err);
    return null;
  }
}

export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  forcedKey?: string,
): Promise<StoredFileInfo> {
  const dir = localStorageDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const fileKey = forcedKey || makeFileKey(originalName);
  const filePath = path.join(dir, fileKey);
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
  return `/api/documents/${fileKey}`;
}

export async function readFile(fileKey: string): Promise<Buffer | null> {
  if (useSupabaseStorage()) {
    const client = supabaseAdmin();
    if (client) {
      const { data, error } = await client.storage.from(bucketName()).download(fileKey);
      if (!error && data) {
        const ab = await data.arrayBuffer();
        return Buffer.from(ab);
      }
    }
  }
  return readLocalFileOnly(fileKey);
}

export async function readLocalFile(fileKey: string): Promise<Buffer | null> {
  return readFile(fileKey);
}

async function readLocalFileOnly(fileKey: string): Promise<Buffer | null> {
  const candidates = [
    path.join(localStorageDir(), fileKey),
    path.join(process.cwd(), "uploads", fileKey),
    path.join(os.tmpdir(), "emprega-arcoverde-uploads", fileKey),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath);
    }
  }
  return null;
}
