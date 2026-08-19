import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Mail, ArrowLeft, Send } from "lucide-react";

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#111111]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo className="justify-center mx-auto" />
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Recuperar senha
        </h1>
        <p className="text-sm text-[#FDCFA9]">
          Informe seu e-mail para receber as instruções de redefinição de acesso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#FEEDDF] shadow-md space-y-6">
          <form action="/entrar?sucesso=email_recuperacao_enviado" method="GET" className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">
                E-mail cadastrado
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A8A29E] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="exemplo@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#FEEDDF] text-xs text-[#2E221F] focus:outline-none focus:border-[#E65100]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Enviar Link de Recuperação</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/entrar"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78716c] hover:text-[#E65100]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar para o login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
