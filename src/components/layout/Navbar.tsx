"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "../ui/BrandLogo";
import { LogOut, Menu, X, LogIn } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Vagas", href: "/vagas" },
    { label: "Cursos", href: "/cursos" },
    { label: "Conteúdos", href: "/conteudos" },
    { label: "Links úteis", href: "/links-uteis" },
    { label: "Contato", href: "/contato" },
  ];

  const getDashboardUrl = () => {
    if (!user) return "/entrar";
    if (user.role === "CANDIDATE") return "/painel";
    if (user.role === "COMPANY_MEMBER") return "/empresa";
    if (["ACA_ADMIN", "MUNICIPAL_ADMIN", "SUPER_ADMIN", "ASSISTED_OPERATOR"].includes(user.role)) {
      return "/admin";
    }
    return "/painel";
  };

  const getDashboardLabel = () => {
    if (!user) return "Entrar";
    if (user.role === "CANDIDATE") return "Meu painel";
    if (user.role === "COMPANY_MEMBER") return "Painel da empresa";
    if (user.role === "ASSISTED_OPERATOR") return "Atendimento assistido";
    return "Painel administrativo";
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E6E8EB]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-[72px]">
          <BrandLogo />

          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação principal">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 text-[15px] font-semibold rounded-full transition-colors ${
                    isActive ? "text-[#E65100] bg-[#FFF4EA]" : "text-[#3D3D3D] hover:text-[#E65100] hover:bg-[#F4F5F7]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <NotificationBell
                  inboxHref={
                    user.role === "CANDIDATE"
                      ? "/painel/notificacoes"
                      : user.role === "COMPANY_MEMBER"
                        ? "/empresa/notificacoes"
                        : "/admin/notificacoes"
                  }
                  variant="navbar"
                />
                <Link
                  href={getDashboardUrl()}
                  className="bg-[#1C1410] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full"
                >
                  {getDashboardLabel()}
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    title="Sair da conta"
                    className="p-2.5 text-[#6B7280] hover:text-[#E65100] rounded-full hover:bg-[#F4F5F7]"
                    aria-label="Sair da conta"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/cadastro"
                  className="text-[#3D3D3D] hover:text-[#E65100] text-sm font-semibold px-3 py-2 rounded-full"
                >
                  Cadastrar
                </Link>
                <Link
                  href="/entrar"
                  className="inline-flex items-center gap-2 bg-[#1C1410] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full"
                >
                  <LogIn className="w-4 h-4" strokeWidth={2.4} />
                  Entrar
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#1A1A1A] rounded-full hover:bg-[#F4F5F7]"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E6E8EB] bg-white px-4 pt-2 pb-5 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-base font-semibold text-[#1A1A1A] rounded-xl hover:bg-[#F4F5F7]"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-[#E6E8EB] flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={
                    user.role === "CANDIDATE"
                      ? "/painel/notificacoes"
                      : user.role === "COMPANY_MEMBER"
                        ? "/empresa/notificacoes"
                        : "/admin/notificacoes"
                  }
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center border border-[#E6E8EB] text-[#1C1410] font-semibold py-3 rounded-full"
                >
                  Notificações
                </Link>
                <Link
                  href={getDashboardUrl()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-[#1C1410] text-white font-bold py-3 rounded-full"
                >
                  {getDashboardLabel()}
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="w-full text-center text-sm text-[#6B7280] py-2 font-medium">
                    Encerrar sessão
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/entrar"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1C1410] text-white font-bold py-3 rounded-full"
                >
                  <LogIn className="w-4 h-4" strokeWidth={2.4} />
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center text-[#3D3D3D] font-semibold py-2"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
