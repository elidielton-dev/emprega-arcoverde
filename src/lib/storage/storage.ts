import fs from "fs";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

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

/** Salva arquivo (Supabase Storage em produção; disco local em fallback). */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFileInfo> {
  const fileKey = makeFileKey(originalName);

  if (useSupabaseStorage()) {
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

  return saveFileLocally(buffer, originalName, mimeType, fileKey);
}

/** @deprecated use saveFile — mantido para compatibilidade */
export async function saveFileLocally(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  forcedKey?: string,
): Promise<StoredFileInfo> {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }

  const fileKey = forcedKey || makeFileKey(originalName);
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
  return `/api/documents/${fileKey}`;
}

/** Lê arquivo do storage ativo (Supabase ou local). */
export async function readFile(fileKey: string): Promise<Buffer | null> {
  if (useSupabaseStorage()) {
    const client = supabaseAdmin();
    if (!client) return null;
    const { data, error } = await client.storage.from(bucketName()).download(fileKey);
    if (error || !data) {
      // Fallback: arquivo antigo ainda no disco local
      return readLocalFileOnly(fileKey);
    }
    const ab = await data.arrayBuffer();
    return Buffer.from(ab);
  }
  return readLocalFileOnly(fileKey);
}

/** @deprecated use readFile */
export async function readLocalFile(fileKey: string): Promise<Buffer | null> {
  return readFile(fileKey);
}

async function readLocalFileOnly(fileKey: string): Promise<Buffer | null> {
  const filePath = path.join(LOCAL_STORAGE_DIR, fileKey);
  if (!fs.existsSync(filePath)) return null;
  return fs.promises.readFile(filePath);
}
