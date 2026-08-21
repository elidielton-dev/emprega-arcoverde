import type { LinkedInProfileData } from "./types";

type UserInfo = {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  locale?: string;
};

type IdentityMe = {
  basicInfo?: {
    firstName?: { localized?: Record<string, string>; preferredLocale?: { language?: string } };
    lastName?: { localized?: Record<string, string> };
    headline?: { localized?: Record<string, string> };
    profileUrl?: string;
    profilePicture?: { croppedImage?: { "downloadUrl"?: string } };
  };
  primaryCurrentExperience?: {
    title?: { localized?: Record<string, string> };
    companyName?: string;
    company?: { localizedName?: string };
    startedOn?: { year?: number; month?: number };
    endedOn?: { year?: number; month?: number };
    description?: { localized?: Record<string, string> };
  };
  mostRecentEducation?: {
    schoolName?: string;
    degreeName?: { localized?: Record<string, string> };
    fieldOfStudy?: { localized?: Record<string, string> };
    startedOn?: { year?: number; month?: number };
    endedOn?: { year?: number; month?: number };
  };
};

function localized(value?: { localized?: Record<string, string> } | string | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value.trim() || undefined;
  const map = value.localized || {};
  const first = Object.values(map).find((v) => typeof v === "string" && v.trim());
  return first?.trim();
}

function dateFromParts(parts?: { year?: number; month?: number }): Date | undefined {
  if (!parts?.year) return undefined;
  const month = Math.min(12, Math.max(1, parts.month || 1));
  return new Date(Date.UTC(parts.year, month - 1, 1));
}

async function getJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "LinkedIn-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Busca o máximo permitido pelo token OAuth do LinkedIn.
 * Com Sign In OIDC padrão: nome, e-mail, foto.
 * Com produtos parceiros (Verified on LinkedIn Plus): experiência/educação atuais.
 */
export async function fetchLinkedInProfileFromApi(accessToken: string): Promise<LinkedInProfileData> {
  const data: LinkedInProfileData = {
    skills: [],
    experiences: [],
    educations: [],
    courses: [],
    source: "api",
  };

  const userInfo = await getJson<UserInfo>("https://api.linkedin.com/v2/userinfo", accessToken);
  if (userInfo) {
    data.fullName =
      userInfo.name ||
      [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ").trim() ||
      undefined;
    data.email = userInfo.email;
    data.pictureUrl = userInfo.picture;
    data.locale = typeof userInfo.locale === "string" ? userInfo.locale : undefined;
  }

  // Tentativa best-effort (só funciona se o app LinkedIn tiver o produto/escopos).
  const identity =
    (await getJson<IdentityMe>("https://api.linkedin.com/rest/identityMe", accessToken)) ||
    (await getJson<IdentityMe>("https://api.linkedin.com/v2/identityMe", accessToken));

  if (identity?.basicInfo) {
    const first = localized(identity.basicInfo.firstName);
    const last = localized(identity.basicInfo.lastName);
    const composed = [first, last].filter(Boolean).join(" ").trim();
    if (composed) data.fullName = composed;
    data.headline = localized(identity.basicInfo.headline) || data.headline;
    const pic = identity.basicInfo.profilePicture?.croppedImage?.["downloadUrl"];
    if (pic) data.pictureUrl = pic;
  }

  const exp = identity?.primaryCurrentExperience;
  if (exp) {
    const position = localized(exp.title);
    const company = exp.companyName || exp.company?.localizedName || "Empresa";
    if (position) {
      data.experiences.push({
        company,
        position,
        startDate: dateFromParts(exp.startedOn) || new Date(),
        endDate: dateFromParts(exp.endedOn) || null,
        isCurrent: !exp.endedOn?.year,
        description: localized(exp.description) || null,
      });
    }
  }

  const edu = identity?.mostRecentEducation;
  if (edu?.schoolName) {
    const course =
      localized(edu.fieldOfStudy) || localized(edu.degreeName) || "Formação";
    data.educations.push({
      institution: edu.schoolName,
      course,
      level: "SUPERIOR",
      startDate: dateFromParts(edu.startedOn) || null,
      endDate: dateFromParts(edu.endedOn) || null,
      status: edu.endedOn?.year ? "CONCLUIDO" : "EM_ANDAMENTO",
    });
  }

  return data;
}
