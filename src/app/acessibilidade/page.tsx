import React from "react";

export default function AcessibilidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
      <h1 className="text-3xl font-black text-[#2E221F] tracking-tight">Declaração de Acessibilidade</h1>
      <div className="bg-white p-8 rounded-3xl border border-[#FEEDDF] space-y-4 text-sm text-[#57433C] leading-relaxed">
        <p>
          O <strong>Emprega Arcoverde</strong> foi desenvolvido com base nas diretrizes internacionais de acessibilidade para conteúdo web (WCAG 2.1 nível AA) e no Modelo de Acessibilidade em Governo Eletrônico (e-MAG).
        </p>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">1. Recursos Implementados</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Contraste visual ajustado entre texto e plano de fundo</li>
          <li>Navegação completa por teclado com indicador visual de foco em todos os botões e links</li>
          <li>Rótulos textuais explícitos (labels) para todos os campos de formulário</li>
          <li>Linguagem clara, direta e em português simples</li>
          <li>Design 100% responsivo para telas pequenas e celulares populares</li>
        </ul>
        <h2 className="text-base font-bold text-[#2E221F] pt-2">2. Inclusão Presencial (Cadastro Assistido)</h2>
        <p>
          Para cidadãos com dificuldades de acesso à tecnologia ou limitações visuais/motoras, a Prefeitura de Arcoverde disponibiliza o <strong>Cadastro Assistido presencial na Sala do Empreendedor</strong>, onde um atendente treinado preenche os dados em conjunto com o cidadão.
        </p>
      </div>
    </div>
  );
}
