import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { MapPin, Phone } from "lucide-react";
import { companyInterestMessage, getCompanyContactChannels, whatsappLink } from "@/lib/company/contact";

export default function EmpresaInteressePage() {
  const { acaPhone, prefeituraPhone } = getCompanyContactChannels();
  const message = companyInterestMessage();
  const acaHref = whatsappLink(acaPhone, message);
  const prefeituraHref = whatsappLink(prefeituraPhone, message);

  return (
    <div className="min-h-[80vh] bg-[#F4F5F7] py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <BrandLogo className="justify-center mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#E65100] tracking-tight">
            Quero cadastrar minha empresa
          </h1>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6E8EB] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={acaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold text-sm py-3 rounded-full"
            >
              Falar com a ACA no WhatsApp
            </a>
            <a
              href={prefeituraHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-[#1C1410] hover:bg-black text-white font-bold text-sm py-3 rounded-full"
            >
              Falar com a Prefeitura no WhatsApp
            </a>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-[#E6E8EB] p-5 text-sm text-[#4B5563] space-y-2">
            <p className="font-bold text-[#1A1A1A]">ACA</p>
            <p className="flex gap-2">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              Av. Cel. Antônio Japiassu, 590 - Centro
            </p>
            <p className="flex gap-2">
              <Phone className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              (87) 3821-1234
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E6E8EB] p-5 text-sm text-[#4B5563] space-y-2">
            <p className="font-bold text-[#1A1A1A]">Sala do Empreendedor</p>
            <p className="flex gap-2">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              Rua Cap. Arlindo Pachêco de Albuquerque, Centro
            </p>
            <p className="flex gap-2">
              <Phone className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              (87) 3821-9000
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-[#6B7280]">
          É candidato?{" "}
          <Link href="/cadastro" className="font-bold text-[#E65100] hover:underline">
            Cadastre o currículo
          </Link>
        </p>
      </div>
    </div>
  );
}
