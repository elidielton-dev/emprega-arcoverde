import { prisma } from "@/lib/db/prisma";
import { experienceYearsFromDates } from "@/lib/matching/calculator";
import { calculateProfessionalAts, type AtsResult } from "@/lib/matching/professional-ats";
import { parseResumeFile } from "@/lib/matching/resume-parser";
import { pickResumeDocument } from "@/lib/resume/files";

type ResumeLike = {
  headline?: string | null;
  summary?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  skillsSnapshot?: string | null;
  experiences?: Array<{
    startDate: Date;
    endDate?: Date | null;
    isCurrent?: boolean;
    position?: string | null;
    company?: string | null;
    description?: string | null;
  }>;
  educations?: Array<{ course?: string | null; institution?: string | null }>;
  courses?: Array<{ title?: string | null; institution?: string | null }>;
};

type DocumentLike = {
  id: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  documentType: string;
  parsedText?: string | null;
  parseStatus?: string | null;
  parsedAt?: Date | null;
};

type CandidateLike = {
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  professionalHeadline?: string | null;
  summary?: string | null;
  resumeVersions?: ResumeLike[];
  documents?: DocumentLike[];
};

type JobLike = {
  city?: string | null;
  educationLevel?: string | null;
  driverLicense?: string | null;
  skillsText?: string | null;
  experienceRequired?: string | null;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  requirements?: string | null;
  category?: { slug?: string | null; name?: string | null } | null;
};

function parseSkills(snapshot?: string | null): string[] {
  if (!snapshot) return [];
  try {
    const parsed = JSON.parse(snapshot);
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === "string");
  } catch {
    return snapshot.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** Usa texto já parseado; só lê o arquivo se `allowFileParse` for true. */
export async function ensureResumeParsed(
  documents: DocumentLike[] = [],
  options?: { allowFileParse?: boolean },
): Promise<{
  text: string;
  status: string;
}> {
  const allowFileParse = options?.allowFileParse !== false;
  const doc = pickResumeDocument(documents);
  if (!doc) return { text: "", status: "PENDING" };

  if (doc.parsedText && doc.parsedText.length > 40) {
    return { text: doc.parsedText, status: doc.parseStatus === "OK" ? "OK" : "OK" };
  }

  if (doc.parseStatus === "OK" && doc.parsedText) {
    return { text: doc.parsedText, status: "OK" };
  }

  if (!allowFileParse) {
    return {
      text: doc.parsedText || "",
      status: doc.parseStatus || "PENDING",
    };
  }

  const parsed = await parseResumeFile(doc.fileKey, doc.mimeType, doc.fileName);
  try {
    await prisma.candidateDocument.update({
      where: { id: doc.id },
      data: {
        parsedText: parsed.text || null,
        parsedAt: new Date(),
        parseStatus: parsed.status,
      },
    });
  } catch (error) {
    console.warn("Não foi possível persistir parse do documento:", doc.fileKey, error);
  }

  return { text: parsed.text, status: parsed.status };
}

export async function scoreApplicationAgainstJob(
  candidate: CandidateLike,
  job: JobLike,
  options?: { coverNote?: string | null; allowFileParse?: boolean },
): Promise<AtsResult> {
  const resume = candidate.resumeVersions?.[0];
  const skills = parseSkills(resume?.skillsSnapshot);
  const years = experienceYearsFromDates(resume?.experiences || []);
  const recentTitles = (resume?.experiences || [])
    .map((e) => [e.position, e.company, e.description].filter(Boolean).join(" "))
    .filter(Boolean) as string[];
  const educationCourses = [
    ...(resume?.educations || []).map((e) => `${e.course || ""} ${e.institution || ""}`),
    ...(resume?.courses || []).map((c) => `${c.title || ""} ${c.institution || ""}`),
  ].filter((s) => s.trim());

  const { text, status } = await ensureResumeParsed(candidate.documents || [], {
    allowFileParse: options?.allowFileParse,
  });
  const structuredBlob = [
    resume?.headline,
    resume?.summary,
    candidate.professionalHeadline,
    candidate.summary,
    ...skills,
    ...recentTitles,
    ...educationCourses,
  ]
    .filter(Boolean)
    .join(" ");

  return calculateProfessionalAts(
    {
      city: candidate.city,
      educationLevel: resume?.educationLevel || candidate.educationLevel,
      driverLicense: resume?.driverLicense || candidate.driverLicense,
      skills,
      experienceYears: years,
      headline: resume?.headline || candidate.professionalHeadline,
      summary: resume?.summary || candidate.summary,
      recentTitles,
      educationCourses,
      coverNote: options?.coverNote,
      parsedResumeText: [text, structuredBlob].filter(Boolean).join("\n"),
      parseStatus: status,
      hasStructuredResume: Boolean(structuredBlob.trim().length > 40),
      applied: true,
    },
    {
      city: job.city,
      educationLevel: job.educationLevel,
      driverLicense: job.driverLicense,
      skillsText: job.skillsText,
      experienceRequired: job.experienceRequired,
      title: job.title,
      summary: job.summary,
      description: job.description,
      requirements: job.requirements,
      categoryName: job.category?.name,
    },
  );
}

export function serializeAtsResult(result: AtsResult) {
  return {
    matchScore: result.score,
    matchExplanation: JSON.stringify(result.explanations),
    matchBreakdown: JSON.stringify(result.breakdown),
  };
}
