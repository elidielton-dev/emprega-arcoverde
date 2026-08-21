import React from "react";
import Link from "next/link";
import { BrandLogo } from "../ui/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-[#1C1410] text-[#A8A29E] mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="space-y-3">
            <BrandLogo />
            <p className="text-sm leading-relaxed max-w-xs">
              Portal público e gratuito de empregabilidade de Arcoverde.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#E65100] mb-4">
              Links
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/vagas" className="hover:text-white transition">
                  Vagas
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="hover:text-white transition">
                  Cursos
                </Link>
              </li>
              <li>
                <Link href="/conteudos" className="hover:text-white transition">
                  Conteúdos
                </Link>
              </li>
              <li>
                <Link href="/links-uteis" className="hover:text-white transition">
                  Links úteis
                </Link>
              </li>
              <li>
                <Link href="/contato" className="hover:text-white transition">
                  Contato
                </Link>
              </li>
              <li>
                <Link href="/empresas/interesse" className="hover:text-white transition">
                  Sou empresa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#E65100] mb-4">
              Contato
            </h3>
            <p className="text-sm leading-relaxed">
              Sala do Empreendedor e ACA
            </p>
            <Link
              href="/contato"
              className="inline-block mt-3 text-sm font-semibold text-[#E65100] hover:text-[#FF6A12] transition"
            >
              Ver endereço
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#3D2A22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <p>
            © {new Date().getFullYear()} Emprega Arcoverde · Prefeitura · ACA · parceiros
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/termos" className="hover:text-white transition">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-white transition">
              Privacidade
            </Link>
            <Link href="/acessibilidade" className="hover:text-white transition">
              Acessibilidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
