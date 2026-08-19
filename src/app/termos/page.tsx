import React from "react";

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-black text-[#2E221F] tracking-tight">Termos de Uso</h1>
      <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] space-y-4 text-sm text-[#57433C] leading-relaxed">
        <p>
          Bem-vindo ao <strong>Emprega Arcoverde</strong>, um serviço público digital mantido pela Prefeitura Municipal de Arcoverde em cooperação técnica com a Associação Comercial de Arcoverde (ACA).
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">1. Finalidade do Serviço</h2>
        <p>
          O Emprega Arcoverde tem como objetivo exclusivo aproximar trabalhadores em busca de oportunidades e empresas contratantes, além de divulgar cursos de capacitação profissional e ações como a Feira de Empregabilidade.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">2. Gratuidade</h2>
        <p>
          O cadastro, envio de currículo e candidatura para qualquer vaga neste portal são <strong>100% gratuitos para os candidatos</strong>. É terminantemente proibida a cobrança de valores de candidatos para participação em processos seletivos.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">3. Decisão Humana de Contratação</h2>
        <p>
          A plataforma não realiza desclassificação ou rejeição automatizada por inteligência artificial. Os algoritmos de pontuação de compatibilidade são estritamente determinísticos e explicativos, servindo apenas para auxílio na triagem humana.
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">4. Responsabilidades</h2>
        <p>
          As empresas são integralmente responsáveis pelas informações prestadas em suas vagas e pelo cumprimento das normas da Consolidação das Leis do Trabalho (CLT).
        </p>
      </div>
    </div>
  );
}
