import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { withDb } from "@/lib/db/safe";
import { GraduationCap, ExternalLink, Calendar, MapPin, Clock, Users } from "lucide-react";

export default async function CursosPage() {
  const [courses, providers] = await withDb(
    () =>
      Promise.all([
        prisma.course.findMany({
          where: { status: "ACTIVE" },
          include: { provider: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.courseProvider.findMany({ orderBy: { name: "asc" } }),
      ]),
    [[], []],
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-black text-[#2E221F] tracking-tight">
          Cursos Gratuitos de Qualificação
        </h1>
        <p className="text-sm text-[#78716c]">
          Capacitações gratuitas oferecidas pela Prefeitura de Arcoverde, Sala do Empreendedor, Sebrae, Senai e entidades parceiras.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="mx-auto max-w-md space-y-3 rounded-lg border border-[#E6E8EB] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
          <GraduationCap className="mx-auto h-12 w-12 text-[#E65100]" />
          <h3 className="text-base font-bold text-[#1C1410]">Nenhum curso com inscrições abertas no momento</h3>
          <p className="text-xs text-[#78716c]">
            Não há turmas com inscrição aberta no momento. Acompanhe o portal ou a Sala do Empreendedor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col justify-between rounded-lg border border-[#E6E8EB] bg-white p-5 shadow-[0_1px_2px_rgba(28,20,16,0.04)] transition hover:border-[#E65100]/30"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-2 py-0.5 text-[11px] font-bold text-[#57433C]">
                    {course.provider.name}
                  </span>
                  <span className="text-xs font-semibold text-[#78716c]">{course.modality}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold leading-snug text-[#1C1410]">
                    <Link href={`/cursos/${course.slug}`} className="transition hover:text-[#E65100]">
                      {course.title}
                    </Link>
                  </h3>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#78716c]">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-[#78716c]">
                  {course.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-[#E65100]" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  {course.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#E65100]" />
                      <span>Carga horária: {course.hours} horas</span>
                    </div>
                  )}
                  {course.vacancies && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-[#E65100]" />
                      <span>{course.vacancies} vagas disponíveis</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#E6E8EB] pt-4">
                <Link
                  href={`/cursos/${course.slug}`}
                  className="text-xs font-semibold text-[#78716c] hover:text-[#E65100]"
                >
                  Mais Detalhes
                </Link>
                <a
                  href={`/api/courses/${course.id}/click`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
                >
                  <span>Inscrição Gratuita</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
