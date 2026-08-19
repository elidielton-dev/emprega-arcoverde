import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DemoAccounts } from "@/components/auth/DemoAccounts";
import { OAuthButtons } from "@/components/auth/OAuthButtons";

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

  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <BrandLogo className="justify-center mx-auto" />
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Acesse sua conta
        </h1>
        <p className="text-sm text-[#FDCFA9]">
          Entre para gerenciar seu currículo, acompanhar candidaturas ou publicar vagas.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#1A1412] py-8 px-6 sm:px-10 border border-[#3D271D] space-y-6">
          {erro && (
            <div className="p-3.5 border border-red-400/40 bg-red-950/40 text-sm text-red-200" role="alert">
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
            <div className="p-3.5 border border-emerald-400/40 bg-emerald-950/40 text-sm text-emerald-100">
              {sucesso === "email_recuperacao_enviado"
                ? "Se o e-mail existir, você receberá as instruções de recuperação."
                : "Conta criada com sucesso. Você já pode entrar."}
            </div>
          )}

          <OAuthButtons next={redirect} variant="dark" />

          <form id="login-form" action="/api/auth/login" method="POST" className="space-y-4">
            <input type="hidden" name="redirect" value={redirect} />

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#FEEDDF] mb-1">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="exemplo@email.com"
                className="w-full px-4 py-3 bg-black border border-[#3D271D] text-white text-sm placeholder:text-[#78716c] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-semibold text-[#FEEDDF]">
                  Senha
                </label>
                <Link href="/esqueci-a-senha" className="text-xs text-[#FDBA2D] hover:underline font-semibold">
                  Esqueceu a senha?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-black border border-[#3D271D] text-white text-sm placeholder:text-[#78716c] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#E65100] hover:bg-[#FF6A12] text-white font-extrabold text-base py-4 transition"
            >
              Entrar
            </button>
          </form>

          <DemoAccounts />

          <p className="text-center text-sm text-[#C4A574]">
            Ainda não tem cadastro?{" "}
            <Link href="/cadastro" className="font-bold text-[#FDBA2D] hover:underline">
              Cadastre-se gratuitamente
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
