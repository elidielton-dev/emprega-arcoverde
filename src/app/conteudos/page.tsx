import React from "react";
import { prisma } from "@/lib/db/prisma";
import { withDb } from "@/lib/db/safe";
import { BookOpen } from "lucide-react";
import { ArticleCard } from "@/components/content/ArticleCard";

export default async function ConteudosPage() {
  const articles = await withDb(
    () =>
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        include: { category: true },
        orderBy: { publishedAt: "desc" },
      }),
    [],
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-[#E65100] tracking-tight">Notícias e dicas</h1>
      <p className="mt-2 text-[15px] text-[#4B5563] max-w-2xl leading-relaxed">
        Orientações sobre currículo, entrevistas e a Feira de Empregabilidade de Arcoverde.
      </p>

      {articles.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-[#E6E8EB] bg-white p-10 text-center shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
          <BookOpen className="mx-auto h-10 w-10 text-[#1C1410]" aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-[#1C1410]">Nenhum artigo publicado no momento</h2>
          <p className="mt-2 text-sm text-[#78716c]">Novas dicas serão adicionadas em breve.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              href={`/conteudos/${article.slug}`}
              title={article.title}
              readTimeMinutes={article.readTimeMinutes}
              coverImageUrl={article.coverImageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
