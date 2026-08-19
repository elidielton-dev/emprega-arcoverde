"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { User, Building2, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export default function CadastroPage() {
  const [role, setRole] = useState<"CANDIDATE" | "COMPANY_MEMBER">("CANDIDATE");

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo className="justify-center mx-auto" />
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Crie seu cadastro gratuito
        </h1>
        <p className="text-sm text-[#FDCFA9]">
          Conecte-se às oportunidades da cidade de Arcoverde.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#FEEDDF] shadow-md space-y-6">
          {/* Seletor de Tipo de Conta */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#FFF8F2] rounded-2xl border border-[#FEEDDF]">
            <button
              type="button"
              onClick={() => setRole("CANDIDATE")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                role === "CANDIDATE"
                  ? "bg-[#E65100] text-white shadow-xs"
                  : "text-[#57433C] hover:text-[#E65100]"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Sou Candidato</span>
            </button>

            <button
              type="button"
              onClick={() => setRole("COMPANY_MEMBER")}
              className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition ${
                role === "COMPANY_MEMBER"
                  ? "bg-[#E65100] text-white shadow-xs"
                  : "text-[#57433C] hover:text-[#E65100]"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Sou Empresa</span>
            </button>
          </div>

          {role === "CANDIDATE" && <OAuthButtons variant="light" />}

          <form action="/api/auth/register" method="POST" className="space-y-4">
            <input type="hidden" name="role" value={role} />

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">
                {role === "CANDIDATE" ? "Nome Completo" : "Nome do Responsável de RH"}
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder={role === "CANDIDATE" ? "Seu nome completo" : "Nome do responsável"}
                className="w-full px-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
              />
            </div>

            {role === "COMPANY_MEMBER" && (
              <div>
                <label className="block text-xs font-bold text-[#57433C] mb-1">
                  Nome da Empresa / Razão Social
                </label>
                <input
                  type="text"
                  name="companyName"
                  required
                  placeholder="Ex: Comercial Silva Ltda"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">
                E-mail
              </label>
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
              <label className="block text-xs font-bold text-[#57433C] mb-1">
                Criar Senha
              </label>
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
              <span>{role === "CANDIDATE" ? "Criar Meu Currículo Grátis" : "Cadastrar Empresa"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

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
