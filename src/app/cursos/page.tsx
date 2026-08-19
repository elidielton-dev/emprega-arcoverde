import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { GraduationCap, ExternalLink, Calendar, MapPin, Clock, Users } from "lucide-react";

export default async function CursosPage() {
  const [courses, providers] = await Promise.all([
    prisma.course.findMany({
      where: { status: "ACTIVE" },
      include: { provider: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseProvider.findMany({ orderBy: { name: "asc" } }),
  ]);

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
        <div className="bg-white p-12 rounded-3xl border border-[#FEEDDF] text-center max-w-md mx-auto space-y-3">
          <GraduationCap className="w-12 h-12 text-[#E65100] mx-auto" />
          <h3 className="text-base font-bold text-[#2E221F]">Nenhum curso com inscrições abertas no momento</h3>
          <p className="text-xs text-[#78716c]">
            Novas turmas gratuitas serão anunciadas em breve. Fique atento às nossas atualizações.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl p-6 border border-[#FEEDDF] hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                    {course.provider.name}
                  </span>
                  <span className="text-xs text-[#78716c] font-semibold">{course.modality}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#2E221F] leading-snug">
                    <Link href={`/cursos/${course.slug}`} className="hover:text-[#E65100] transition">
                      {course.title}
                    </Link>
                  </h3>
                  <p className="text-xs text-[#57433C] mt-2 line-clamp-3 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-2 text-xs text-[#78716c]">
                  {course.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                      <span>{course.location}</span>
                    </div>
                  )}
                  {course.hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#E65100]" />
                      <span>Carga horária: {course.hours} horas</span>
                    </div>
                  )}
                  {course.vacancies && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-[#E65100]" />
                      <span>{course.vacancies} vagas disponíveis</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#FEEDDF] flex items-center justify-between">
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
                  className="bg-[#E65100] hover:bg-[#D84315] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Inscrição Gratuita</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
