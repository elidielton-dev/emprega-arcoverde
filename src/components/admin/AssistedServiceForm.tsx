"use client";

import React, { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { PageHeader, SurfaceCard } from "@/components/admin/ui";

const STEPS = [
  "Identificação",
  "Contato e endereço",
  "Objetivo e habilidades",
  "Experiências e formação",
  "Revisão e consentimento",
] as const;

const inputClass =
  "w-full rounded-md border border-[#E6E8EB] px-3 py-2.5 text-xs text-[#1C1410] outline-none focus:border-[#E65100]";

type ExperienceDraft = {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
};

type EducationDraft = {
  id: string;
  institution: string;
  course: string;
  level: string;
  status: string;
};

type CourseDraft = {
  id: string;
  institution: string;
  title: string;
  hours: string;
};

type Props = {
  operatorName: string;
  operatorEmail: string;
  assistedUnit: string;
  success?: boolean;
  error?: string;
  successName?: string;
  tempPassword?: string;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function AssistedServiceForm({
  operatorName,
  operatorEmail,
  assistedUnit,
  success,
  error,
  successName,
  tempPassword,
}: Props) {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [whatsappSame, setWhatsappSame] = useState(true);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [city, setCity] = useState("Arcoverde");
  const [state, setState] = useState("PE");
  const [neighborhood, setNeighborhood] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [professionalHeadline, setProfessionalHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [availability, setAvailability] = useState("IMEDIATA");
  const [educationLevel, setEducationLevel] = useState("MEDIO");
  const [driverLicense, setDriverLicense] = useState("NENHUMA");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [experiences, setExperiences] = useState<ExperienceDraft[]>([]);
  const [educations, setEducations] = useState<EducationDraft[]>([]);
  const [courses, setCourses] = useState<CourseDraft[]>([]);
  const [assistedNotes, setAssistedNotes] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);
  const effectiveWhatsapp = whatsappSame ? phone : whatsapp;

  const experiencesJson = useMemo(() => JSON.stringify(experiences), [experiences]);
  const educationsJson = useMemo(() => JSON.stringify(educations), [educations]);
  const coursesJson = useMemo(() => JSON.stringify(courses), [courses]);
  const skillsJson = useMemo(() => JSON.stringify(skills), [skills]);

  function addSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, s]);
    setSkillInput("");
  }

  function addExperience() {
    setExperiences((prev) => [
      ...prev,
      {
        id: uid(),
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        isCurrent: false,
        description: "",
      },
    ]);
  }

  function addEducation() {
    setEducations((prev) => [
      ...prev,
      {
        id: uid(),
        institution: "",
        course: "",
        level: educationLevel || "MEDIO",
        status: "CONCLUIDO",
      },
    ]);
  }

  function addCourse() {
    setCourses((prev) => [
      ...prev,
      { id: uid(), institution: "", title: "", hours: "" },
    ]);
  }

  function stepErrorMessage(s: number): string | null {
    if (s === 0) {
      if (!fullName.trim()) return "Informe o nome completo.";
      if (!email.trim() || !email.includes("@")) return "Informe um e-mail válido.";
    }
    if (s === 1) {
      if (!phone.trim()) return "Informe o telefone principal.";
      if (!whatsappSame && !whatsapp.trim()) return "Informe o WhatsApp ou marque que é o mesmo número.";
      if (!street.trim()) return "Informe a rua.";
      if (!addressNumber.trim()) return "Informe o número.";
      if (!city.trim()) return "Informe a cidade.";
      if (!state.trim()) return "Informe a UF.";
    }
    if (s === 2) {
      if (!professionalHeadline.trim()) return "Informe o cargo ou objetivo profissional.";
      if (!summary.trim()) return "Preencha o resumo profissional.";
      if (skills.length === 0) return "Adicione ao menos uma habilidade.";
    }
    if (s === 3) {
      const incompleteExp = experiences.some((e) => !e.company.trim() || !e.position.trim() || !e.startDate);
      if (incompleteExp) return "Complete empresa, cargo e data de início de cada experiência (ou remova).";
      const incompleteEdu = educations.some((e) => !e.institution.trim() || !e.course.trim());
      if (incompleteEdu) return "Complete instituição e curso de cada formação (ou remova).";
    }
    if (s === 4 && !consentGiven) {
      return "É necessário o consentimento do cidadão para finalizar.";
    }
    return null;
  }

  function goNext() {
    const err = stepErrorMessage(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((x) => x + 1);
  }

  function goToStep(i: number) {
    if (i <= step) {
      setStepError(null);
      setStep(i);
      return;
    }
    for (let s = 0; s < i; s++) {
      const err = stepErrorMessage(s);
      if (err) {
        setStep(s);
        setStepError(err);
        return;
      }
    }
    setStepError(null);
    setStep(i);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cadastro assistido de currículo"
        description="Monte o perfil e o currículo estruturado completo com o cidadão."
      />

      {success && (
        <div className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          <p>
            Currículo cadastrado. <strong>{successName || "Candidato"}</strong> já pode candidatar-se
            e completar o painel depois.
          </p>
          {tempPassword && (
            <p className="rounded-md bg-white/70 px-3 py-2 font-semibold text-emerald-950">
              Senha provisória: <code className="text-sm">{tempPassword}</code>
              <span className="mt-1 block font-normal text-emerald-800">
                Entregue ao cidadão para acessar o portal.
              </span>
            </p>
          )}
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
            onClick={() => goToStep(i)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-bold ${
              i === step ? "bg-[#FFF4EA] text-[#E65100]" : i < step ? "text-[#1C1410]" : "text-[#78716c]"
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
            <span className="hidden md:inline">{label}</span>
          </button>
        ))}
      </div>

      <form action="/api/admin/assisted-service" method="POST">
        <input type="hidden" name="assistedUnit" value={assistedUnit} />
        <input type="hidden" name="skillsJson" value={skillsJson} />
        <input type="hidden" name="experiencesJson" value={experiencesJson} />
        <input type="hidden" name="educationsJson" value={educationsJson} />
        <input type="hidden" name="coursesJson" value={coursesJson} />

        {stepError && (
          <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900">
            {stepError}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <SurfaceCard className="space-y-4 p-5">
            {step === 0 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Identificação</h3>
                <p className="text-[11px] text-[#78716c]">
                  Unidade: <strong className="text-[#1C1410]">{assistedUnit}</strong>
                </p>
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
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">E-mail de acesso *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Data de nascimento</label>
                  <input
                    type="date"
                    name="birthDate"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Contato e endereço</h3>
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
                      value={whatsappSame ? phone : whatsapp}
                      onChange={(e) => {
                        setWhatsappSame(false);
                        setWhatsapp(e.target.value);
                      }}
                      disabled={whatsappSame}
                      className={`${inputClass} disabled:bg-[#F4F5F7]`}
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#57433C]">
                  <input
                    type="checkbox"
                    checked={whatsappSame}
                    onChange={(e) => setWhatsappSame(e.target.checked)}
                    className="accent-[#E65100]"
                  />
                  WhatsApp é o mesmo número
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-[#57433C]">
                  <input
                    type="checkbox"
                    name="whatsappConsent"
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
                    className="accent-[#E65100]"
                  />
                  Autoriza contato por WhatsApp
                </label>
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Rua *</label>
                    <input
                      name="street"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Número *</label>
                    <input
                      name="addressNumber"
                      required
                      value={addressNumber}
                      onChange={(e) => setAddressNumber(e.target.value)}
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
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Cidade *</label>
                    <input
                      name="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">UF *</label>
                    <input
                      name="state"
                      required
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Objetivo e habilidades</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">
                    Cargo / objetivo profissional *
                  </label>
                  <input
                    name="professionalHeadline"
                    required
                    value={professionalHeadline}
                    onChange={(e) => setProfessionalHeadline(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">
                    Resumo profissional *
                  </label>
                  <textarea
                    name="summary"
                    required
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Trajetória, pontos fortes e disponibilidade..."
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Disponibilidade</label>
                    <select
                      name="availability"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className={inputClass}
                    >
                      <option value="IMEDIATA">Imediata</option>
                      <option value="MANHA">Manhã</option>
                      <option value="TARDE">Tarde</option>
                      <option value="NOITE">Noite</option>
                      <option value="INTEGRAL">Integral</option>
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
                      {["A", "B", "AB", "C", "D", "E"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">
                    Escolaridade geral
                  </label>
                  <select
                    name="educationLevel"
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className={inputClass}
                  >
                    <option value="FUNDAMENTAL">Fundamental</option>
                    <option value="MEDIO">Médio</option>
                    <option value="TECNICO">Técnico</option>
                    <option value="SUPERIOR">Superior</option>
                    <option value="POS">Pós-graduação</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Habilidades *</label>
                  <div className="flex gap-2">
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                      placeholder="Ex.: Excel, Atendimento..."
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#E65100] px-3 py-2 text-xs font-bold text-[#E65100] hover:bg-[#FFF4EA]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <li
                          key={s}
                          className="inline-flex items-center gap-1 rounded-md bg-[#F4F5F7] px-2 py-1 text-[11px] font-semibold text-[#1C1410]"
                        >
                          {s}
                          <button
                            type="button"
                            onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                            className="text-[#78716c] hover:text-red-600"
                            aria-label={`Remover ${s}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#1C1410]">Experiências profissionais</h3>
                  <button
                    type="button"
                    onClick={addExperience}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E65100] px-2.5 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FFF4EA]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar experiência
                  </button>
                </div>
                {experiences.length === 0 ? (
                  <p className="text-xs text-[#78716c]">
                    Nenhuma experiência ainda. Use o botão acima (opcional se for primeiro emprego).
                  </p>
                ) : (
                  <div className="space-y-3">
                    {experiences.map((exp, idx) => (
                      <div key={exp.id} className="space-y-2 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-[#78716c]">Experiência {idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => setExperiences((p) => p.filter((e) => e.id !== exp.id))}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            placeholder="Empresa *"
                            value={exp.company}
                            onChange={(e) =>
                              setExperiences((p) =>
                                p.map((x) => (x.id === exp.id ? { ...x, company: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            placeholder="Cargo *"
                            value={exp.position}
                            onChange={(e) =>
                              setExperiences((p) =>
                                p.map((x) => (x.id === exp.id ? { ...x, position: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) =>
                              setExperiences((p) =>
                                p.map((x) => (x.id === exp.id ? { ...x, startDate: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            type="month"
                            value={exp.endDate}
                            disabled={exp.isCurrent}
                            onChange={(e) =>
                              setExperiences((p) =>
                                p.map((x) => (x.id === exp.id ? { ...x, endDate: e.target.value } : x)),
                              )
                            }
                            className={`${inputClass} disabled:bg-white/50`}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-[11px] font-semibold text-[#57433C]">
                          <input
                            type="checkbox"
                            checked={exp.isCurrent}
                            onChange={(e) =>
                              setExperiences((p) =>
                                p.map((x) =>
                                  x.id === exp.id
                                    ? { ...x, isCurrent: e.target.checked, endDate: e.target.checked ? "" : x.endDate }
                                    : x,
                                ),
                              )
                            }
                            className="accent-[#E65100]"
                          />
                          Emprego atual
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Descrição das atividades"
                          value={exp.description}
                          onChange={(e) =>
                            setExperiences((p) =>
                              p.map((x) => (x.id === exp.id ? { ...x, description: e.target.value } : x)),
                            )
                          }
                          className={inputClass}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-[#E6E8EB] pt-4">
                  <h3 className="text-sm font-bold text-[#1C1410]">Formação</h3>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E65100] px-2.5 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FFF4EA]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar formação
                  </button>
                </div>
                {educations.length === 0 ? (
                  <p className="text-xs text-[#78716c]">Adicione cursos escolares ou superiores.</p>
                ) : (
                  <div className="space-y-3">
                    {educations.map((edu, idx) => (
                      <div key={edu.id} className="space-y-2 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-[#78716c]">Formação {idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => setEducations((p) => p.filter((e) => e.id !== edu.id))}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            placeholder="Instituição *"
                            value={edu.institution}
                            onChange={(e) =>
                              setEducations((p) =>
                                p.map((x) => (x.id === edu.id ? { ...x, institution: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            placeholder="Curso *"
                            value={edu.course}
                            onChange={(e) =>
                              setEducations((p) =>
                                p.map((x) => (x.id === edu.id ? { ...x, course: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <select
                            value={edu.level}
                            onChange={(e) =>
                              setEducations((p) =>
                                p.map((x) => (x.id === edu.id ? { ...x, level: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          >
                            <option value="FUNDAMENTAL">Fundamental</option>
                            <option value="MEDIO">Médio</option>
                            <option value="TECNICO">Técnico</option>
                            <option value="SUPERIOR">Superior</option>
                            <option value="POS">Pós</option>
                          </select>
                          <select
                            value={edu.status}
                            onChange={(e) =>
                              setEducations((p) =>
                                p.map((x) => (x.id === edu.id ? { ...x, status: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          >
                            <option value="CONCLUIDO">Concluído</option>
                            <option value="EM_ANDAMENTO">Em andamento</option>
                            <option value="TRANCADO">Trancado</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 border-t border-[#E6E8EB] pt-4">
                  <h3 className="text-sm font-bold text-[#1C1410]">Cursos livres / certificados</h3>
                  <button
                    type="button"
                    onClick={addCourse}
                    className="inline-flex items-center gap-1 rounded-md border border-[#E65100] px-2.5 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FFF4EA]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar curso
                  </button>
                </div>
                {courses.length === 0 ? (
                  <p className="text-xs text-[#78716c]">Opcional: Senai, Senac, cursos online, etc.</p>
                ) : (
                  <div className="space-y-3">
                    {courses.map((c, idx) => (
                      <div key={c.id} className="space-y-2 rounded-md border border-[#E6E8EB] bg-[#F4F5F7] p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-bold text-[#78716c]">Curso {idx + 1}</p>
                          <button
                            type="button"
                            onClick={() => setCourses((p) => p.filter((x) => x.id !== c.id))}
                            className="text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            placeholder="Título"
                            value={c.title}
                            onChange={(e) =>
                              setCourses((p) =>
                                p.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            placeholder="Instituição"
                            value={c.institution}
                            onChange={(e) =>
                              setCourses((p) =>
                                p.map((x) => (x.id === c.id ? { ...x, institution: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                          <input
                            placeholder="Carga horária"
                            value={c.hours}
                            onChange={(e) =>
                              setCourses((p) =>
                                p.map((x) => (x.id === c.id ? { ...x, hours: e.target.value } : x)),
                              )
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Revisão e consentimento</h3>
                <dl className="space-y-2 rounded-md bg-[#F4F5F7] p-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Nome</dt>
                    <dd className="font-semibold text-[#1C1410]">{fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Endereço</dt>
                    <dd className="text-right font-semibold text-[#1C1410]">
                      {street}, {addressNumber}
                      {neighborhood ? ` — ${neighborhood}` : ""} — {city}/{state}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Objetivo</dt>
                    <dd className="font-semibold text-[#1C1410]">{professionalHeadline}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Habilidades</dt>
                    <dd className="text-right font-semibold text-[#1C1410]">{skills.join(", ")}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Experiências</dt>
                    <dd className="font-semibold text-[#1C1410]">{experiences.length}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Formações</dt>
                    <dd className="font-semibold text-[#1C1410]">{educations.length}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Cursos</dt>
                    <dd className="font-semibold text-[#1C1410]">{courses.length}</dd>
                  </div>
                </dl>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">
                    Observações internas
                  </label>
                  <textarea
                    name="assistedNotes"
                    rows={2}
                    value={assistedNotes}
                    onChange={(e) => setAssistedNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <label className="flex items-start gap-2 rounded-md border border-[#E6E8EB] bg-[#FFF4EA] p-4 text-xs font-semibold text-[#1C1410]">
                  <input
                    type="checkbox"
                    name="consentGiven"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 accent-[#E65100]"
                  />
                  O cidadão autorizou a coleta e o uso dos dados do currículo para intermediação de
                  oportunidades e Feira de Empregabilidade (LGPD).
                </label>
              </>
            )}

            {/* Hidden persistence */}
            {step !== 0 && (
              <>
                <input type="hidden" name="fullName" value={fullName} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="birthDate" value={birthDate} />
              </>
            )}
            {step !== 1 && (
              <>
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="whatsapp" value={effectiveWhatsapp} />
                <input type="hidden" name="street" value={street} />
                <input type="hidden" name="addressNumber" value={addressNumber} />
                <input type="hidden" name="neighborhood" value={neighborhood} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="state" value={state} />
                {whatsappConsent && <input type="hidden" name="whatsappConsent" value="on" />}
              </>
            )}
            {step === 1 && whatsappSame && <input type="hidden" name="whatsapp" value={phone} />}
            {step !== 2 && (
              <>
                <input type="hidden" name="professionalHeadline" value={professionalHeadline} />
                <input type="hidden" name="summary" value={summary} />
                <input type="hidden" name="availability" value={availability} />
                <input type="hidden" name="driverLicense" value={driverLicense} />
                <input type="hidden" name="educationLevel" value={educationLevel} />
              </>
            )}
            {step !== 4 && <input type="hidden" name="assistedNotes" value={assistedNotes} />}
          </SurfaceCard>

          <div className="space-y-3">
            <SurfaceCard className="p-4">
              <h3 className="text-sm font-bold text-[#1C1410]">Atendimento em andamento</h3>
              <div className="mt-3">
                <p className="text-sm font-semibold text-[#1C1410]">{fullName || "Cidadão"}</p>
                <p className="text-[11px] text-[#78716c]">{assistedUnit}</p>
              </div>
              <dl className="mt-3 space-y-1 text-[11px] text-[#78716c]">
                <div className="flex justify-between">
                  <dt>Operador</dt>
                  <dd className="font-semibold text-[#1C1410]">{operatorName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Progresso</dt>
                  <dd className="font-semibold text-[#1C1410]">
                    {step + 1}/{STEPS.length}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Habilidades</dt>
                  <dd className="font-semibold text-[#1C1410]">{skills.length}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Experiências</dt>
                  <dd className="font-semibold text-[#1C1410]">{experiences.length}</dd>
                </div>
              </dl>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F4F5F7]">
                <div className="h-full rounded-full bg-[#E65100]" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 truncate text-[10px] text-[#78716c]">{operatorEmail}</p>
            </SurfaceCard>
            <SurfaceCard className="p-4">
              <h3 className="text-sm font-bold text-[#1C1410]">Etapas do currículo</h3>
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
              onClick={() => {
                setStepError(null);
                setStep((s) => s - 1);
              }}
              className="rounded-md border border-[#E6E8EB] px-3.5 py-2 text-xs font-bold text-[#1C1410]"
            >
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Próxima etapa
            </button>
          ) : (
            <button
              type="submit"
              disabled={!consentGiven}
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315] disabled:opacity-50"
            >
              Finalizar currículo assistido
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
