import React from "react";
import { prisma } from "@/lib/db/prisma";
import { ExternalLink, Link2, ShieldCheck } from "lucide-react";

export default async function LinksUteisPage() {
  const links = await prisma.usefulLink.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="max-w-3xl space-y-2">
        <h1 className="text-3xl font-black text-[#2E221F] tracking-tight">
          Links Úteis para o Trabalhador e Cidadão
        </h1>
        <p className="text-sm text-[#78716c]">
          Acesse rapidamente os principais serviços digitais oficiais de trabalho, previdência, microempreendedorismo e prefeitura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {links.map((link) => (
          <div
            key={link.id}
            className="bg-white rounded-3xl p-6 border border-[#FEEDDF] hover:border-[#E65100]/50 hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9]">
                  {link.category}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#78716c]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Link Oficial
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#2E221F] leading-snug">
                {link.title}
              </h3>

              <p className="text-xs text-[#57433C] leading-relaxed">
                {link.description}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#FEEDDF]">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E65100] hover:text-[#D84315] hover:underline"
              >
                <span>Acessar portal oficial</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
