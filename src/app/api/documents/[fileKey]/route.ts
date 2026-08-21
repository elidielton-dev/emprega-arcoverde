import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { readFile } from "@/lib/storage/storage";
import { logAudit } from "@/lib/audit/audit";
import { isAdmin } from "@/lib/auth/rbac";
import { isPdfFile, isWordFile } from "@/lib/resume/files";

export async function GET(req: NextRequest, { params }: { params: { fileKey: string } }) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const fileKey = params.fileKey;

  const doc = await prisma.candidateDocument.findFirst({
    where: { fileKey },
    include: {
      candidate: {
        include: {
          user: true,
          applications: {
            include: {
              job: true,
            },
          },
        },
      },
    },
  });

  if (!doc) {
    return new NextResponse("Documento não encontrado", { status: 404 });
  }

  // 1. O próprio candidato
  const isOwner = doc.candidate.userId === session.userId;

  // 2. Administradores e operadores assistidos
  const isSystemStaff = isAdmin(session.role) || session.role === "ASSISTED_OPERATOR";

  // 3. Empresa que recebeu candidatura deste candidato
  let isAuthorizedCompany = false;
  if (session.role === "COMPANY_MEMBER" && session.companyId) {
    isAuthorizedCompany = doc.candidate.applications.some(
      (app) => app.job.companyId === session.companyId
    );
  }

  if (!isOwner && !isSystemStaff && !isAuthorizedCompany) {
    await logAudit({
      userId: session.userId,
      action: "UNAUTHORIZED_DOCUMENT_ACCESS_ATTEMPT",
      resourceType: "CandidateDocument",
      resourceId: doc.id,
      details: { fileKey },
    });
    return new NextResponse("Acesso negado", { status: 403 });
  }

  // Registrar auditoria do acesso legítimo
  await logAudit({
    userId: session.userId,
    action: "DOCUMENT_ACCESSED",
    resourceType: "CandidateDocument",
    resourceId: doc.id,
    details: { fileKey, candidateId: doc.candidateId },
  });

  const fileBuffer = await readFile(fileKey);
  if (!fileBuffer) {
    return new NextResponse("Arquivo indisponível no servidor", { status: 404 });
  }

  const forceDownload = req.nextUrl.searchParams.get("download") === "1";
  const asAttachment = forceDownload || isWordFile(doc.mimeType, doc.fileName);
  const disposition = asAttachment ? "attachment" : "inline";
  const mimeType = isPdfFile(doc.mimeType, doc.fileName) ? "application/pdf" : doc.mimeType || "application/octet-stream";

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `${disposition}; filename="${encodeURIComponent(doc.fileName)}"`,
    },
  });
}
