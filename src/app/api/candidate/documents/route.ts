import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { parseResumeFile } from "@/lib/matching/resume-parser";
import { looksLikeLinkedInResume, parseLinkedInProfileText } from "@/lib/linkedin/parse-profile-text";
import { applyLinkedInDataToCandidate } from "@/lib/linkedin/apply-to-resume";

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
    const stored = await saveFile(buffer, file.name, file.type || "application/octet-stream");

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
        parseStatus: "PENDING",
      },
    });

    // Extrai texto do anexo para o ATS (não bloqueia o fluxo se falhar)
    try {
      const parsed = await parseResumeFile(stored.fileKey, stored.mimeType, stored.fileName);
      await prisma.candidateDocument.update({
        where: { id: doc.id },
        data: {
          parsedText: parsed.text || null,
          parsedAt: new Date(),
          parseStatus: parsed.status,
        },
      });

      if (
        documentType === "RESUME" &&
        parsed.status === "OK" &&
        parsed.text &&
        looksLikeLinkedInResume(parsed.text)
      ) {
        try {
          const linkedIn = parseLinkedInProfileText(parsed.text);
          await applyLinkedInDataToCandidate(session.userId, linkedIn, {
            replaceStructured: true,
          });
          await logAudit({
            userId: session.userId,
            action: "DOCUMENT_UPLOADED",
            resourceType: "CandidateDocument",
            resourceId: doc.id,
            details: { fileName: file.name, fileSize: file.size, linkedIn: true },
          });
          return formRedirect(new URL("/painel/curriculo?sucesso=linkedin_anexo", req.url));
        } catch (linkedInErr) {
          console.warn("Import LinkedIn a partir do anexo falhou:", linkedInErr);
        }
      }
    } catch (parseError) {
      console.warn("Parse do documento falhou no upload:", doc.id, parseError);
      await prisma.candidateDocument.update({
        where: { id: doc.id },
        data: { parseStatus: "FAILED", parsedAt: new Date() },
      });
    }

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
