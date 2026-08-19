import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { GraduationCap, ArrowLeft, ExternalLink, Users, Eye } from "lucide-react";

export default async function AdminCursosPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const courses = await prisma.course.findMany({
    include: { provider: true },
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
          Gestão de Cursos Gratuitos
        </h1>
        <p className="text-xs text-[#78716c]">
          Cadastre e monitore os cursos oferecidos por parceiros oficiais (Prefeitura, Sebrae, Senai, Senac).
        </p>
      </div>

      <div className="space-y-4">
        {courses.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                  {c.provider.name}
                </span>
                <span className="text-xs text-[#78716c] font-semibold">{c.modality}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}>
                  {c.status === "ACTIVE" ? "Inscrições Abertas" : "Encerrado"}
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#2E221F]">{c.title}</h3>
              <p className="text-xs text-[#57433C] line-clamp-1">{c.description}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-xs text-[#78716c]">
                <span className="text-lg font-black text-[#E65100] block">{c.clicksCount}</span>
                <span>cliques de interesse</span>
              </div>
              <a
                href={c.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2E221F] hover:bg-[#1F1614] text-white font-bold text-xs p-2.5 rounded-xl transition"
                title="Acessar link externo"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
