import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageContent } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canManageContent(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const data = await req.formData();
  const action = String(data.get("action") || "CREATE");
  const id = String(data.get("id") || "").trim();

  if (action === "DELETE" && id) {
    await prisma.usefulLink.delete({ where: { id } });
    await logAudit({
      userId: session.userId,
      action: "USEFUL_LINK_DELETED",
      resourceType: "UsefulLink",
      resourceId: id,
    });
    return formRedirect(new URL("/admin/links-uteis?sucesso=removido", req.url));
  }

  if (action === "TOGGLE" && id) {
    const link = await prisma.usefulLink.findUnique({ where: { id } });
    if (!link) return formRedirect(new URL("/admin/links-uteis?erro=nao_encontrado", req.url));
    await prisma.usefulLink.update({
      where: { id },
      data: { isActive: !link.isActive },
    });
    return formRedirect(new URL("/admin/links-uteis?sucesso=atualizado", req.url));
  }

  const title = String(data.get("title") || "").trim();
  const description = String(data.get("description") || "").trim();
  const url = String(data.get("url") || "").trim();
  const category = String(data.get("category") || "Cidadão").trim();
  const order = parseInt(String(data.get("order") || "0"), 10) || 0;

  if (!title || !description || !url) {
    return formRedirect(new URL("/admin/links-uteis?erro=campos", req.url));
  }

  if (action === "UPDATE" && id) {
    await prisma.usefulLink.update({
      where: { id },
      data: { title, description, url, category, order },
    });
    return formRedirect(new URL("/admin/links-uteis?sucesso=atualizado", req.url));
  }

  const link = await prisma.usefulLink.create({
    data: { title, description, url, category, order, isActive: true },
  });

  await logAudit({
    userId: session.userId,
    action: "USEFUL_LINK_CREATED",
    resourceType: "UsefulLink",
    resourceId: link.id,
  });

  return formRedirect(new URL("/admin/links-uteis?sucesso=criado", req.url));
}
