import { NextRequest, NextResponse } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canPerformAssistedService } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { assistedUnitFromRole } from "@/lib/admin/assisted-unit";

type ExpIn = {
  company?: string;
  position?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
};

type EduIn = {
  institution?: string;
  course?: string;
  level?: string;
  status?: string;
};

type CourseIn = {
  institution?: string;
  title?: string;
  hours?: string;
};

function parseJsonArray<T>(raw: FormDataEntryValue | null): T[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function monthToDate(value?: string): Date | null {
  if (!value || !/^\d{4}-\d{2}/.test(value)) return null;
  const d = new Date(`${value.slice(0, 7)}-01T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canPerformAssistedService(session.role)) {
      return NextResponse.json(
        { error: "Acesso restrito a operadores de atendimento e gestores" },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const fullName = (formData.get("fullName") as string)?.trim();
    const email = (formData.get("email") as string)?.toLowerCase().trim();
    const phone = (formData.get("phone") as string)?.trim();
    const whatsapp = (formData.get("whatsapp") as string)?.trim() || phone;
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const state = ((formData.get("state") as string)?.trim() || "PE").toUpperCase().slice(0, 2);
    const neighborhood = (formData.get("neighborhood") as string)?.trim() || null;
    const street = (formData.get("street") as string)?.trim() || null;
    const addressNumber = (formData.get("addressNumber") as string)?.trim() || null;
    const birthDateRaw = (formData.get("birthDate") as string)?.trim();
    const birthDate = birthDateRaw ? new Date(birthDateRaw) : null;
    const educationLevel = (formData.get("educationLevel") as string) || "MEDIO";
    const driverLicense = (formData.get("driverLicense") as string) || "NENHUMA";
    const professionalHeadline = (formData.get("professionalHeadline") as string)?.trim() || null;
    const availability = (formData.get("availability") as string)?.trim() || "IMEDIATA";
    const summary = (formData.get("summary") as string)?.trim() || null;
    const assistedUnit = assistedUnitFromRole(session.role);
    const assistedNotes = (formData.get("assistedNotes") as string)?.trim() || null;
    const consentGiven = formData.get("consentGiven") === "on";
    const whatsappConsent = formData.get("whatsappConsent") === "on";

    const skills = parseJsonArray<string>(formData.get("skillsJson")).filter(
      (s) => typeof s === "string" && s.trim(),
    );
    const experiencesIn = parseJsonArray<ExpIn>(formData.get("experiencesJson"));
    const educationsIn = parseJsonArray<EduIn>(formData.get("educationsJson"));
    const coursesIn = parseJsonArray<CourseIn>(formData.get("coursesJson"));

    if (!fullName || !email || !phone || !consentGiven || !professionalHeadline || !summary) {
      return formRedirect(new URL("/admin/atendimento-assistido?erro=dados_incompletos", req.url));
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return formRedirect(new URL("/admin/atendimento-assistido?erro=email_ja_cadastrado", req.url));
    }

    const randomPassword = Math.random().toString(36).substring(2, 12) + "Acv!";
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    const experiencesCreate = experiencesIn
      .filter((e) => e.company?.trim() && e.position?.trim())
      .map((e) => {
        const start = monthToDate(e.startDate) || new Date();
        return {
          company: e.company!.trim(),
          position: e.position!.trim(),
          startDate: start,
          endDate: e.isCurrent ? null : monthToDate(e.endDate),
          isCurrent: Boolean(e.isCurrent),
          description: e.description?.trim() || null,
        };
      });

    const educationsCreate = educationsIn
      .filter((e) => e.institution?.trim() && e.course?.trim())
      .map((e) => ({
        institution: e.institution!.trim(),
        course: e.course!.trim(),
        level: e.level || educationLevel,
        status: e.status || "CONCLUIDO",
      }));

    const coursesCreate = coursesIn
      .filter((c) => c.title?.trim() && c.institution?.trim())
      .map((c) => ({
        title: c.title!.trim(),
        institution: c.institution!.trim(),
        hours: c.hours ? parseInt(c.hours, 10) || null : null,
        completionDate: new Date(),
      }));

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email,
        passwordHash,
        role: "CANDIDATE",
        isEmailVerified: true,
        consents: {
          create: [
            { type: "TERMS", accepted: true },
            { type: "PRIVACY", accepted: true },
            { type: "ASSISTED_SERVICE_CONSENT", accepted: true },
          ],
        },
      },
    });

    const profile = await prisma.candidateProfile.create({
      data: {
        userId: user.id,
        fullName,
        phone,
        whatsapp,
        city,
        state,
        neighborhood,
        street,
        addressNumber,
        birthDate: birthDate && !Number.isNaN(birthDate.getTime()) ? birthDate : null,
        educationLevel,
        driverLicense,
        professionalHeadline,
        availability,
        summary,
        isAssisted: true,
        assistedById: session.userId,
        assistedUnit,
        assistedNotes,
        validationStatus: "PENDING",
        emailConsent: true,
        whatsappConsent,
      },
    });

    const resume = await prisma.resumeVersion.create({
      data: {
        candidateId: profile.id,
        versionNumber: 1,
        headline: professionalHeadline,
        summary,
        educationLevel,
        driverLicense,
        skillsSnapshot: JSON.stringify(skills),
        experiencesSnapshot: JSON.stringify(experiencesCreate),
        educationsSnapshot: JSON.stringify(educationsCreate),
        coursesSnapshot: JSON.stringify(coursesCreate),
        isCurrent: true,
        experiences: experiencesCreate.length ? { create: experiencesCreate } : undefined,
        educations: educationsCreate.length ? { create: educationsCreate } : undefined,
        courses: coursesCreate.length ? { create: coursesCreate } : undefined,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "ASSISTED_REGISTRATION_COMPLETED",
      resourceType: "CandidateProfile",
      resourceId: profile.id,
      details: {
        assistedUnit,
        candidateName: fullName,
        operatorName: session.name,
        resumeId: resume.id,
        experiences: experiencesCreate.length,
        educations: educationsCreate.length,
        courses: coursesCreate.length,
        skills: skills.length,
      },
    });

    const { notifyAdmins, notifyUsersByRoles } = await import("@/lib/notifications/notify");
    await notifyAdmins({
      title: "Currículo assistido pendente",
      message: `${fullName} foi cadastrado(a) via atendimento e aguarda validação.`,
      type: "SYSTEM",
      link: "/admin/candidatos",
    });
    await notifyUsersByRoles(["ASSISTED_OPERATOR"], {
      title: "Novo cadastro assistido",
      message: `${fullName} entrou no banco de candidatos (${assistedUnit}).`,
      type: "SYSTEM",
      link: "/admin/candidatos",
    });

    const dest = new URL("/admin/atendimento-assistido", req.url);
    dest.searchParams.set("sucesso", "cadastro_concluido");
    dest.searchParams.set("nome", fullName);
    dest.searchParams.set("senha", randomPassword);
    return formRedirect(dest);
  } catch (error) {
    console.error("Erro no cadastro assistido:", error);
    return formRedirect(new URL("/admin/atendimento-assistido?erro=falha_servidor", req.url));
  }
}
