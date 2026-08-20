"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CalendarDays,
  Library,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const NAV = [
  { href: "/empresa", label: "Visão geral", icon: LayoutDashboard, exact: true },
  { href: "/empresa/vagas", label: "Vagas", icon: Briefcase },
  { href: "/empresa/candidatos", label: "Candidatos", icon: Users },
  { href: "/empresa/entrevistas", label: "Entrevistas", icon: CalendarDays },
  { href: "/empresa/banco-talentos", label: "Banco de talentos", icon: Library },
  { href: "/empresa/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/empresa/configuracoes", label: "Configurações", icon: Settings },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function breadcrumbLabel(pathname: string) {
  if (pathname.startsWith("/empresa/candidatos")) return "Candidatos";
  if (pathname.startsWith("/empresa/entrevistas")) return "Entrevistas";
  if (pathname.startsWith("/empresa/banco-talentos")) return "Banco de talentos";
  if (pathname.startsWith("/empresa/relatorios")) return "Relatórios";
  if (pathname.startsWith("/empresa/configuracoes") || pathname.startsWith("/empresa/perfil")) {
    return "Configurações";
  }
  if (pathname.startsWith("/empresa/vagas")) return "Vagas";
  return "Visão geral";
}

export type CompanyShellProps = {
  companyName: string;
  userName: string;
  userRoleLabel?: string;
  children: React.ReactNode;
};

export function CompanyShell({
  companyName,
  userName,
  userRoleLabel = "Recrutador(a)",
  children,
}: CompanyShellProps) {
  const pathname = usePathname() || "/empresa";
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = breadcrumbLabel(pathname);
  const initials = userName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const sidebar = (
    <aside className="flex h-full w-[268px] shrink-0 flex-col bg-[#1C1410] text-white">
      <div className="space-y-3 border-b border-white/10 px-4 py-4">
        <Link
          href="/empresa"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-center rounded-md bg-white px-3 py-2.5"
        >
          <BrandLogo variant="compact" isLink={false} className="justify-center" />
        </Link>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2.5 text-left"
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A8A29E]">
              Empresa
            </p>
            <p className="truncate text-sm font-bold text-white">{companyName}</p>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#A8A29E]" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
          const Icon = item.icon;
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
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-[#E65100]" : "opacity-85"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-md bg-white/5 px-2.5 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E65100] text-xs font-bold">
            {initials || "E"}
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
              <span className="font-medium text-[#1C1410]/70">Painel da empresa</span>
              <span className="mx-1.5 text-[#D6D3D1]">/</span>
              <span className="font-semibold text-[#1C1410]">{current}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell inboxHref="/empresa/notificacoes" />
          </div>
        </header>

        <div className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">{children}</div>
      </div>
    </div>
  );
}
