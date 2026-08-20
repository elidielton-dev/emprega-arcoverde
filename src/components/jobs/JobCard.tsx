import React from "react";
import Link from "next/link";
import { MapPin, Clock, Building, ShieldAlert, ArrowRight } from "lucide-react";

type JobCardJob = {
  slug: string;
  title: string;
  summary: string;
  city: string;
  state: string;
  contractType: string;
  workplaceType: string;
  isConfidential: boolean;
  vacanciesCount: number;
  category: { name: string };
  company: { name: string; tradeName: string | null };
};

const workplaceLabel: Record<string, string> = {
  PRESENCIAL: "Presencial",
  HIBRIDO: "Híbrido",
  REMOTO: "Remoto",
};

export function JobCard({ job }: { job: JobCardJob }) {
  const companyName = job.isConfidential
    ? "Empresa confidencial"
    : job.company.tradeName || job.company.name;

  return (
    <article className="flex h-full flex-col justify-between rounded-lg border border-[#E6E8EB] bg-white p-5 shadow-[0_1px_2px_rgba(28,20,16,0.04)] transition hover:border-[#E65100]/30">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md bg-[#F4F5F7] px-2 py-0.5 text-[11px] font-bold text-[#57433C]">
            {job.category.name}
          </span>
          {job.isConfidential ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#78716c]">
              <ShieldAlert className="h-3 w-3" /> Confidencial
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#78716c]">
              <Building className="h-3.5 w-3.5" /> {job.contractType}
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-lg font-bold text-[#1C1410]">
          <Link href={`/vagas/${job.slug}`} className="hover:text-[#E65100]">
            {job.title}
          </Link>
        </h3>

        <div className="space-y-1 text-xs text-[#78716c]">
          <p className="font-medium text-[#57433C]">{companyName}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.city} - {job.state}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />{" "}
              {workplaceLabel[job.workplaceType] || job.workplaceType}
            </span>
          </div>
        </div>

        <p className="line-clamp-2 text-xs leading-relaxed text-[#78716c]">{job.summary}</p>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E6E8EB] pt-4">
        <span className="text-xs text-[#78716c]">
          {job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga" : "vagas"}
        </span>
        <Link
          href={`/vagas/${job.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#E65100]"
        >
          Candidatar-se <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
