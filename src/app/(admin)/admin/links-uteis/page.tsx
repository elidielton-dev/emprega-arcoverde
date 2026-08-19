import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { Link2, ArrowLeft, ExternalLink } from "lucide-react";

export default async function AdminLinksUteisPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const links = await prisma.usefulLink.findMany({
    orderBy: { order: "asc" },
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
          Gestão de Links Úteis Oficiais
        </h1>
        <p className="text-xs text-[#78716c]">
          Cadastre e organize os atalhos de serviços governamentais para trabalhadores e empreendedores de Arcoverde.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((l) => (
          <div
            key={l.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] shadow-xs flex items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                {l.category}
              </span>
              <h3 className="text-base font-bold text-[#2E221F]">{l.title}</h3>
              <p className="text-xs text-[#57433C] line-clamp-1">{l.description}</p>
            </div>

            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#2E221F] hover:bg-[#1F1614] text-white transition shrink-0"
              title="Testar link"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
