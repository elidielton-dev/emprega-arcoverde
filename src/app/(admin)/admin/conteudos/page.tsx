import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageContent } from "@/lib/auth/rbac";
import { ArticlesBoard } from "@/components/admin/ArticlesBoard";

export default async function AdminConteudosPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const session = await getSession();
  if (!session || !canManageContent(session.role)) redirect("/admin");

  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ArticlesBoard
      sucesso={searchParams.sucesso}
      erro={searchParams.erro}
      articles={articles.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        content: a.content,
        status: a.status,
        categoryName: a.category.name,
        authorName: a.authorName,
        readTimeMinutes: a.readTimeMinutes,
        publishedAt: a.publishedAt?.toISOString() || null,
      }))}
    />
  );
}
