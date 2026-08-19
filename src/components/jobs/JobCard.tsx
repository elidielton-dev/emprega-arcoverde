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
    <article className="bg-white rounded-2xl p-6 border border-[#E6E8EB] hover:border-[#D1D5DB] hover:shadow-[0_8px_24px_rgba(16,24,40,0.06)] transition flex flex-col justify-between h-full">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#F4F5F7] text-[#4B5563] rounded-full">
            {job.category.name}
          </span>
          {job.isConfidential ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6B7280]">
              <ShieldAlert className="w-3 h-3" /> Confidencial
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#6B7280]">
              <Building className="w-3.5 h-3.5" /> {job.contractType}
            </span>
          )}
        </div>

        <h3 className="text-lg font-bold text-[#1A1A1A] line-clamp-2">
          <Link href={`/vagas/${job.slug}`} className="hover:text-[#E65100]">
            {job.title}
          </Link>
        </h3>

        <div className="text-xs text-[#6B7280] space-y-1">
          <p className="font-medium text-[#374151]">{companyName}</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {job.city} - {job.state}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {workplaceLabel[job.workplaceType] || job.workplaceType}
            </span>
          </div>
        </div>

        <p className="text-xs text-[#6B7280] line-clamp-2 leading-relaxed">{job.summary}</p>
      </div>

      <div className="pt-4 mt-4 border-t border-[#E6E8EB] flex items-center justify-between">
        <span className="text-xs text-[#6B7280]">
          {job.vacanciesCount} {job.vacanciesCount === 1 ? "vaga" : "vagas"}
        </span>
        <Link
          href={`/vagas/${job.slug}`}
          className="text-xs font-bold text-[#E65100] inline-flex items-center gap-1"
        >
          Candidatar-se <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
