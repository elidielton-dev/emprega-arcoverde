import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { BookOpen, ArrowLeft, Plus, Eye } from "lucide-react";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel de governança</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Gestão Editorial & Artigos
        </h1>
        <p className="text-xs text-[#78716c]">
          Publique e atualize conteúdos de orientação para os trabalhadores e participantes da Feira de Empregabilidade.
        </p>
      </div>

      <div className="space-y-4">
        {articles.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                  {art.category.name}
                </span>
                <span className="text-xs text-[#78716c]">
                  Publicado em {art.publishedAt ? new Date(art.publishedAt).toLocaleDateString("pt-BR") : "Rascunho"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-[#2E221F]">{art.title}</h3>
              <p className="text-xs text-[#57433C] line-clamp-1">{art.summary}</p>
            </div>

            <Link
              href={`/conteudos/${art.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-[#FFF8F2] hover:bg-[#FEEDDF] text-[#BF360C] font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar Artigo</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
