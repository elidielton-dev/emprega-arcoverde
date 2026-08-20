import React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { MarkAllReadButton } from "@/components/notifications/MarkAllReadButton";

type Props = {
  userId: string;
  backHref: string;
  backLabel: string;
  title?: string;
  description?: string;
};

export async function NotificationsInbox({
  userId,
  backHref,
  backLabel,
  title = "Notificações",
  description = "Avisos sobre candidaturas, vagas e ações da plataforma.",
}: Props) {
  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={backHref}
          className="mb-2 inline-flex text-xs font-medium text-[#78716c] hover:text-[#E65100]"
        >
          ← {backLabel}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1410]">{title}</h1>
            <p className="mt-1 text-sm text-[#78716c]">{description}</p>
          </div>
          {unread > 0 && <MarkAllReadButton />}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#E6E8EB] bg-white">
        {notifications.length === 0 ? (
          <div className="space-y-2 px-6 py-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-[#A8A29E]" />
            <h3 className="text-sm font-bold text-[#1C1410]">Nenhuma notificação</h3>
            <p className="text-xs text-[#78716c]">
              Você verá aqui avisos de processos seletivos, moderação e demais eventos.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E6E8EB]">
            {notifications.map((n) => {
              const body = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <h4
                      className={`text-sm ${
                        n.isRead ? "font-semibold text-[#57433C]" : "font-bold text-[#1C1410]"
                      }`}
                    >
                      {n.title}
                    </h4>
                    <span className="shrink-0 text-[11px] text-[#A8A29E]">
                      {new Date(n.createdAt).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-[#78716c]">{n.message}</p>
                  {!n.isRead && (
                    <span className="mt-2 inline-block rounded bg-[#FFF4EA] px-1.5 py-0.5 text-[10px] font-bold text-[#E65100]">
                      Nova
                    </span>
                  )}
                </>
              );
              const className = `block px-4 py-3.5 transition hover:bg-[#F4F5F7] ${
                n.isRead ? "" : "bg-[#FFFBF7]"
              }`;
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link href={n.link} className={className}>
                      {body}
                    </Link>
                  ) : (
                    <div className={className}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
