import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { PageHeader, StatusPill, SurfaceCard } from "@/components/admin/ui";
import { Eye } from "lucide-react";

export default async function AdminConteudosPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const articles = await prisma.article.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Conteúdos"
        description="Publique e atualize orientações para trabalhadores e a Feira de Empregabilidade."
      />

      <SurfaceCard className="overflow-hidden">
        {articles.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-[#78716c]">Nenhum artigo cadastrado.</p>
        ) : (
          <ul className="divide-y divide-[#E6E8EB]">
            {articles.map((art) => (
              <li
                key={art.id}
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill label={art.category.name} tone="orange" />
                    <span className="text-[11px] text-[#78716c]">
                      {art.publishedAt
                        ? `Publicado em ${new Date(art.publishedAt).toLocaleDateString("pt-BR")}`
                        : "Rascunho"}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#1C1410]">{art.title}</h3>
                  <p className="line-clamp-1 text-xs text-[#78716c]">{art.summary}</p>
                </div>
                <Link
                  href={`/conteudos/${art.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E8EB] px-3 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visualizar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SurfaceCard>
    </div>
  );
}
