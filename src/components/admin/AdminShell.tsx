"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Headset,
  GraduationCap,
  BarChart3,
  UserCog,
  ClipboardList,
  Settings,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { AdminNavItem } from "@/lib/admin/context";

const ICONS: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/vagas": Briefcase,
  "/admin/empresas": Building2,
  "/admin/candidatos": Users,
  "/admin/atendimento-assistido": Headset,
  "/admin/cursos": GraduationCap,
  "/admin/indicadores": BarChart3,
  "/admin/usuarios": UserCog,
  "/admin/auditoria": ClipboardList,
  "/admin/configuracoes": Settings,
};

const GROUP_LABEL: Record<string, string> = {
  operation: "Operação",
  governance: "Governança",
};

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbLabel(pathname: string, items: AdminNavItem[]) {
  if (pathname.startsWith("/admin/empresas/nova")) return "Nova empresa";
  if (pathname.startsWith("/admin/vagas/nova")) return "Nova vaga";
  if (pathname.startsWith("/admin/cursos/nova")) return "Novo curso";
  if (pathname.match(/^\/admin\/candidatos\/[^/]+/)) return "Perfil do candidato";
  const match = [...items]
    .filter((i) => !i.exact)
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  if (match) return match.label;
  if (pathname === "/admin") return "Visão geral";
  return "Painel";
}

export type AdminShellProps = {
  orgLabel: string;
  orgHint?: string;
  userName: string;
  userRoleLabel: string;
  navItems: AdminNavItem[];
  children: React.ReactNode;
};

export function AdminShell({
  orgLabel,
  orgHint = "Painel institucional",
  userName,
  userRoleLabel,
  navItems,
  children,
}: AdminShellProps) {
  const pathname = usePathname() || "/admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = breadcrumbLabel(pathname, navItems);
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const navSections = useMemo(() => {
    const sections: { group: string; items: AdminNavItem[] }[] = [];
    for (const item of navItems) {
      const g = item.group || "operation";
      const last = sections[sections.length - 1];
      if (last && last.group === g) last.items.push(item);
      else sections.push({ group: g, items: [item] });
    }
    return sections;
  }, [navItems]);

  const sidebar = (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-[#1C1410] text-white">
      <div className="space-y-3 border-b border-white/10 px-4 py-4">
        <Link
          href="/admin"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center rounded-md bg-white px-3 py-2.5"
        >
          <BrandLogo variant="compact" isLink={false} className="justify-center" />
        </Link>
        <div className="rounded-md border border-white/15 bg-white/5 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
            Contexto
          </p>
          <p className="truncate text-sm font-bold text-white">{orgLabel}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2.5 py-4">
        {navSections.map((section) => (
          <div key={section.group}>
            {navSections.length > 1 && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]/80">
                {GROUP_LABEL[section.group] || section.group}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(pathname, item.href, item.exact);
                const Icon = ICONS[item.href] || LayoutDashboard;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition ${
                      active
                        ? "bg-white/10 text-white before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-sm before:bg-[#E65100]"
                        : "text-[#A8A29E] hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#E65100]" : "opacity-85"}`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-md bg-white/5 px-2.5 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E65100] text-xs font-bold">
            {initials || "A"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName}</p>
            <p className="truncate text-[11px] text-[#A8A29E]">{userRoleLabel}</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              title="Sair"
              className="rounded-md p-2 text-[#A8A29E] hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-[#F4F5F7]">
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[268px]">{sidebar}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/45"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{sidebar}</div>
          <button
            type="button"
            className="absolute right-3 top-3 rounded-full bg-white p-2 shadow"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-[#1C1410]" />
          </button>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-[268px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#E6E8EB] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-[#E6E8EB] p-2 text-[#1C1410] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <p className="truncate text-[12px] text-[#78716c]">
              <span className="font-medium text-[#1C1410]/70">{orgHint}</span>
              <span className="mx-1.5 text-[#D6D3D1]">/</span>
              <span className="font-semibold text-[#1C1410]">{current}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell inboxHref="/admin/notificacoes" />
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
