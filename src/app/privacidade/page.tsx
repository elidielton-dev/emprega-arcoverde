import React from "react";

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-black text-[#2E221F] tracking-tight">Política de Privacidade (LGPD)</h1>
      <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] space-y-4 text-sm text-[#57433C] leading-relaxed">
        <p>
          O <strong>Emprega Arcoverde</strong> respeita integralmente a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD).
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">1. Coleta e Minimização de Dados</h2>
        <p>
          Coletamos estritamente os dados essenciais para identificação, contato e avaliação profissional (nome, telefone/WhatsApp, cidade, escolaridade, histórico profissional e formação). Não exigimos CPF publicamente nem dados excessivos.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">2. Compartilhamento Restrito</h2>
        <p>
          Seus dados curriculares só são acessados pelas empresas em cujas vagas você se candidata voluntariamente, ou pelos operadores da ACA e Sala do Empreendedor para auxílio presencial. Uma empresa nunca tem acesso a candidatos ou candidaturas de outra empresa concorrente.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">3. Vagas Confidenciais</h2>
        <p>
          Em vagas confidenciais, a identidade da empresa contratante é resguardada, e seus dados só chegam aos recrutadores devidamente autorizados e auditados pelo sistema.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">4. Direitos do Titular</h2>
        <p>
          Você pode, a qualquer momento pelo seu painel, atualizar suas informações, revogar consentimentos de comunicação por e-mail ou WhatsApp, ou solicitar a exclusão definitiva de sua conta.
        </p>
      </div>
    </div>
  );
}
