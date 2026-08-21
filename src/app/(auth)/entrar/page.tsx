import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DemoAccounts } from "@/components/auth/DemoAccounts";
import { OAuthButtons } from "@/components/auth/OAuthButtons";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { Lock, Mail, ArrowRight } from "lucide-react";

interface LoginPageProps {
  searchParams: {
    erro?: string;
    redirect?: string;
    sucesso?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const erro = searchParams.erro;
  const redirect = searchParams.redirect || "";
  const sucesso = searchParams.sucesso;
  const oauthEnabled = isSupabaseConfigured();

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#F4F5F7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo className="justify-center mx-auto" />
        <h1 className="text-2xl font-extrabold text-[#E65100] tracking-tight">
          Acesse sua conta
        </h1>
        <p className="text-sm text-[#4B5563]">
          Entre para gerenciar seu currículo, acompanhar candidaturas ou publicar vagas.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#FEEDDF] shadow-md space-y-6">
          {erro && (
            <div
              className="p-3.5 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700"
              role="alert"
            >
              {erro === "credenciais_invalidas"
                ? "E-mail ou senha incorretos."
                : erro === "dados_invalidos"
                ? "Preencha todos os campos corretamente."
                : erro === "oauth_nao_configurado"
                ? "Falta configurar o Supabase no .env (URL e chave anônima) e ligar Google e LinkedIn no painel Auth."
                : erro === "oauth_falhou"
                ? "Não foi possível entrar com a conta social. Tente de novo."
                : erro === "oauth_somente"
                ? "Esta conta entra com Google ou LinkedIn."
                : "Não foi possível entrar. Tente de novo."}
            </div>
          )}

          {sucesso && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">
              {sucesso === "email_recuperacao_enviado"
                ? "Se o e-mail existir, você receberá as instruções de recuperação."
                : "Conta criada com sucesso. Você já pode entrar."}
            </div>
          )}

          <OAuthButtons next={redirect} variant="light" enabled={oauthEnabled} />

          <form id="login-form" action="/api/auth/login" method="POST" className="space-y-4">
            <input type="hidden" name="redirect" value={redirect} />

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#57433C] mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-bold text-[#57433C]">
                  Senha
                </label>
                <Link href="/esqueci-a-senha" className="text-xs text-[#E65100] hover:underline font-bold">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <span>Entrar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <DemoAccounts />

          <div className="text-center pt-2 text-xs text-[#78716c]">
            Ainda não tem cadastro?{" "}
            <Link href="/cadastro" className="font-bold text-[#E65100] hover:underline">
              Cadastre-se gratuitamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
