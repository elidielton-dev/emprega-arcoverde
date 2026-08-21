import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { saveFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { parseResumeFile } from "@/lib/matching/resume-parser";
import { parseLinkedInProfileText } from "@/lib/linkedin/parse-profile-text";
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
    const file = formData.get("file") as File | null;
    const pasted = String(formData.get("pastedText") || "").trim();

    if ((!file || file.size === 0) && pasted.length < 40) {
      return formRedirect(new URL("/painel/importar-linkedin?erro=arquivo_obrigatorio", req.url));
    }

    let rawText = pasted;
    let docId: string | null = null;

    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return formRedirect(new URL("/painel/importar-linkedin?erro=arquivo_muito_grande", req.url));
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const stored = await saveFile(buffer, file.name, file.type || "application/octet-stream");

      const doc = await prisma.candidateDocument.create({
        data: {
          candidateId: profile.id,
          title: `LinkedIn — ${file.name}`,
          fileKey: stored.fileKey,
          fileName: stored.fileName,
          fileSize: stored.fileSize,
          mimeType: stored.mimeType,
          documentType: "RESUME",
          uploadedById: session.userId,
          parseStatus: "PENDING",
        },
      });
      docId = doc.id;

      const parsed = await parseResumeFile(stored.fileKey, stored.mimeType, stored.fileName);
      await prisma.candidateDocument.update({
        where: { id: doc.id },
        data: {
          parsedText: parsed.text || null,
          parsedAt: new Date(),
          parseStatus: parsed.status,
        },
      });

      if (parsed.status === "OK" && parsed.text) {
        rawText = parsed.text;
      } else if (!pasted) {
        return formRedirect(new URL("/painel/importar-linkedin?erro=parse_falhou", req.url));
      }
    }

    const linkedIn = parseLinkedInProfileText(rawText);
    const result = await applyLinkedInDataToCandidate(session.userId, linkedIn, {
      replaceStructured: true,
    });

    await logAudit({
      userId: session.userId,
      action: "LINKEDIN_RESUME_IMPORTED",
      resourceType: "CandidateProfile",
      resourceId: profile.id,
      details: {
        documentId: docId,
        filled: result.applied ? result.filled : null,
        source: linkedIn.source,
      },
    });

    const q = new URLSearchParams({
      sucesso: "importado",
      exp: String(linkedIn.experiences.length),
      edu: String(linkedIn.educations.length),
      cursos: String(linkedIn.courses.length),
      skills: String(linkedIn.skills.length),
    });
    return formRedirect(new URL(`/painel/curriculo?${q.toString()}`, req.url));
  } catch (error) {
    console.error("Erro na importação LinkedIn:", error);
    return formRedirect(new URL("/painel/importar-linkedin?erro=falha", req.url));
  }
}
