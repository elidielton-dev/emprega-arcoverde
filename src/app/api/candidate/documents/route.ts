import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { parseResumeBuffer } from "@/lib/matching/resume-parser";
import { applyLinkedInDataToCandidate } from "@/lib/linkedin/apply-to-resume";
import { hasStructuredContent, parseResumeToStructured } from "@/lib/resume/parse-structured";

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

    if (file.size > 10 * 1024 * 1024) {
      return formRedirect(new URL("/painel/curriculo?erro=arquivo_muito_grande", req.url));
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";

    // Extrai texto em memória (não depende de ler o storage de volta)
    const parsed = await parseResumeBuffer(buffer, mimeType, file.name);

    const stored = await saveFile(buffer, file.name, mimeType);

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
        parsedText: parsed.text || null,
        parsedAt: new Date(),
        parseStatus: parsed.status,
      },
    });

    let filled = false;
    if (documentType === "RESUME" && parsed.status === "OK" && parsed.text) {
      try {
        const structured = parseResumeToStructured(parsed.text);
        if (hasStructuredContent(structured)) {
          await applyLinkedInDataToCandidate(session.userId, structured, {
            replaceStructured: true,
          });
          filled = true;
        }
      } catch (fillErr) {
        console.warn("Preenchimento automático do currículo falhou:", fillErr);
      }
    }

    await logAudit({
      userId: session.userId,
      action: "DOCUMENT_UPLOADED",
      resourceType: "CandidateDocument",
      resourceId: doc.id,
      details: {
        fileName: file.name,
        fileSize: file.size,
        autoFilled: filled,
        parseStatus: parsed.status,
      },
    });

    if (filled) {
      return formRedirect(new URL("/painel/curriculo?sucesso=preenchido", req.url));
    }
    if (parsed.status === "UNSUPPORTED") {
      return formRedirect(new URL("/painel/curriculo?sucesso=anexo_enviado&aviso=sem_texto", req.url));
    }
    if (parsed.status === "FAILED") {
      return formRedirect(new URL("/painel/curriculo?sucesso=anexo_enviado&aviso=parse_falhou", req.url));
    }
    return formRedirect(new URL("/painel/curriculo?sucesso=anexo_enviado", req.url));
  } catch (error) {
    console.error("Erro no upload de documento:", error);
    return formRedirect(new URL("/painel/curriculo?erro=falha_upload", req.url));
  }
}
