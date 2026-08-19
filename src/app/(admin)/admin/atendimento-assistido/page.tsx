import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canPerformAssistedService } from "@/lib/auth/rbac";
import { Users, UserPlus, CheckCircle2, Shield, ArrowLeft, Save, Sparkles, AlertCircle } from "lucide-react";

interface AtendimentoAssistidoPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
    nome?: string;
  };
}

export default async function AtendimentoAssistidoPage({ searchParams }: AtendimentoAssistidoPageProps) {
  const session = await getSession();
  if (!session || !canPerformAssistedService(session.role)) {
    redirect("/entrar");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel administrativo</span>
        </Link>
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8F2] text-[#E65100] border border-[#FDCFA9] text-xs font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Módulo de Atendimento Presencial</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
            Cadastro Assistido de Candidato
          </h1>
          <p className="text-xs text-[#78716c]">
            Utilize este formulário para cadastrar cidadãos presentes na <strong>Sala do Empreendedor</strong> ou <strong>ACA</strong> que necessitam de auxílio digital.
          </p>
        </div>
      </div>

      {searchParams.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Atendimento concluído com sucesso!</span>
          </div>
          <p>
            O candidato <strong>{searchParams.nome || "Candidato"}</strong> foi cadastrado e já está ativo para receber oportunidades e encaminhamentos da Feira de Empregabilidade.
          </p>
        </div>
      )}

      {/* Identificação do Operador */}
      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-[#57433C] flex items-center justify-between">
        <div>
          <span className="font-bold text-[#2E221F]">Operador Responsável:</span> {session.name} ({session.email})
        </div>
        <span className="text-[11px] bg-white px-2.5 py-1 rounded-md border border-stone-200 text-stone-600 font-semibold">
          Registro Auditado
        </span>
      </div>

      {/* Formulário Guiado de Atendimento */}
      <form
        action="/api/admin/assisted-service"
        method="POST"
        className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6"
      >
        {/* Unidade de Atendimento */}
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Unidade de Atendimento *</label>
          <select
            name="assistedUnit"
            defaultValue="Sala do Empreendedor de Arcoverde"
            className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-[#FFF8F2] focus:outline-none focus:border-[#E65100] font-medium"
          >
            <option value="Sala do Empreendedor de Arcoverde">Sala do Empreendedor de Arcoverde (Prefeitura)</option>
            <option value="Associação Comercial de Arcoverde (ACA)">Associação Comercial de Arcoverde (ACA)</option>
            <option value="Balcão Feira de Empregabilidade">Balcão Feira de Empregabilidade</option>
          </select>
        </div>

        {/* Dados do Cidadão */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#2E221F] border-b border-[#FEEDDF] pb-2">
            1. Dados Pessoais do Candidato
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Nome Completo *</label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="Nome do cidadão atendido"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">E-mail para Acesso e Avisos *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="email@exemplo.com ou gere com o cidadão"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Telefone Principal *</label>
              <input
                type="text"
                name="phone"
                required
                placeholder="(87) 99999-9999"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">WhatsApp (se houver)</label>
              <input
                type="text"
                name="whatsapp"
                placeholder="(87) 99999-9999"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Bairro em Arcoverde</label>
              <input
                type="text"
                name="neighborhood"
                placeholder="Ex: São Cristóvão / Centro"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>
        </div>

        {/* Qualificação & Escolaridade */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#2E221F] border-b border-[#FEEDDF] pb-2">
            2. Escolaridade & Perfil Profissional
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Escolaridade</label>
              <select
                name="educationLevel"
                defaultValue="MEDIO"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="FUNDAMENTAL">Ensino Fundamental</option>
                <option value="MEDIO">Ensino Médio</option>
                <option value="TECNICO">Ensino Técnico</option>
                <option value="SUPERIOR">Ensino Superior</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Carteira de Habilitação (CNH)</label>
              <select
                name="driverLicense"
                defaultValue="NENHUMA"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="NENHUMA">Não possui</option>
                <option value="A">Categoria A</option>
                <option value="B">Categoria B</option>
                <option value="AB">Categoria AB</option>
                <option value="C">Categoria C</option>
                <option value="D">Categoria D</option>
                <option value="E">Categoria E</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Área de Interesse / Profissão Alvo</label>
            <input
              type="text"
              name="professionalHeadline"
              placeholder="Ex: Auxiliar de Limpeza, Vendedor de Loja, Motorista"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Resumo das Experiências Anteriores do Cidadão</label>
            <textarea
              name="summary"
              rows={3}
              placeholder="Descreva onde o candidato já trabalhou ou quais tarefas práticas sabe executar com facilidade..."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Habilidades Identificadas (Separadas por vírgula)</label>
            <input
              type="text"
              name="skills"
              placeholder="Ex: Pontualidade, Atendimento, Organização, Boa Vontade, Carga e Descarga"
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">Observações Internas do Atendimento</label>
            <input
              type="text"
              name="assistedNotes"
              placeholder="Ex: Documentos conferidos presencialmente; encaminhado para feira de vagas."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Termo de Consentimento Presencial (LGPD) */}
        <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FDCFA9] space-y-2">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#2E221F] font-bold">
            <input
              type="checkbox"
              name="consentGiven"
              required
              defaultChecked
              className="mt-0.5 rounded text-[#E65100] focus:ring-[#E65100]"
            />
            <span>
              O cidadão autorizou formalmente a coleta, registro e envio de seus dados curriculares para empresas de Arcoverde e para a Feira de Empregabilidade.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Finalizar Cadastro Assistido</span>
        </button>
      </form>
    </div>
  );
}
