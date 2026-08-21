import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageContent } from "@/lib/auth/rbac";
import { LinksBoard } from "@/components/admin/LinksBoard";

export default async function AdminLinksPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const session = await getSession();
  if (!session || !canManageContent(session.role)) redirect("/admin");

  const links = await prisma.usefulLink.findMany({ orderBy: [{ order: "asc" }, { title: "asc" }] });

  return (
    <LinksBoard
      sucesso={searchParams.sucesso}
      erro={searchParams.erro}
      links={links.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        url: l.url,
        category: l.category,
        order: l.order,
        isActive: l.isActive,
      }))}
    />
  );
}
