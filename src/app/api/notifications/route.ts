import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") || "12");
  const limit = Math.min(30, Math.max(1, Number.isFinite(limitParam) ? limitParam : 12));

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { ids?: string[]; all?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string") : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Informe ids ou all" }, { status: 400 });
  }

  await prisma.notification.updateMany({
    where: { userId: session.userId, id: { in: ids } },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
}
