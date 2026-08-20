import React from "react";
import { prisma } from "@/lib/db/prisma";
import { requireCompanyContext } from "@/lib/company/context";
import { InterviewsBoard } from "@/components/company/InterviewsBoard";

export default async function EmpresaEntrevistasPage() {
  const { company } = await requireCompanyContext();

  const interviews = await prisma.interview.findMany({
    where: { application: { job: { companyId: company.id } } },
    include: {
      application: {
        include: {
          candidate: { select: { fullName: true } },
          job: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const rows = interviews.map((i) => ({
    id: i.id,
    scheduledAt: i.scheduledAt.toISOString(),
    location: i.location,
    status: i.status,
    candidateName: i.application.candidate.fullName,
    jobId: i.application.job.id,
    jobTitle: i.application.job.title,
    applicationId: i.application.id,
  }));

  return <InterviewsBoard interviews={rows} />;
}
