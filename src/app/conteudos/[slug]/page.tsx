import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ArrowLeft } from "lucide-react";
import { ArticleBody } from "@/components/content/ArticleBody";
import { CopyLinkButton } from "@/components/content/CopyLinkButton";

function formatDate(value: Date | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export default async function ArtigoSlugPage({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!article || article.status !== "PUBLISHED") {
    notFound();
  }

  const related = await prisma.article.findMany({
    where: { status: "PUBLISHED", slug: { not: article.slug } },
    include: { category: true },
    orderBy: { publishedAt: "desc" },
    take: 2,
  });

  const published = formatDate(article.publishedAt);

  return (
    <div className="bg-white">
      <article className="max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          href="/conteudos"
          className="inline-flex items-center gap-2 text-sm text-[#4B5563] hover:text-[#E65100]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Notícias e dicas
        </Link>

        {article.coverImageUrl ? (
          <figure className="mt-6">
            <img
              src={`${article.coverImageUrl}?v=3`}
              alt=""
              className="w-full aspect-[16/9] object-cover rounded-2xl"
            />
            <figcaption className="mt-2 text-[13px] text-[#4B5563]">Foto ilustrativa.</figcaption>
          </figure>
        ) : null}

        <h1 className="mt-7 text-[2rem] sm:text-[2.5rem] font-extrabold tracking-tight text-[#1A1A1A] leading-[1.15]">
          {article.title}
        </h1>

        <p className="mt-4 text-sm text-[#4B5563]">
          {article.category.name}
          {published ? (
            <>
              <span aria-hidden="true"> · </span>
              {published}
            </>
          ) : null}
          <span aria-hidden="true"> · </span>
          {article.readTimeMinutes} min de leitura
          <span aria-hidden="true"> · </span>
          {article.authorName}
        </p>

        <p className="mt-6 text-[19px] leading-[1.6] text-[#1A1A1A] font-medium max-w-[65ch]">
          {article.summary}
        </p>

        <div className="mt-8">
          <ArticleBody content={article.content} />
        </div>

        <div className="mt-12 pt-8 border-t border-[#E6E8EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CopyLinkButton />
          <Link
            href="/vagas"
            className="inline-flex justify-center bg-[#1C1410] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full"
          >
            Ver vagas
          </Link>
        </div>

        {related.length > 0 ? (
          <aside className="mt-14">
            <h2 className="text-lg font-extrabold text-[#E65100]">Outras dicas</h2>
            <ul className="mt-4 divide-y divide-[#E6E8EB] border-y border-[#E6E8EB]">
              {related.map((item) => (
                <li key={item.id}>
                  <Link href={`/conteudos/${item.slug}`} className="flex gap-4 py-4 group">
                    {item.coverImageUrl ? (
                      <img
                        src={`${item.coverImageUrl}?v=3`}
                        alt=""
                        className="w-28 sm:w-36 aspect-[16/9] object-cover rounded-xl shrink-0"
                      />
                    ) : null}
                    <span className="min-w-0">
                      <span className="block text-xs text-[#4B5563]">{item.category.name}</span>
                      <span className="block mt-1 font-bold text-[#1A1A1A] leading-snug group-hover:text-[#E65100]">
                        {item.title}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </article>
    </div>
  );
}
