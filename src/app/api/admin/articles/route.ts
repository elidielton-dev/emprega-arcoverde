import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageContent } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    await prisma.article.delete({ where: { id } });
    await logAudit({
      userId: session.userId,
      action: "ARTICLE_DELETED",
      resourceType: "Article",
      resourceId: id,
    });
    return formRedirect(new URL("/admin/conteudos?sucesso=removido", req.url));
  }

  if (action === "SET_STATUS" && id) {
    const status = String(data.get("status") || "PUBLISHED");
    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return formRedirect(new URL("/admin/conteudos?erro=status", req.url));
    }
    await prisma.article.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });
    return formRedirect(new URL("/admin/conteudos?sucesso=status", req.url));
  }

  const title = String(data.get("title") || "").trim();
  const summary = String(data.get("summary") || "").trim();
  const content = String(data.get("content") || "").trim();
  const categoryName = String(data.get("categoryName") || "Geral").trim() || "Geral";
  const status = String(data.get("status") || "PUBLISHED");
  const authorName = String(data.get("authorName") || "Equipe Emprega Arcoverde").trim();
  const readTimeMinutes = Math.max(1, parseInt(String(data.get("readTimeMinutes") || "3"), 10) || 3);

  if (!title || !summary || !content) {
    return formRedirect(new URL("/admin/conteudos?erro=campos", req.url));
  }

  const catSlug = slugify(categoryName) || "geral";
  const category = await prisma.contentCategory.upsert({
    where: { slug: catSlug },
    update: { name: categoryName },
    create: { name: categoryName, slug: catSlug },
  });

  if (action === "UPDATE" && id) {
    await prisma.article.update({
      where: { id },
      data: {
        title,
        summary,
        content,
        categoryId: category.id,
        status,
        authorName,
        readTimeMinutes,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    await logAudit({
      userId: session.userId,
      action: "ARTICLE_UPDATED",
      resourceType: "Article",
      resourceId: id,
    });
    return formRedirect(new URL("/admin/conteudos?sucesso=atualizado", req.url));
  }

  const article = await prisma.article.create({
    data: {
      title,
      slug: `${slugify(title)}-${Date.now().toString(36)}`,
      summary,
      content,
      categoryId: category.id,
      status,
      authorName,
      readTimeMinutes,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
  });

  await logAudit({
    userId: session.userId,
    action: "ARTICLE_CREATED",
    resourceType: "Article",
    resourceId: article.id,
    details: { title },
  });

  return formRedirect(new URL("/admin/conteudos?sucesso=criado", req.url));
}
