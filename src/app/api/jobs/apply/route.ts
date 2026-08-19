import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { calculateJobMatch } from "@/lib/matching/calculator";
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
          resumeVersions: {
            where: { isCurrent: true },
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

    // Verificar se já se candidatou
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

    // Calcular match determinístico
    const candidateSkills = candidateProfile.resumeVersions[0]?.skillsSnapshot
      ? JSON.parse(candidateProfile.resumeVersions[0].skillsSnapshot)
      : [];
    const requiredSkills = job.skillsText ? job.skillsText.split(",").map((s) => s.trim()) : [];

    const matchResult = calculateJobMatch(
      {
        city: candidateProfile.city,
        educationLevel: candidateProfile.educationLevel,
        driverLicense: candidateProfile.driverLicense,
        skills: candidateSkills,
        categorySlug: job.category.slug,
      },
      {
        city: job.city,
        educationLevel: job.educationLevel,
        driverLicense: job.driverLicense,
        requiredSkills: requiredSkills,
        categorySlug: job.category.slug,
      }
    );

    const latestResume = candidateProfile.resumeVersions[0];

    // Criar candidatura
    const application = await prisma.application.create({
      data: {
        jobId: job.id,
        candidateId: candidateProfile.id,
        resumeVersionId: latestResume?.id || null,
        origin: "SELF",
        status: "SUBMITTED",
        coverNote,
        matchScore: matchResult.score,
        matchExplanation: JSON.stringify(matchResult.explanations),
        statusHistory: {
          create: {
            status: "SUBMITTED",
            notes: "Candidatura realizada através do portal web.",
            changedById: session.userId,
          },
        },
      },
    });

    // Auditoria
    await logAudit({
      userId: session.userId,
      action: "APPLICATION_SUBMITTED",
      resourceType: "Application",
      resourceId: application.id,
      details: { jobId: job.id, matchScore: matchResult.score },
    });

    // E-mail transacional de confirmação
    if (candidateProfile.emailConsent) {
      const emailHtml = generateApplicationConfirmationEmail(
        job.title,
        candidateProfile.fullName,
        job.isConfidential,
        job.company.tradeName || job.company.name
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
