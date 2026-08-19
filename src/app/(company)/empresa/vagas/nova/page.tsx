import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Briefcase, ArrowLeft, ShieldAlert, Send, Save, AlertCircle } from "lucide-react";

export default async function NovaVagaPage() {
  const session = await getSession();
  if (!session || (session.role !== "COMPANY_MEMBER" && session.role !== "SUPER_ADMIN")) {
    redirect("/entrar");
  }

  const [membership, categories] = await Promise.all([
    prisma.companyMember.findFirst({
      where: { userId: session.userId },
      include: { company: true },
    }),
    prisma.jobCategory.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!membership) {
    redirect("/entrar");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/empresa"
          className="inline-flex items-center gap-2 text-sm text-[#78716c] hover:text-[#E65100] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao painel da empresa</span>
        </Link>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Cadastrar Nova Vaga
        </h1>
        <p className="text-xs text-[#78716c]">
          Preencha os detalhes da oportunidade. Sua vaga passará pela moderação da equipe da ACA antes da publicação pública.
        </p>
      </div>

      <form action="/api/company/jobs" method="POST" className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        <input type="hidden" name="companyId" value={membership.companyId} />

        {/* Título e Área */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Título da Vaga *</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Ex: Operador de Caixa e Atendimento"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Área / Categoria *</label>
            <select
              name="categoryId"
              required
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
            >
              <option value="">Selecione uma área</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resumo e Descrição */}
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Resumo Curto (Exibido no card) *</label>
          <input
            type="text"
            name="summary"
            required
            placeholder="Ex: Atendimento a clientes, abertura de caixa e organização de balcão."
            className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Descrição Completa das Atividades *</label>
          <textarea
            name="description"
            rows={5}
            required
            placeholder="Descreva detalhadamente a rotina, atribuições e horário de trabalho..."
            className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
          />
        </div>

        {/* Requisitos e Habilidades */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Requisitos Obrigatórios *</label>
            <textarea
              name="requirements"
              rows={3}
              required
              placeholder="Ex: Ensino Médio Completo, residir em Arcoverde..."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Habilidades Desejadas (Separadas por vírgula)</label>
            <textarea
              name="skillsText"
              rows={3}
              placeholder="Ex: Caixa, Atendimento ao Cliente, Boa Comunicação, Pontualidade"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Contrato, Modalidade e Detalhes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Tipo de Contrato</label>
            <select
              name="contractType"
              defaultValue="CLT"
              className="w-full text-xs p-2.5 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
            >
              <option value="CLT">CLT (Carteira)</option>
              <option value="ESTAGIO">Estágio</option>
              <option value="APRENDIZ">Jovem Aprendiz</option>
              <option value="TEMPORARIO">Temporário</option>
              <option value="PJ">PJ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Modalidade</label>
            <select
              name="workplaceType"
              defaultValue="PRESENCIAL"
              className="w-full text-xs p-2.5 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
            >
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="REMOTO">Remoto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Escolaridade Mínima</label>
            <select
              name="educationLevel"
              defaultValue="MEDIO"
              className="w-full text-xs p-2.5 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
            >
              <option value="FUNDAMENTAL">Fundamental</option>
              <option value="MEDIO">Médio</option>
              <option value="TECNICO">Técnico</option>
              <option value="SUPERIOR">Superior</option>
              <option value="POS">Pós-Graduação</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">CNH Necessária</label>
            <select
              name="driverLicense"
              defaultValue="NENHUMA"
              className="w-full text-xs p-2.5 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
            >
              <option value="NENHUMA">Não exige</option>
              <option value="A">Cat. A</option>
              <option value="B">Cat. B</option>
              <option value="AB">Cat. AB</option>
              <option value="C">Cat. C</option>
              <option value="D">Cat. D</option>
              <option value="E">Cat. E</option>
            </select>
          </div>
        </div>

        {/* Quantidade e Cidade */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Número de Vagas</label>
            <input
              type="number"
              name="vacanciesCount"
              min={1}
              defaultValue={1}
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Cidade da Vaga</label>
            <input
              type="text"
              name="city"
              defaultValue="Arcoverde"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Opção Vaga Confidencial */}
        <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#2E221F] font-bold">
            <input
              type="checkbox"
              name="isConfidential"
              className="mt-0.5 rounded text-[#E65100] focus:ring-[#E65100]"
            />
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#E65100]" />
              <span>Publicar como Vaga Confidencial</span>
            </span>
          </label>
          <p className="text-[11px] text-[#78716c] pl-6 leading-relaxed">
            O nome, razão social, logotipo e dados de contato de sua empresa não serão revelados publicamente aos candidatos. Apenas a equipe autorizada e os candidatos após contato terão ciência.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[#FEEDDF]">
          <button
            type="submit"
            name="actionType"
            value="SUBMIT"
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar para Moderação e Publicação</span>
          </button>

          <button
            type="submit"
            name="actionType"
            value="DRAFT"
            className="w-full sm:w-auto border border-[#E65100] text-[#E65100] hover:bg-[#FFF8F2] font-semibold text-xs px-6 py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar como Rascunho</span>
          </button>
        </div>
      </form>
    </div>
  );
}
