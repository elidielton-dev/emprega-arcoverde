import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { InterviewsBoard } from "@/components/company/InterviewsBoard";

export default async function EmpresaEntrevistasPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const { company, session } = await requireCompanyContext();

  const [interviews, jobs, eligibleApps, user] = await Promise.all([
    prisma.interview.findMany({
      where: { application: { job: { companyId: company.id } } },
      include: {
        application: {
          include: {
            candidate: {
              include: { user: { select: { email: true } } },
            },
            job: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.job.findMany({
      where: { companyId: company.id },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
    prisma.application.findMany({
      where: {
        job: { companyId: company.id },
        status: {
          in: ["UNDER_REVIEW", "CONTACT_SELECTED", "INTERVIEW_SCHEDULED", "SUBMITTED"],
        },
      },
      include: {
        candidate: { select: { fullName: true } },
        job: { select: { id: true, title: true } },
        interview: { select: { id: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true },
    }),
  ]);

  const rows = interviews.map((i) => ({
    id: i.id,
    scheduledAt: i.scheduledAt.toISOString(),
    location: i.location,
    instructions: i.instructions,
    modality: i.modality || "PRESENCIAL",
    interviewer: i.interviewer,
    feedback: i.feedback,
    rating: i.rating,
    status: i.status,
    candidateName: i.application.candidate.fullName,
    candidateEmail: i.application.candidate.user.email,
    jobId: i.application.job.id,
    jobTitle: i.application.job.title,
    applicationId: i.application.id,
  }));

  const scheduleOptions = eligibleApps.map((a) => ({
    applicationId: a.id,
    candidateName: a.candidate.fullName,
    jobId: a.job.id,
    jobTitle: a.job.title + (a.interview ? " (reagendar)" : ""),
  }));

  return (
    <InterviewsBoard
      interviews={rows}
      jobs={jobs}
      scheduleOptions={scheduleOptions}
      defaultInterviewer={user?.name || ""}
      success={searchParams.sucesso}
    />
  );
}
