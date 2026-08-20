import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { scoreApplicationAgainstJob, serializeAtsResult } from "@/lib/matching/ats";
import { logAudit } from "@/lib/audit/audit";
import { sendEmail, generateApplicationConfirmationEmail } from "@/lib/mail/mailer";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return formRedirect(new URL("/entrar", req.url));
    }

    const formData = await req.formData();
    const jobId = formData.get("jobId") as string;
    const coverNote = (formData.get("coverNote") as string) || null;

    if (!jobId) {
      return NextResponse.json({ error: "ID da vaga é obrigatório" }, { status: 400 });
    }

    const [job, candidateProfile] = await Promise.all([
      prisma.job.findUnique({
        where: { id: jobId },
        include: { company: true, category: true },
      }),
      prisma.candidateProfile.findUnique({
        where: { userId: session.userId },
        include: {
          documents: true,
          resumeVersions: {
            where: { isCurrent: true },
            include: {
              experiences: true,
              educations: true,
              courses: true,
            },
            take: 1,
          },
        },
      }),
    ]);

    if (!job || job.status !== "PUBLISHED") {
      return NextResponse.json({ error: "Esta vaga não está disponível para candidaturas" }, { status: 404 });
    }

    if (!candidateProfile) {
      return formRedirect(new URL("/painel/perfil?aviso=complete_perfil", req.url));
    }

    const latestResume = candidateProfile.resumeVersions[0];
    let storedSkills: string[] = [];
    try {
      const parsed = latestResume?.skillsSnapshot ? JSON.parse(latestResume.skillsSnapshot) : [];
      storedSkills = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      storedSkills = [];
    }
    const hasCurrentResume = Boolean(
      latestResume &&
        (latestResume.summary?.trim() ||
          latestResume.headline?.trim() ||
          storedSkills.length > 0 ||
          (latestResume.experiences?.length || 0) > 0),
    );
    if (!hasCurrentResume) {
      return formRedirect(new URL("/painel/curriculo?aviso=curriculo_incompleto", req.url));
    }

    const existing = await prisma.application.findUnique({
      where: {
        jobId_candidateId: {
          jobId: job.id,
          candidateId: candidateProfile.id,
        },
      },
    });

    if (existing) {
      return formRedirect(new URL(`/painel/candidaturas/${existing.id}?aviso=ja_candidatado`, req.url));
    }

    const matchResult = await scoreApplicationAgainstJob(candidateProfile, job, { coverNote });
    const atsFields = serializeAtsResult(matchResult);

    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidateProfile.id,
        resumeVersionId: latestResume?.id || null,
        origin: "SELF",
        status: "SUBMITTED",
        coverNote,
        ...atsFields,
        statusHistory: {
          create: {
            status: "SUBMITTED",
            notes: "Candidatura realizada através do portal web.",
            changedById: session.userId,
          },
        },
      },
    });

    await logAudit({
      userId: session.userId,
      action: "APPLICATION_SUBMITTED",
      resourceType: "Application",
      resourceId: application.id,
      details: { jobId: job.id, matchScore: matchResult.score, band: matchResult.band },
    });

    if (candidateProfile.emailConsent) {
      const emailHtml = generateApplicationConfirmationEmail(
        job.title,
        candidateProfile.fullName,
        job.isConfidential,
        job.company.tradeName || job.company.name,
      );

      await sendEmail({
        to: session.email,
        subject: `Candidatura confirmada: ${job.title}`,
        html: emailHtml,
      });
    }

    return formRedirect(new URL(`/painel/candidaturas?sucesso=1`, req.url));
  } catch (error) {
    console.error("Erro ao processar candidatura:", error);
    return NextResponse.json({ error: "Erro interno ao processar candidatura" }, { status: 500 });
  }
}
