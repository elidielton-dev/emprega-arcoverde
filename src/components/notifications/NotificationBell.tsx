"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type Props = {
  inboxHref: string;
  /** Variante visual alinhada ao shell (claro) ou navbar pública */
  variant?: "shell" | "navbar";
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function NotificationBell({ inboxHref, variant = "shell" }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 45000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function markRead(ids?: string[], all?: boolean) {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(all ? { all: true } : { ids }),
      });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function onItemClick(n: NotificationItem) {
    if (!n.isRead) await markRead([n.id]);
    setOpen(false);
  }

  const triggerClass =
    variant === "navbar"
      ? "relative rounded-full p-2.5 text-[#6B7280] hover:bg-[#F4F5F7] hover:text-[#E65100]"
      : "relative rounded-md border border-[#E6E8EB] p-2 text-[#78716c] hover:border-[#E65100]/35 hover:text-[#1C1410]";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={triggerClass}
        aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Notificações"}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E65100] px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-lg border border-[#E6E8EB] bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-[#E6E8EB] px-3 py-2.5">
            <p className="text-xs font-bold text-[#1C1410]">Notificações</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markRead(undefined, true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#E65100] hover:underline"
              >
                <CheckCheck className="h-3 w-3" />
                Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[#78716c]">Carregando…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-[#78716c]">
                Nenhuma notificação por enquanto.
              </p>
            ) : (
              <ul className="divide-y divide-[#F0F1F3]">
                {items.map((n) => {
                  const inner = (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-xs leading-snug ${
                            n.isRead ? "font-medium text-[#57433C]" : "font-bold text-[#1C1410]"
                          }`}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-[#A8A29E]">
                          {formatWhen(n.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-[#78716c]">{n.message}</p>
                    </>
                  );
                  const rowClass = `block px-3 py-2.5 transition hover:bg-[#F4F5F7] ${
                    n.isRead ? "" : "bg-[#FFF8F2]/60"
                  }`;
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          className={rowClass}
                          onClick={() => onItemClick(n)}
                        >
                          {inner}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className={`${rowClass} w-full text-left`}
                          onClick={() => onItemClick(n)}
                        >
                          {inner}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-[#E6E8EB] px-3 py-2">
            <Link
              href={inboxHref}
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-bold text-[#E65100] hover:underline"
            >
              Ver todas
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
