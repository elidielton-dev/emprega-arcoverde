import React from "react";
import Link from "next/link";
import { BrandLogo, FeiraLogo } from "../ui/BrandLogo";

export function Footer() {
  return (
    <footer className="bg-black text-[#FEEDDF] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <BrandLogo />
            <FeiraLogo />
            <p className="text-sm text-[#C4A574] leading-relaxed">
              Portal público e gratuito de empregabilidade de Arcoverde. Conecta trabalhadores, empresas, ACA e Sala do Empreendedor.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#FDBA2D] mb-4">
              Oportunidades
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/vagas" className="text-[#FEEDDF] hover:text-white">
                  Buscar vagas
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="text-[#FEEDDF] hover:text-white">
                  Cadastrar currículo
                </Link>
              </li>
              <li>
                <Link href="/cursos" className="text-[#FEEDDF] hover:text-white">
                  Cursos gratuitos
                </Link>
              </li>
              <li>
                <Link href="/conteudos" className="text-[#FEEDDF] hover:text-white">
                  Dicas de carreira
                </Link>
              </li>
              <li>
                <Link href="/links-uteis" className="text-[#FEEDDF] hover:text-white">
                  Links úteis
                </Link>
              </li>
              <li>
                <Link href="/empresas/interesse" className="text-[#FEEDDF] hover:text-white">
                  Sou empresa
                </Link>
              </li>
              <li>
                <Link href="/entrar" className="text-[#FEEDDF] hover:text-white">
                  Área da empresa
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#FDBA2D] mb-4">
              Atendimento presencial
            </h3>
            <ul className="space-y-3 text-sm text-[#C4A574]">
              <li>
                <strong className="text-white">Sala do Empreendedor de Arcoverde</strong>
                <br />
                Rua Cap. Arlindo Pachêco de Albuquerque, Centro
              </li>
              <li>Segunda a sexta: 08h às 14h</li>
              <li>(87) 3821-9000</li>
              <li>contato@emprega.arcoverde.pe.gov.br</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold tracking-widest uppercase text-[#FDBA2D] mb-4">
              Realização
            </h3>
            <p className="text-sm text-[#C4A574] leading-relaxed mb-4">
              Prefeitura de Arcoverde, Associação Comercial de Arcoverde (ACA) e entidades parceiras do Sistema S.
            </p>
            <p className="text-sm text-[#FEEDDF] leading-relaxed">
              Precisa de ajuda para cadastrar? Vá à Sala do Empreendedor e peça o cadastro assistido gratuito.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[#2A1F1C] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8A7A70]">
          <div>© {new Date().getFullYear()} Emprega Arcoverde. Plataforma pública de empregabilidade.</div>
          <div className="flex items-center gap-6">
            <Link href="/termos" className="hover:text-white">
              Termos de uso
            </Link>
            <Link href="/privacidade" className="hover:text-white">
              Privacidade (LGPD)
            </Link>
            <Link href="/acessibilidade" className="hover:text-white">
              Acessibilidade
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
