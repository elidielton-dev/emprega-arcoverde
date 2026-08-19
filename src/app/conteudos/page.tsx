import React from "react";
import { prisma } from "@/lib/db/prisma";
import { BookOpen } from "lucide-react";
import { ArticleCard } from "@/components/content/ArticleCard";

export const revalidate = 60;

export default async function ConteudosPage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-extrabold text-[#E65100] tracking-tight">Notícias e dicas</h1>
      <p className="mt-2 text-[15px] text-[#4B5563] max-w-2xl leading-relaxed">
        Orientações sobre currículo, entrevistas e a Feira de Empregabilidade de Arcoverde.
      </p>

      {articles.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-[#E6E8EB] text-center max-w-md mx-auto mt-10">
          <BookOpen className="w-10 h-10 text-[#1A1A1A] mx-auto" aria-hidden="true" />
          <h2 className="text-base font-bold text-[#1A1A1A] mt-3">Nenhum artigo publicado no momento</h2>
          <p className="text-sm text-[#4B5563] mt-2">Novas dicas serão adicionadas em breve.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
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
