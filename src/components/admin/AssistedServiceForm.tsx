"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { PageHeader, SurfaceCard } from "@/components/admin/ui";

const STEPS = [
  "Identificação",
  "Contato",
  "Perfil profissional",
  "Formação",
  "Observações",
  "Consentimento",
] as const;

const inputClass =
  "w-full rounded-md border border-[#E6E8EB] px-3 py-2.5 text-xs text-[#1C1410] outline-none focus:border-[#E65100]";

type Props = {
  operatorName: string;
  operatorEmail: string;
  success?: boolean;
  error?: string;
  successName?: string;
};

export function AssistedServiceForm({
  operatorName,
  operatorEmail,
  success,
  error,
  successName,
}: Props) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [educationLevel, setEducationLevel] = useState("MEDIO");
  const [driverLicense, setDriverLicense] = useState("NENHUMA");
  const [professionalHeadline, setProfessionalHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState("");
  const [assistedNotes, setAssistedNotes] = useState("");
  const [assistedUnit, setAssistedUnit] = useState("Sala do Empreendedor de Arcoverde");

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cadastrar cidadão"
        description="Preencha o perfil junto com o cidadão no atendimento presencial."
      />

      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Atendimento concluído. <strong>{successName || "Candidato"}</strong> cadastrado e ativo.
        </div>
      )}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          {error === "email_ja_cadastrado"
            ? "Este e-mail já pertence a uma conta. Peça ao cidadão para recuperar o acesso."
            : "Não foi possível concluir o cadastro. Revise os dados obrigatórios."}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 border-b border-[#E6E8EB] pb-3">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
              i === step
                ? "bg-[#FFF4EA] text-[#E65100]"
                : i < step
                  ? "text-[#1C1410]"
                  : "text-[#78716c]"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                i === step
                  ? "bg-[#E65100] text-white"
                  : i < step
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-[#F4F5F7]"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <form action="/api/admin/assisted-service" method="POST">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <SurfaceCard className="space-y-4 p-5">
            {step === 0 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Identificação</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Unidade *</label>
                  <select
                    name="assistedUnit"
                    value={assistedUnit}
                    onChange={(e) => setAssistedUnit(e.target.value)}
                    className={inputClass}
                  >
                    <option value="Sala do Empreendedor de Arcoverde">
                      Sala do Empreendedor de Arcoverde
                    </option>
                    <option value="Associação Comercial de Arcoverde (ACA)">
                      Associação Comercial de Arcoverde (ACA)
                    </option>
                    <option value="Balcão Feira de Empregabilidade">
                      Balcão Feira de Empregabilidade
                    </option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Nome completo *</label>
                  <input
                    name="fullName"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">E-mail *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Contato</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Telefone *</label>
                    <input
                      name="phone"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">WhatsApp</label>
                    <input
                      name="whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Bairro</label>
                  <input
                    name="neighborhood"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Perfil profissional</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Cargo desejado</label>
                  <input
                    name="professionalHeadline"
                    value={professionalHeadline}
                    onChange={(e) => setProfessionalHeadline(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Resumo de experiências</label>
                  <textarea
                    name="summary"
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">
                    Habilidades (separadas por vírgula)
                  </label>
                  <input
                    name="skills"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Formação</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Escolaridade</label>
                    <select
                      name="educationLevel"
                      value={educationLevel}
                      onChange={(e) => setEducationLevel(e.target.value)}
                      className={inputClass}
                    >
                      <option value="FUNDAMENTAL">Ensino Fundamental</option>
                      <option value="MEDIO">Ensino Médio</option>
                      <option value="TECNICO">Ensino Técnico</option>
                      <option value="SUPERIOR">Ensino Superior</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">CNH</label>
                    <select
                      name="driverLicense"
                      value={driverLicense}
                      onChange={(e) => setDriverLicense(e.target.value)}
                      className={inputClass}
                    >
                      <option value="NENHUMA">Não possui</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Observações do atendimento</h3>
                <input
                  name="assistedNotes"
                  value={assistedNotes}
                  onChange={(e) => setAssistedNotes(e.target.value)}
                  placeholder="Documentos conferidos; encaminhamentos..."
                  className={inputClass}
                />
              </>
            )}

            {step === 5 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Consentimento LGPD</h3>
                <label className="flex items-start gap-2 rounded-md border border-[#E6E8EB] bg-[#FFF4EA] p-4 text-xs font-semibold text-[#1C1410]">
                  <input
                    type="checkbox"
                    name="consentGiven"
                    required
                    defaultChecked
                    className="mt-0.5 text-[#E65100]"
                  />
                  O cidadão autorizou a coleta e o uso dos dados para intermediação de oportunidades
                  e Feira de Empregabilidade.
                </label>
              </>
            )}

            {/* Persist all fields across steps */}
            {step !== 0 && (
              <>
                <input type="hidden" name="assistedUnit" value={assistedUnit} />
                <input type="hidden" name="fullName" value={fullName} />
                <input type="hidden" name="email" value={email} />
              </>
            )}
            {step !== 1 && (
              <>
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="whatsapp" value={whatsapp} />
                <input type="hidden" name="neighborhood" value={neighborhood} />
              </>
            )}
            {step !== 2 && (
              <>
                <input type="hidden" name="professionalHeadline" value={professionalHeadline} />
                <input type="hidden" name="summary" value={summary} />
                <input type="hidden" name="skills" value={skills} />
              </>
            )}
            {step !== 3 && (
              <>
                <input type="hidden" name="educationLevel" value={educationLevel} />
                <input type="hidden" name="driverLicense" value={driverLicense} />
              </>
            )}
            {step !== 4 && <input type="hidden" name="assistedNotes" value={assistedNotes} />}
          </SurfaceCard>

          <div className="space-y-3">
            <SurfaceCard className="p-4">
              <h3 className="text-sm font-bold text-[#1C1410]">Atendimento em andamento</h3>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1410] text-xs font-bold text-white">
                  {(fullName || "CF")
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p) => p[0] || "")
                    .join("")
                    .toUpperCase() || "CF"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1410]">{fullName || "Cidadão"}</p>
                  <p className="text-[11px] text-[#78716c]">{assistedUnit}</p>
                </div>
              </div>
              <dl className="mt-3 space-y-1 text-[11px] text-[#78716c]">
                <div className="flex justify-between">
                  <dt>Operador</dt>
                  <dd className="font-semibold text-[#1C1410]">{operatorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Progresso</dt>
                  <dd className="font-semibold text-[#1C1410]">
                    {step + 1} de {STEPS.length}
                  </dd>
                </div>
              </dl>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F4F5F7]">
                <div className="h-full rounded-full bg-[#E65100]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 truncate text-[10px] text-[#78716c]">{operatorEmail}</p>
            </SurfaceCard>

            <SurfaceCard className="p-4">
              <h3 className="text-sm font-bold text-[#1C1410]">Campos obrigatórios</h3>
              <ul className="mt-3 space-y-2 text-xs">
                {STEPS.map((label, i) => (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full ${
                        i < step
                          ? "bg-emerald-100 text-emerald-700"
                          : i === step
                            ? "bg-[#FFF4EA] text-[#E65100]"
                            : "bg-[#F4F5F7] text-[#78716c]"
                      }`}
                    >
                      {i < step ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </SurfaceCard>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[#E6E8EB] bg-white py-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-md border border-[#E6E8EB] px-3.5 py-2 text-xs font-bold text-[#1C1410]"
            >
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Próxima etapa
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Finalizar cadastro assistido
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
