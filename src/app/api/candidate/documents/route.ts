import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFileLocally } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return formRedirect(new URL("/entrar", req.url));
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return formRedirect(new URL("/painel/perfil", req.url));
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const documentType = (formData.get("documentType") as string) || "RESUME";

    if (!file || file.size === 0) {
      return formRedirect(new URL("/painel/curriculo?erro=arquivo_obrigatorio", req.url));
    }

    // Validação de limite de 10MB
    if (file.size > 10 * 1024 * 1024) {
      return formRedirect(new URL("/painel/curriculo?erro=arquivo_muito_grande", req.url));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await saveFileLocally(buffer, file.name, file.type || "application/octet-stream");

    const doc = await prisma.candidateDocument.create({
      data: {
        candidateId: profile.id,
        title: file.name,
        fileKey: stored.fileKey,
        fileName: stored.fileName,
        fileSize: stored.fileSize,
        mimeType: stored.mimeType,
        documentType,
        uploadedById: session.userId,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "DOCUMENT_UPLOADED",
      resourceType: "CandidateDocument",
      resourceId: doc.id,
      details: { fileName: file.name, fileSize: file.size },
    });

    return formRedirect(new URL("/painel/curriculo?sucesso=anexo_enviado", req.url));
  } catch (error) {
    console.error("Erro no upload de documento:", error);
    return formRedirect(new URL("/painel/curriculo?erro=falha_upload", req.url));
  }
}
