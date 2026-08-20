import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { PageHeader, StatusPill, SurfaceCard } from "@/components/admin/ui";
import { ExternalLink } from "lucide-react";

export default async function AdminLinksUteisPage() {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) {
    redirect("/entrar");
  }

  const links = await prisma.usefulLink.findMany({
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Links úteis"
        description="Atalhos de serviços governamentais para trabalhadores e empreendedores."
      />

      <div className="grid gap-3 md:grid-cols-2">
        {links.length === 0 ? (
          <SurfaceCard className="p-10 text-center text-xs text-[#78716c] md:col-span-2">
            Nenhum link cadastrado.
          </SurfaceCard>
        ) : (
          links.map((l) => (
            <SurfaceCard key={l.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 space-y-1">
                <StatusPill label={l.category} tone="orange" />
                <h3 className="font-bold text-[#1C1410]">{l.title}</h3>
                <p className="line-clamp-1 text-xs text-[#78716c]">{l.description}</p>
              </div>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-md bg-[#1C1410] p-2.5 text-white hover:bg-black"
                title="Abrir link"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </SurfaceCard>
          ))
        )}
      </div>
    </div>
  );
}
