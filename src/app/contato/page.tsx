import React from "react";
import { MapPin, Phone, Mail, Clock, MessageSquare } from "lucide-react";

export default function ContatoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-[#2E221F] tracking-tight">
          Fale Conosco
        </h1>
        <p className="text-sm text-[#78716c]">
          Estamos prontos para atender você, seja candidato em busca de orientação, empresa parceira ou operador de atendimento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cartão de Atendimento Presencial */}
        <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#2E221F] flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#E65100]" />
            <span>Sala do Empreendedor</span>
          </h2>

          <p className="text-xs text-[#78716c] leading-relaxed">
            Atendimento presencial e suporte ao cadastro assistido para quem não possui computador ou internet.
          </p>

          <div className="space-y-3 text-xs text-[#57433C]">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              <span>Rua Cap. Arlindo Pachêco de Albuquerque, Centro - Arcoverde - PE</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#E65100] shrink-0" />
              <span>Horário: Segunda a Sexta, das 08h às 14h</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#E65100] shrink-0" />
              <span>(87) 3821-9000</span>
            </div>
          </div>
        </div>

        {/* Cartão da ACA */}
        <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-[#2E221F] flex items-center gap-2">
            <Building className="w-5 h-5 text-[#E65100]" />
            <span>Associação Comercial de Arcoverde (ACA)</span>
          </h2>

          <p className="text-xs text-[#78716c] leading-relaxed">
            Apoio direto às empresas associadas para publicação de vagas e suporte aos processos da Feira de Empregabilidade.
          </p>

          <div className="space-y-3 text-xs text-[#57433C]">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0 mt-0.5" />
              <span>Av. Cel. Antônio Japiassu, 590 - Centro - Arcoverde - PE</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#E65100] shrink-0" />
              <span>(87) 3821-1234</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#E65100] shrink-0" />
              <span>contato@acaarcoverde.com.br</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Building(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/>
      <path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>
    </svg>
  );
}
