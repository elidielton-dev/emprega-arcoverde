import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { User, Phone, MapPin, GraduationCap, Car, Shield, CheckCircle2, AlertCircle, Save } from "lucide-react";

interface PerfilPageProps {
  searchParams: {
    sucesso?: string;
    erro?: string;
  };
}

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId: session.userId },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Dados Pessoais & Contato
        </h1>
        <p className="text-xs text-[#78716c]">
          Mantenha seus telefones e endereço sempre atualizados para que as empresas consigam falar com você.
        </p>
      </div>

      {searchParams.sucesso && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Dados atualizados com sucesso!</span>
        </div>
      )}

      <form action="/api/candidate/profile" method="POST" className="bg-white p-6 sm:p-10 rounded-3xl border border-[#FEEDDF] shadow-xs space-y-6">
        {/* Identificação */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <User className="w-4 h-4 text-[#E65100]" />
            <span>Identificação Básica</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Nome Completo</label>
              <input
                type="text"
                name="fullName"
                required
                defaultValue={profile?.fullName || session.name}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Título Profissional / Objetivo</label>
              <input
                type="text"
                name="professionalHeadline"
                defaultValue={profile?.professionalHeadline || ""}
                placeholder="Ex: Assistente Administrativo | Vendas"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>
        </div>

        {/* Contato & Localização */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <Phone className="w-4 h-4 text-[#E65100]" />
            <span>Contato & Localização</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Telefone Principal</label>
              <input
                type="text"
                name="phone"
                defaultValue={profile?.phone || ""}
                placeholder="(87) 99999-9999"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">WhatsApp (para avisos)</label>
              <input
                type="text"
                name="whatsapp"
                defaultValue={profile?.whatsapp || ""}
                placeholder="(87) 99999-9999"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Bairro</label>
              <input
                type="text"
                name="neighborhood"
                defaultValue={profile?.neighborhood || ""}
                placeholder="Ex: São Cristóvão / Centro"
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Cidade</label>
              <input
                type="text"
                name="city"
                defaultValue={profile?.city || "Arcoverde"}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Estado</label>
              <input
                type="text"
                name="state"
                defaultValue={profile?.state || "PE"}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
              />
            </div>
          </div>
        </div>

        {/* Qualificação Básica */}
        <div className="space-y-4 pt-2">
          <h2 className="text-sm font-bold text-[#2E221F] flex items-center gap-2 border-b border-[#FEEDDF] pb-2">
            <GraduationCap className="w-4 h-4 text-[#E65100]" />
            <span>Escolaridade & Habilitação</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Escolaridade</label>
              <select
                name="educationLevel"
                defaultValue={profile?.educationLevel || "MEDIO"}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="FUNDAMENTAL">Ensino Fundamental</option>
                <option value="MEDIO">Ensino Médio</option>
                <option value="TECNICO">Ensino Técnico</option>
                <option value="SUPERIOR">Ensino Superior</option>
                <option value="POS">Pós-Graduação / Especialização</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Carteira de Habilitação (CNH)</label>
              <select
                name="driverLicense"
                defaultValue={profile?.driverLicense || "NENHUMA"}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="NENHUMA">Não possuo CNH</option>
                <option value="A">Categoria A (Moto)</option>
                <option value="B">Categoria B (Carro)</option>
                <option value="AB">Categoria AB (Moto e Carro)</option>
                <option value="C">Categoria C (Caminhão)</option>
                <option value="D">Categoria D (Ônibus / Van)</option>
                <option value="E">Categoria E (Carreta)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#57433C] mb-1">Disponibilidade</label>
              <select
                name="availability"
                defaultValue={profile?.availability || "INTEGRAL"}
                className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] bg-white focus:outline-none focus:border-[#E65100]"
              >
                <option value="INTEGRAL">Período Integral</option>
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#57433C] mb-1">
              Necessidade Especial / Acessibilidade (Opcional e confidencial)
            </label>
            <input
              type="text"
              name="accessibilityNeeds"
              defaultValue={profile?.accessibilityNeeds || ""}
              placeholder="Ex: Recursos de acessibilidade motora, auditiva, etc."
              className="w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]"
            />
          </div>
        </div>

        {/* Consentimento & Privacidade LGPD */}
        <div className="space-y-3 pt-2 bg-[#FFF8F2] p-4 rounded-2xl border border-[#FEEDDF]">
          <h3 className="text-xs font-bold text-[#2E221F] flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-[#E65100]" />
            <span>Consentimento de Comunicação (LGPD)</span>
          </h3>

          <div className="space-y-2 text-xs text-[#57433C]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="emailConsent"
                defaultChecked={profile?.emailConsent ?? true}
                className="rounded text-[#E65100] focus:ring-[#E65100]"
              />
              <span>Autorizo o envio de e-mails com atualizações sobre minhas candidaturas e vagas recomendadas.</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="whatsappConsent"
                defaultChecked={profile?.whatsappConsent ?? false}
                className="rounded text-[#E65100] focus:ring-[#E65100]"
              />
              <span>Autorizo o contato via WhatsApp oficial para avisos urgentes de processos seletivos.</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </form>
    </div>
  );
}
