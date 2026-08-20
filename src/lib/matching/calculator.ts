import { calculateProfessionalAts } from "@/lib/matching/professional-ats";

/** Utilitários legados + reexports do ATS profissional. */

export {
  getAtsBand,
  getAtsBandMeta,
  getMatchBandLabel,
  calculateProfessionalAts,
  type AtsResult,
  type AtsBand,
  type AtsBreakdown,
} from "./professional-ats";

export function experienceYearsFromDates(
  experiences: Array<{ startDate: Date | string; endDate?: Date | string | null; isCurrent?: boolean }>,
): number {
  if (!experiences?.length) return 0;
  let months = 0;
  const now = Date.now();
  for (const exp of experiences) {
    const start = new Date(exp.startDate).getTime();
    if (Number.isNaN(start)) continue;
    const end = exp.isCurrent || !exp.endDate ? now : new Date(exp.endDate).getTime();
    if (Number.isNaN(end) || end < start) continue;
    months += (end - start) / (1000 * 60 * 60 * 24 * 30.44);
  }
  return Math.round((months / 12) * 10) / 10;
}

/** @deprecated Prefer calculateProfessionalAts / scoreApplicationAgainstJob */
export function calculateJobMatch(
  candidate: {
    city?: string | null;
    educationLevel?: string | null;
    driverLicense?: string | null;
    skills?: string[] | null;
    experienceYears?: number | null;
    categorySlug?: string | null;
    headline?: string | null;
    summary?: string | null;
  },
  job: {
    city?: string | null;
    educationLevel?: string | null;
    driverLicense?: string | null;
    requiredSkills?: string[] | null;
    categorySlug?: string | null;
    experienceRequired?: string | null;
    title?: string | null;
    requirements?: string | null;
  },
) {
  return calculateProfessionalAts(
    {
      ...candidate,
      recentTitles: candidate.headline ? [candidate.headline] : [],
      hasStructuredResume: true,
      applied: true,
      parsedResumeText: `${candidate.headline || ""} ${candidate.summary || ""} ${(candidate.skills || []).join(" ")}`,
      parseStatus: "OK",
    },
    {
      ...job,
      skillsText: (job.requiredSkills || []).join(", "),
      description: job.requirements || "",
      summary: job.title || "",
      categoryName: job.categorySlug || undefined,
    },
  );
}
