"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { Lock, Mail, ArrowRight, Building2 } from "lucide-react";

export default function CadastroPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F4F5F7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo className="justify-center mx-auto" />
        <h1 className="text-2xl font-extrabold text-[#E65100] tracking-tight">
          Crie seu cadastro gratuito
        </h1>
        <p className="text-sm text-[#4B5563]">
          Cadastro público é só para candidato. Empresa é cadastrada pela ACA ou pela Prefeitura.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#FEEDDF] shadow-md space-y-6">
          <OAuthButtons variant="light" />

          <form action="/api/auth/register" method="POST" className="space-y-4">
            <input type="hidden" name="role" value="CANDIDATE" />

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Nome Completo</label>
              <input
                type="text"
                name="name"
                required
                placeholder="Seu nome completo"
                className="w-full px-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Criar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2 text-xs text-[#57433C] cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  required
                  defaultChecked
                  className="mt-0.5 rounded text-[#E65100] focus:ring-[#E65100]"
                />
                <span>
                  Declaro que li e concordo com os{" "}
                  <Link href="/termos" className="text-[#E65100] underline font-medium">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/privacidade" className="text-[#E65100] underline font-medium">
                    Política de Privacidade (LGPD)
                  </Link>
                  .
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Criar Meu Currículo Grátis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="rounded-2xl border border-[#FEEDDF] bg-[#FFF8F2] p-4 space-y-2">
            <p className="text-xs font-bold text-[#2E221F] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#E65100]" />
              Representa uma empresa?
            </p>
            <p className="text-xs text-[#57433C] leading-relaxed">
              A empresa não se cadastra sozinha. Fale com a ACA ou com a Prefeitura para o cadastro institucional.
            </p>
            <Link href="/empresas/interesse" className="inline-block text-xs font-bold text-[#E65100] hover:underline">
              Quero cadastrar minha empresa
            </Link>
          </div>

          <div className="text-center pt-2 text-xs text-[#78716c]">
            Já tem cadastro?{" "}
            <Link href="/entrar" className="font-bold text-[#E65100] hover:underline">
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
