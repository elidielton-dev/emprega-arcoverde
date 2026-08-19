import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import {
  GraduationCap,
  ExternalLink,
  MapPin,
  Clock,
  Users,
  Calendar,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default async function CursoSlugPage({ params }: { params: { slug: string } }) {
  const course = await prisma.course.findUnique({
    where: { slug: params.slug },
    include: { provider: true },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-[#E65100] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para a lista de cursos</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#FEEDDF] shadow-sm space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
              {course.provider.name}
            </span>
            <span className="text-xs text-[#78716c] font-semibold">{course.modality}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight leading-tight">
            {course.title}
          </h1>
        </div>

        {/* Informações Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] text-xs">
          <div>
            <span className="block text-[#78716c]">Modalidade</span>
            <span className="font-bold text-[#2E221F]">{course.modality}</span>
          </div>
          <div>
            <span className="block text-[#78716c]">Carga Horária</span>
            <span className="font-bold text-[#2E221F]">{course.hours ? `${course.hours} horas` : "Livre"}</span>
          </div>
          <div>
            <span className="block text-[#78716c]">Vagas</span>
            <span className="font-bold text-[#2E221F]">{course.vacancies ? `${course.vacancies} vagas` : "Ilimitadas"}</span>
          </div>
          <div>
            <span className="block text-[#78716c]">Investimento</span>
            <span className="font-bold text-[#E65100]">100% Gratuito</span>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#2E221F]">Sobre a Capacitação</h2>
          <p className="text-sm text-[#57433C] leading-relaxed whitespace-pre-line">
            {course.description}
          </p>
        </div>

        {course.targetAudience && (
          <div className="space-y-2">
            <h2 className="text-base font-bold text-[#2E221F]">Público-Alvo</h2>
            <p className="text-sm text-[#57433C]">{course.targetAudience}</p>
          </div>
        )}

        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#FFF8F2] to-[#FEEDDF]/50 border border-[#FDCFA9] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-[#2E221F]">Inscrições Externas</h3>
            <p className="text-xs text-[#78716c]">
              Você será redirecionado para o formulário oficial de matrícula do parceiro ({course.provider.name}).
            </p>
          </div>

          <a
            href={`/api/courses/${course.id}/click`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shrink-0"
          >
            <span>Realizar Inscrição Gratuita</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
