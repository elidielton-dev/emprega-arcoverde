import React from "react";
import Link from "next/link";
import { MapPin, Phone, Mail, Clock, Building2 } from "lucide-react";
import { getContactSettings } from "@/lib/site/settings";

export default async function ContatoPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const s = await getContactSettings();

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="text-3xl font-black tracking-tight text-[#1C1410] sm:text-4xl">
          Fale Conosco
        </h1>
        <p className="text-sm text-[#78716c]">
          Atendimento presencial na Sala e na ACA, ou envie uma mensagem pelo formulário.
        </p>
      </div>

      {searchParams.sucesso && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
          Mensagem enviada. Em breve a equipe retorna o contato.
        </div>
      )}
      {searchParams.erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-800">
          {searchParams.erro === "campos"
            ? "Preencha todos os campos corretamente."
            : "Não foi possível enviar. Tente de novo."}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1C1410]">
            <MapPin className="h-5 w-5 text-[#E65100]" />
            Sala do Empreendedor
          </h2>
          <p className="text-xs leading-relaxed text-[#78716c]">
            Atendimento presencial e cadastro assistido.
          </p>
          <div className="space-y-2 text-xs text-[#57433C]">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E65100]" />
              {s.address_sala}
            </p>
            <p className="flex gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[#E65100]" />
              {s.hours_sala}
            </p>
            <p className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[#E65100]" />
              {s.contact_phone_sala}
            </p>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#1C1410]">
            <Building2 className="h-5 w-5 text-[#E65100]" />
            ACA — Associação Comercial
          </h2>
          <p className="text-xs leading-relaxed text-[#78716c]">
            Apoio às empresas parceiras e Feira de Empregabilidade.
          </p>
          <div className="space-y-2 text-xs text-[#57433C]">
            <p className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E65100]" />
              {s.address_aca}
            </p>
            <p className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-[#E65100]" />
              {s.contact_phone_aca}
            </p>
            <p className="flex gap-2">
              <Mail className="h-4 w-4 shrink-0 text-[#E65100]" />
              {s.email_aca}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#E6E8EB] bg-white p-6 shadow-[0_1px_2px_rgba(28,20,16,0.04)] sm:p-8">
        <h2 className="text-lg font-bold text-[#1C1410]">Enviar mensagem</h2>
        <p className="mt-1 text-sm text-[#78716c]">
          Sua mensagem chega ao e-mail institucional do portal.
        </p>
        <form action="/api/contact" method="POST" className="mt-5 grid gap-3 sm:grid-cols-2">
          {/* honeypot anti-spam */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
            aria-hidden="true"
          />
          <label className="block text-xs font-bold text-[#57433C]">
            Nome *
            <input name="name" required className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            E-mail *
            <input name="email" type="email" required className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
            Assunto *
            <input name="subject" required className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal" />
          </label>
          <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
            Mensagem *
            <textarea name="message" required rows={5} className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal" />
          </label>
          <button
            type="submit"
            className="rounded-md bg-[#E65100] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D84315] sm:col-span-2 sm:w-fit"
          >
            Enviar
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-[#E6E8EB] bg-white p-6 text-center shadow-[0_1px_2px_rgba(28,20,16,0.04)]">
        <h2 className="text-lg font-bold text-[#1C1410]">Empresa que quer entrar no portal</h2>
        <p className="mt-1 text-sm text-[#78716c]">
          O cadastro não é feito pela internet. Fale com a ACA ou com a Prefeitura.
        </p>
        <Link
          href="/empresas/interesse"
          className="mt-4 inline-flex rounded-md bg-[#E65100] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#D84315]"
        >
          Quero cadastrar minha empresa
        </Link>
      </div>
    </div>
  );
}
