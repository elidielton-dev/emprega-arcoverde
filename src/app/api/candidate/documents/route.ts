import { NextRequest, NextResponse } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { trySaveFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { parseResumeBuffer } from "@/lib/matching/resume-parser";
import { applyParsedResumeToCandidate } from "@/lib/resume/apply-parsed";
import { parseResumeToStructured } from "@/lib/resume/parse-structured";
import {
  checkResumeDocLimit,
  checkUploadRateLimit,
  looksLikeResumeText,
  validateResumeFileBasics,
} from "@/lib/resume/validate-upload";

export const runtime = "nodejs";
export const maxDuration = 30;

function wantsJson(req: NextRequest) {
  const accept = req.headers.get("accept") || "";
  return accept.includes("application/json") || req.headers.get("x-ea-fetch") === "1";
}

function respond(req: NextRequest, pathWithQuery: string, extra?: Record<string, unknown>) {
  if (wantsJson(req)) {
    const u = new URL(pathWithQuery, "http://local");
    const erro = u.searchParams.get("erro");
    return NextResponse.json(
      {
        ok: !erro,
        redirect: u.pathname + u.search,
        erro,
        sucesso: u.searchParams.get("sucesso"),
        ...extra,
      },
      { status: erro ? 400 : 200 },
    );
  }
  return formRedirect(new URL(pathWithQuery, req.url));
}

function safeDate(value: unknown, fallback = "2020-01-01"): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(fallback);
}

export async function POST(req: NextRequest) {
  let stage = "init";
  try {
    stage = "session";
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return respond(req, "/entrar");
    }

    stage = "rate_limit";
    if (!checkUploadRateLimit(session.userId)) {
      return respond(req, "/painel/curriculo?erro=rate_limit");
    }

    stage = "profile";
    const profile = await prisma.candidateProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!profile) {
      return respond(req, "/painel/perfil");
    }

    stage = "doc_limit";
    if (!(await checkResumeDocLimit(profile.id))) {
      return respond(req, "/painel/curriculo?erro=limite_anexos");
    }

    stage = "formdata";
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const documentType = String(formData.get("documentType") || "RESUME");

    if (!file || file.size === 0) {
      return respond(req, "/painel/curriculo?erro=arquivo_obrigatorio");
    }

    stage = "buffer";
    const buffer = Buffer.from(await file.arrayBuffer());
    const basics = validateResumeFileBasics(
      { name: file.name, size: file.size, type: file.type },
      buffer,
    );
    if (!basics.ok) {
      return respond(req, `/painel/curriculo?erro=${basics.reason}`);
    }

    const mimeType = basics.mimeType;

    stage = "parse";
    const parsed = await parseResumeBuffer(buffer, mimeType, file.name);

    if (parsed.status === "FAILED" || !parsed.text || parsed.text.length < 40) {
      return respond(req, "/painel/curriculo?erro=sem_texto");
    }

    stage = "looks_like_resume";
    if (!looksLikeResumeText(parsed.text)) {
      return respond(req, "/painel/curriculo?erro=nao_curriculo");
    }

    // 1) Preenche o formulário ANTES do storage (prioridade do produto)
    stage = "structure";
    const structured = parseResumeToStructured(parsed.text);

    structured.experiences = (structured.experiences || []).map((e) => ({
      ...e,
      company: (e.company || "Empresa").slice(0, 180),
      position: (e.position || "Cargo").slice(0, 180),
      startDate: safeDate(e.startDate),
      endDate: e.endDate ? safeDate(e.endDate) : null,
      description: e.description || null,
      isCurrent: Boolean(e.isCurrent),
    }));
    structured.educations = (structured.educations || []).map((e) => ({
      ...e,
      institution: (e.institution || "Instituição").slice(0, 180),
      course: (e.course || "Curso").slice(0, 180),
      level: e.level || "MEDIO",
      status: e.status || "CONCLUIDO",
      startDate: e.startDate ? safeDate(e.startDate) : null,
      endDate: e.endDate ? safeDate(e.endDate) : null,
    }));
    structured.courses = (structured.courses || []).map((c) => ({
      ...c,
      institution: (c.institution || "Instituição").slice(0, 180),
      title: (c.title || "Curso").slice(0, 180),
      completionDate: c.completionDate ? safeDate(c.completionDate) : null,
    }));

    if (!structured.summary && parsed.text) {
      structured.summary = parsed.text.replace(/\s+/g, " ").trim().slice(0, 900);
    }
    if (!structured.headline) {
      structured.headline = structured.fullName
        ? `Profissional — ${structured.fullName}`
        : "Currículo importado do arquivo";
    }

    stage = "apply";
    let filled = false;
    let fillDetails: Record<string, unknown> = {};
    try {
      const result = await applyParsedResumeToCandidate(session.userId, structured);
      filled = result.applied;
      fillDetails = result.applied ? result.filled : { reason: result.reason };
    } catch (fillErr) {
      console.error("Preenchimento automático falhou:", fillErr);
      fillDetails = { error: String(fillErr) };
    }

    // 2) Storage é melhor esforço — não bloqueia o preenchimento
    stage = "storage";
    const stored = await trySaveFile(buffer, file.name, mimeType);
    let docId: string | null = null;

    if (stored) {
      stage = "document_row";
      try {
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
            parsedText: parsed.text.slice(0, 50000),
            parsedAt: new Date(),
            parseStatus: "OK",
            scanStatus: "CLEAN",
          },
        });
        docId = doc.id;
      } catch (docErr) {
        console.error("Falha ao registrar CandidateDocument:", docErr);
      }
    } else {
      console.warn("Anexo não persistido (storage indisponível); currículo estruturado ainda assim aplicado.");
    }

    stage = "audit";
    try {
      await logAudit({
        userId: session.userId,
        action: "DOCUMENT_UPLOADED",
        resourceType: docId ? "CandidateDocument" : "CandidateProfile",
        resourceId: docId || profile.id,
        details: {
          fileName: file.name,
          fileSize: file.size,
          autoFilled: filled,
          stored: Boolean(stored),
          ...fillDetails,
        },
      });
    } catch (auditErr) {
      console.warn("Audit falhou (ignorado):", auditErr);
    }

    if (filled) {
      const aviso = stored ? "" : "&aviso=anexo_nao_salvo";
      return respond(req, `/painel/curriculo?sucesso=preenchido${aviso}&t=${Date.now()}`, {
        filled: true,
        stored: Boolean(stored),
      });
    }

    return respond(req, `/painel/curriculo?sucesso=anexo_enviado&aviso=pouco_dado&t=${Date.now()}`, {
      filled: false,
      stored: Boolean(stored),
    });
  } catch (error) {
    console.error("Erro no upload de documento:", stage, error);
    return respond(req, `/painel/curriculo?erro=falha_upload&stage=${encodeURIComponent(stage)}`, {
      stage,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
