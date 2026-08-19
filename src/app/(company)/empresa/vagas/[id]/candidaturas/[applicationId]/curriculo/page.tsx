import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { ArrowLeft } from "lucide-react";
import { StructuredResume } from "@/components/resume/StructuredResume";
import { PrintResumeButton } from "@/components/resume/PrintResumeButton";

export default async function CurriculoCandidaturaPage({
  params,
}: {
  params: { id: string; applicationId: string };
}) {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
    redirect("/entrar");
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      job: true,
      candidate: {
        include: {
          user: true,
          resumeVersions: {
            where: { isCurrent: true },
            include: {
              experiences: { orderBy: { startDate: "desc" } },
              educations: true,
              courses: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!application || application.jobId !== params.id) {
    notFound();
  }

  if (session.role === "COMPANY_MEMBER" && application.job.companyId !== session.companyId) {
    redirect("/empresa");
  }

  const resume = application.candidate.resumeVersions[0];
  const skills: string[] = resume?.skillsSnapshot ? JSON.parse(resume.skillsSnapshot) : [];

  return (
    <div className="bg-[#F4F5F7] min-h-full print:bg-white">
      <div className="max-w-[800px] mx-auto px-4 py-8 print:px-0 print:py-0">
        <div className="print:hidden flex items-center justify-between gap-3 mb-6">
          <Link
            href={`/empresa/vagas/${params.id}/candidaturas`}
            className="inline-flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#E65100]"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Voltar às candidaturas
          </Link>
          <PrintResumeButton />
        </div>

        <div className="bg-white rounded-2xl border border-[#E6E8EB] p-8 sm:p-12 print:border-0 print:rounded-none print:p-0">
          <StructuredResume
            name={application.candidate.fullName}
            headline={resume?.headline || application.candidate.professionalHeadline}
            city={application.candidate.city}
            state={application.candidate.state}
            neighborhood={application.candidate.neighborhood}
            phone={application.candidate.phone}
            email={application.candidate.user.email}
            educationLevel={application.candidate.educationLevel}
            summary={resume?.summary || application.candidate.summary}
            experiences={resume?.experiences || []}
            educations={resume?.educations || []}
            courses={resume?.courses || []}
            skills={skills}
          />
        </div>
      </div>
    </div>
  );
}
