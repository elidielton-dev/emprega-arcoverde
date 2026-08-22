import fs from "fs";
import os from "os";
import path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function isProductionRuntime() {
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
}

function localStorageDir() {
  if (process.env.STORAGE_USE_TMP === "1") {
    return path.join(os.tmpdir(), "emprega-arcoverde-uploads");
  }
  // Em Vercel /tmp é efêmero — só usar em desenvolvimento local.
  if (process.env.VERCEL) {
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

export function isSupabaseStorageConfigured() {
  return Boolean(supabaseAdmin());
}

/**
 * Em produção/Vercel: sempre Supabase (ignora STORAGE_DRIVER=local se as keys existirem).
 * Em desenvolvimento: Supabase se configurado; senão disco local.
 */
export function useSupabaseStorage() {
  const hasKeys = isSupabaseStorageConfigured();
  const driver = process.env.STORAGE_DRIVER?.trim().toLowerCase();

  if (isProductionRuntime()) {
    if (driver === "local" && hasKeys) {
      console.warn(
        "STORAGE_DRIVER=local ignorado em produção — usando Supabase (disco Vercel é efêmero).",
      );
    }
    return hasKeys;
  }

  if (driver === "local") return false;
  if (driver === "supabase") return true;
  return hasKeys;
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

/**
 * Salva arquivo. Em produção exige Supabase — não grava em /tmp como se fosse persistente.
 */
export async function saveFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<StoredFileInfo> {
  const fileKey = makeFileKey(originalName);

  if (useSupabaseStorage()) {
    return uploadToSupabase(buffer, originalName, mimeType, fileKey);
  }

  if (isProductionRuntime()) {
    throw new Error(
      "STORAGE_INDISPONIVEL: configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel. " +
        "Não usamos /tmp em produção (arquivos somem após redeploy).",
    );
  }

  return saveFileLocally(buffer, originalName, mimeType, fileKey);
}

/**
 * Tenta salvar; se falhar, retorna null.
 * Em produção sem Supabase, falha de propósito (null) — sem fingir sucesso em /tmp.
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
  if (isProductionRuntime() && process.env.VERCEL) {
    throw new Error("STORAGE_INDISPONIVEL: disco local não é permitido na Vercel.");
  }

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
  if (isProductionRuntime() && process.env.VERCEL) {
    return null;
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

/** Remove arquivo do storage (Supabase e/ou disco). Falhas são ignoradas. */
export async function tryDeleteFile(fileKey: string): Promise<void> {
  if (!fileKey) return;

  if (useSupabaseStorage() || isSupabaseStorageConfigured()) {
    const client = supabaseAdmin();
    if (client) {
      try {
        await client.storage.from(bucketName()).remove([fileKey]);
      } catch (err) {
        console.warn("Falha ao remover do Supabase Storage:", err);
      }
    }
  }

  if (isProductionRuntime() && process.env.VERCEL) return;

  const candidates = [
    path.join(localStorageDir(), fileKey),
    path.join(process.cwd(), "uploads", fileKey),
    path.join(os.tmpdir(), "emprega-arcoverde-uploads", fileKey),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (err) {
      console.warn("Falha ao remover arquivo local:", filePath, err);
    }
  }
}
