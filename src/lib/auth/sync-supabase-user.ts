import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@/lib/auth/rbac";
import type { LinkedInProfileData } from "@/lib/linkedin/types";
import { applyLinkedInDataToCandidate } from "@/lib/linkedin/apply-to-resume";

function displayNameFromAuth(authUser: SupabaseUser, email: string) {
  const meta = authUser.user_metadata || {};
  const name = [meta.full_name, meta.name, meta.given_name]
    .find((value) => typeof value === "string" && value.trim().length > 0);
  if (name) return String(name).trim();
  return email.split("@")[0] || "Candidato";
}

function enrichmentFromMetadata(authUser: SupabaseUser): LinkedInProfileData {
  const meta = authUser.user_metadata || {};
  const headline =
    typeof meta.headline === "string"
      ? meta.headline
      : typeof meta.job_title === "string"
        ? meta.job_title
        : undefined;
  return {
    fullName: displayNameFromAuth(authUser, authUser.email || ""),
    headline,
    pictureUrl:
      typeof meta.avatar_url === "string"
        ? meta.avatar_url
        : typeof meta.picture === "string"
          ? meta.picture
          : undefined,
    skills: [],
    experiences: [],
    educations: [],
    courses: [],
    source: "metadata",
  };
}

export async function upsertUserFromSupabase(
  authUser: SupabaseUser,
  options?: { linkedIn?: LinkedInProfileData | null },
) {
  const email = authUser.email?.toLowerCase().trim();
  if (!email) {
    throw new Error("Conta social sem e-mail");
  }

  const name = options?.linkedIn?.fullName || displayNameFromAuth(authUser, email);
  const avatarUrl =
    options?.linkedIn?.pictureUrl ||
    (typeof authUser.user_metadata?.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : typeof authUser.user_metadata?.picture === "string"
        ? authUser.user_metadata.picture
        : undefined);

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
    include: {
      companyMemberships: { take: 1 },
      candidateProfile: true,
    },
  });

  const isNew = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name,
        supabaseUserId: authUser.id,
        passwordHash: null,
        role: "CANDIDATE",
        isEmailVerified: Boolean(authUser.email_confirmed_at) || true,
        avatarUrl,
        consents: {
          create: [
            { type: "TERMS", accepted: true },
            { type: "PRIVACY", accepted: true },
            { type: "EMAIL_COMMUNICATION", accepted: true },
          ],
        },
        candidateProfile: {
          create: {
            fullName: name,
            city: "Arcoverde",
            state: "PE",
            educationLevel: "MEDIO",
            professionalHeadline: options?.linkedIn?.headline || null,
            summary: options?.linkedIn?.summary || null,
          },
        },
      },
      include: {
        companyMemberships: { take: 1 },
        candidateProfile: true,
      },
    });

    if (user.candidateProfile) {
      await prisma.resumeVersion.create({
        data: {
          candidateId: user.candidateProfile.id,
          versionNumber: 1,
          educationLevel: "MEDIO",
          headline: options?.linkedIn?.headline || null,
          summary: options?.linkedIn?.summary || null,
          skillsSnapshot: JSON.stringify(options?.linkedIn?.skills || []),
        },
      });
    }
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        supabaseUserId: user.supabaseUserId || authUser.id,
        isEmailVerified: true,
        avatarUrl: user.avatarUrl || avatarUrl,
      },
      include: {
        companyMemberships: { take: 1 },
        candidateProfile: true,
      },
    });
  }

  const linkedInPayload = options?.linkedIn || enrichmentFromMetadata(authUser);
  const isLinkedIn =
    authUser.app_metadata?.provider === "linkedin_oidc" ||
    authUser.identities?.some((i) => i.provider === "linkedin_oidc");

  if (isLinkedIn || options?.linkedIn) {
    try {
      await applyLinkedInDataToCandidate(user.id, linkedInPayload, {
        replaceStructured: Boolean(
          isNew &&
            (linkedInPayload.experiences.length ||
              linkedInPayload.educations.length ||
              linkedInPayload.courses.length),
        ),
      });
    } catch (err) {
      console.warn("Falha ao aplicar dados LinkedIn no currículo:", err);
    }
  }

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    companyId: user.companyMemberships[0]?.companyId,
    isNew,
    isLinkedIn: Boolean(isLinkedIn),
  };
}
