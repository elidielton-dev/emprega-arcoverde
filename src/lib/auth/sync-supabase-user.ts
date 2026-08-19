import type { User as SupabaseUser } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { UserRole } from "@/lib/auth/rbac";

function displayNameFromAuth(authUser: SupabaseUser, email: string) {
  const meta = authUser.user_metadata || {};
  const name = [meta.full_name, meta.name, meta.given_name]
    .find((value) => typeof value === "string" && value.trim().length > 0);
  if (name) return String(name).trim();
  return email.split("@")[0] || "Candidato";
}

export async function upsertUserFromSupabase(authUser: SupabaseUser) {
  const email = authUser.email?.toLowerCase().trim();
  if (!email) {
    throw new Error("Conta social sem e-mail");
  }

  const name = displayNameFromAuth(authUser, email);
  const avatarUrl =
    typeof authUser.user_metadata?.avatar_url === "string"
      ? authUser.user_metadata.avatar_url
      : typeof authUser.user_metadata?.picture === "string"
        ? authUser.user_metadata.picture
        : undefined;

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ supabaseUserId: authUser.id }, { email }],
    },
    include: {
      companyMemberships: { take: 1 },
      candidateProfile: true,
    },
  });

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
          skillsSnapshot: JSON.stringify([]),
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

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    companyId: user.companyMemberships[0]?.companyId,
  };
}
