import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { withDb } from "@/lib/db/safe";
import { Search, MapPin, GraduationCap } from "lucide-react";
import { HOME_BRIEF } from "./home-brief";
import { JobCard } from "@/components/jobs/JobCard";
import { ArticleCard } from "@/components/content/ArticleCard";

function HeroPlaneMobile() {
  return (
    <img
      src="/illustrations/hero-plane.png?v=2"
      alt=""
      className="lg:hidden mx-auto w-[min(72vw,280px)] h-auto mb-5 select-none pointer-events-none"
    />
  );
}

function HeroLetter() {
  return (
    <img
      src="/illustrations/hero-letter.png"
      alt=""
      className="hidden lg:block shrink-0 w-[min(22vw,220px)] h-auto -mr-4 select-none pointer-events-none motion-safe:animate-[hero-drift_4.8s_ease-in-out_infinite_alternate]"
    />
  );
}

function HeroPlane() {
  return (
    <img
      src="/illustrations/hero-plane.png?v=2"
      alt=""
      className="hidden lg:block shrink-0 w-[min(28vw,280px)] h-auto ml-6 lg:ml-8 select-none pointer-events-none"
    />
  );
}

export default async function HomePage() {
  const [featuredJobs, activeCourses, recentArticles] = await withDb(
    () =>
      Promise.all([
        prisma.job.findMany({
          where: {
            status: "PUBLISHED",
            company: { status: "ACTIVE" },
            OR: [{ applicationDeadline: null }, { applicationDeadline: { gte: new Date() } }],
          },
          include: {
            company: { select: { name: true, tradeName: true } },
            category: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        }),
        prisma.course.findMany({
          where: { status: "ACTIVE" },
          include: { provider: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        }),
        prisma.article.findMany({
          where: { status: "PUBLISHED" },
          include: { category: true },
          orderBy: { publishedAt: "desc" },
          take: 2,
        }),
      ]),
    [[], [], []],
  );

  return (
    <div className="pb-16">
      <section className="bg-white min-h-[calc(100dvh-72px)] flex flex-col justify-start pt-6 lg:justify-center lg:pt-0">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12">
          <HeroPlaneMobile />
          <div className="flex items-center justify-center gap-1 lg:gap-2">
            <HeroLetter />
            <div className="text-center max-w-xl">
              <h1 className="text-[2rem] sm:text-[2.75rem] font-extrabold tracking-tight text-[#E65100] leading-[1.15]">
                Encontre o emprego certo para você em Arcoverde
              </h1>
              <p className="mt-3 text-[#4B5563] text-[15px] max-w-xl mx-auto leading-relaxed">
                Portal público e gratuito. Busque vagas, cadastre o currículo ou peça ajuda na Sala do Empreendedor.
              </p>
            </div>
            <HeroPlane />
          </div>

          <form
            action={HOME_BRIEF.searchAction}
            method="GET"
            className="mt-8 sm:mt-10 max-w-3xl mx-auto bg-[#F4F5F7] rounded-[28px] sm:rounded-full p-2 flex flex-col sm:flex-row sm:items-stretch"
          >
            <label htmlFor="q" className="sr-only">
              Cargo ou palavra-chave
            </label>
            <div className="flex items-center gap-3 flex-1 px-4 min-h-[52px]">
              <Search className="w-5 h-5 text-[#6B7280] shrink-0" aria-hidden="true" />
              <input
                id="q"
                type="search"
                name="q"
                placeholder="Cargo, empresa ou palavra-chave"
                className="w-full text-[15px] text-[#1A1A1A] placeholder:text-[#6B7280] bg-transparent focus:outline-none"
              />
            </div>
            <div className="hidden sm:block w-px bg-[#D1D5DB] my-3" aria-hidden="true" />
            <label htmlFor="cidade" className="sr-only">
              Cidade
            </label>
            <div className="flex items-center gap-3 flex-1 px-4 min-h-[52px] border-t sm:border-t-0 border-[#E6E8EB]">
              <MapPin className="w-5 h-5 text-[#6B7280] shrink-0" aria-hidden="true" />
              <input
                id="cidade"
                type="text"
                name="cidade"
                defaultValue="Arcoverde"
                placeholder="Cidade"
                className="w-full text-[15px] text-[#1A1A1A] placeholder:text-[#6B7280] bg-transparent focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1C1410] hover:bg-black text-white font-bold text-[15px] rounded-full min-h-[48px] px-7 sm:min-w-[120px]"
            >
              Buscar
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#E65100]">Vagas em destaque</h2>
          <Link href="/vagas" className="text-sm font-semibold text-[#E65100] hover:underline">
            Ver todas
          </Link>
        </div>

        {featuredJobs.length === 0 ? (
          <div className="rounded-lg border border-[#E6E8EB] bg-white p-8 text-center shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
            <h3 className="font-bold text-[#1C1410]">Nenhuma vaga publicada no momento</h3>
            <p className="mt-2 text-sm text-[#78716c]">
              Cadastre seu currículo para ser avisado quando saírem novas vagas.
            </p>
            <Link href="/cadastro" className="mt-4 inline-block font-bold text-[#E65100] hover:underline">
              Cadastrar currículo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <div className="flex flex-col gap-5 rounded-lg border border-[#E6E8EB] bg-white p-5 shadow-[0_1px_2px_rgba(28,20,16,0.04)] sm:flex-row sm:items-center sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#F4F5F7]">
            <MapPin className="h-5 w-5 text-[#1C1410]" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-[#E65100]">Não consegue fazer o cadastro pela internet?</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#78716c]">
              Vá à Sala do Empreendedor ou à ACA. O cadastro assistido é gratuito: montamos o currículo com você.
            </p>
          </div>
          <Link
            href="/contato"
            className="inline-flex shrink-0 justify-center rounded-md bg-[#1C1410] px-5 py-2.5 text-sm font-bold text-white hover:bg-black"
          >
            Ver endereço
          </Link>
        </div>
      </section>

      {activeCourses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-xl font-extrabold text-[#E65100] sm:text-2xl">Cursos gratuitos</h2>
            <Link href="/cursos" className="text-sm font-semibold text-[#E65100] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {activeCourses.map((course) => (
              <article
                key={course.id}
                className="flex flex-col justify-between rounded-lg border border-[#E6E8EB] bg-white p-5 shadow-[0_1px_2px_rgba(28,20,16,0.04)]"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#78716c]">
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    <span>{course.provider.name}</span>
                    <span>·</span>
                    <span>{course.modality}</span>
                  </div>
                  <h3 className="mt-3 font-bold leading-snug text-[#1C1410]">{course.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#78716c]">
                    {course.description}
                  </p>
                </div>
                <Link
                  href={`/cursos/${course.slug}`}
                  className="mt-5 inline-flex justify-center rounded-md border border-[#E6E8EB] bg-white py-2.5 text-sm font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                >
                  Ver curso
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}

      {recentArticles.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-xl font-extrabold text-[#E65100] sm:text-2xl">Notícias e dicas</h2>
            <Link href="/conteudos" className="text-sm font-semibold text-[#E65100] hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recentArticles.map((article) => (
              <ArticleCard
                key={article.id}
                href={`/conteudos/${article.slug}`}
                title={article.title}
                readTimeMinutes={article.readTimeMinutes}
                coverImageUrl={article.coverImageUrl}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
