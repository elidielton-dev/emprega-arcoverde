import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { parseResumeBuffer } from "@/lib/matching/resume-parser";
import { applyParsedResumeToCandidate } from "@/lib/resume/apply-parsed";
import { hasStructuredContent, parseResumeToStructured } from "@/lib/resume/parse-structured";
import {
  checkResumeDocLimit,
  checkUploadRateLimit,
  looksLikeResumeText,
  validateResumeFileBasics,
} from "@/lib/resume/validate-upload";

function erro(url: string, code: string) {
  return formRedirect(new URL(`/painel/curriculo?erro=${code}`, url));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return formRedirect(new URL("/entrar", req.url));
    }

    if (!checkUploadRateLimit(session.userId)) {
      return erro(req.url, "rate_limit");
    }

    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return formRedirect(new URL("/painel/perfil", req.url));
    }

    if (!(await checkResumeDocLimit(profile.id))) {
      return erro(req.url, "limite_anexos");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = String(formData.get("documentType") || "RESUME");

    if (!file || file.size === 0) {
      return erro(req.url, "arquivo_obrigatorio");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const basics = validateResumeFileBasics(
      { name: file.name, size: file.size, type: file.type },
      buffer,
    );
    if (!basics.ok) {
      return erro(req.url, basics.reason);
    }

    const mimeType = basics.mimeType;
    const parsed = await parseResumeBuffer(buffer, mimeType, file.name);

    if (parsed.status === "FAILED" || !parsed.text || parsed.text.length < 40) {
      return erro(req.url, "sem_texto");
    }

    if (!looksLikeResumeText(parsed.text)) {
      return erro(req.url, "nao_curriculo");
    }

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
        parsedText: parsed.text,
        parsedAt: new Date(),
        parseStatus: "OK",
        scanStatus: "CLEAN",
      },
    });

    const structured = parseResumeToStructured(parsed.text);
    let filled = false;
    let fillDetails = {};

    if (hasStructuredContent(structured)) {
      try {
        const result = await applyParsedResumeToCandidate(session.userId, structured);
        filled = result.applied;
        fillDetails = result.applied ? result.filled : {};
      } catch (fillErr) {
        console.warn("Preenchimento automático falhou:", fillErr);
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
        ...fillDetails,
      },
    });

    if (filled) {
      return formRedirect(new URL("/painel/curriculo?sucesso=preenchido", req.url));
    }

    // Arquivo ok, mas parser fraco — ainda assim salva anexo
    return formRedirect(new URL("/painel/curriculo?sucesso=anexo_enviado&aviso=pouco_dado", req.url));
  } catch (error) {
    console.error("Erro no upload de documento:", error);
    return erro(req.url, "falha_upload");
  }
}
