"use client";

import React, { useState } from "react";
import { Briefcase, FileText, GraduationCap, Plus, Trash2 } from "lucide-react";

export type ExpItem = {
  company: string;
  position: string;
  description: string;
  isCurrent: boolean;
};

export type EduItem = {
  institution: string;
  course: string;
  level: string;
};

export type CourseItem = {
  title: string;
  institution: string;
};

type Props = {
  headline: string;
  summary: string;
  skills: string;
  educationLevelDefault: string;
  experiences: ExpItem[];
  educations: EduItem[];
  courses: CourseItem[];
};

const inputClass =
  "w-full text-xs p-3 rounded-xl border border-[#FEEDDF] focus:outline-none focus:border-[#E65100]";
const labelClass = "block text-xs font-bold text-[#57433C] mb-1";

const emptyExp = (): ExpItem => ({
  company: "",
  position: "",
  description: "",
  isCurrent: false,
});
const emptyEdu = (level: string): EduItem => ({
  institution: "",
  course: "",
  level,
});
const emptyCourse = (): CourseItem => ({ title: "", institution: "" });

export function ResumeStructuredForm({
  headline,
  summary,
  skills,
  educationLevelDefault,
  experiences: initialExps,
  educations: initialEdus,
  courses: initialCourses,
}: Props) {
  const [experiences, setExperiences] = useState<ExpItem[]>(
    initialExps.length ? initialExps : [emptyExp()],
  );
  const [educations, setEducations] = useState<EduItem[]>(
    initialEdus.length ? initialEdus : [emptyEdu(educationLevelDefault)],
  );
  const [courses, setCourses] = useState<CourseItem[]>(
    initialCourses.length ? initialCourses : [emptyCourse()],
  );

  return (
    <form
      action="/api/candidate/resume"
      method="POST"
      className="space-y-8 rounded-3xl border border-[#FEEDDF] bg-white p-6 shadow-xs sm:p-10"
    >
      <p className="text-xs text-[#78716c]">
        Adicione quantas experiências, formações e cursos precisar. Confira e clique em{" "}
        <strong>Salvar Currículo Estruturado</strong>.
      </p>

      <div className="space-y-3">
        <h2 className="flex items-center gap-2 border-b border-[#FEEDDF] pb-2 text-base font-bold text-[#2E221F]">
          <FileText className="h-4 w-4 text-[#E65100]" />
          <span>Resumo Profissional & Habilidades</span>
        </h2>

        <div>
          <label className={labelClass}>Título / Objetivo Principal</label>
          <input
            type="text"
            name="headline"
            defaultValue={headline}
            placeholder="Ex: Assistente Administrativo | Vendas e Atendimento"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Sobre Você (Resumo da sua trajetória)</label>
          <textarea
            name="summary"
            rows={4}
            defaultValue={summary}
            placeholder="Descreva suas principais conquistas, pontos fortes e disposição para o trabalho..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Principais Habilidades (Separadas por vírgula)</label>
          <input
            type="text"
            name="skills"
            defaultValue={skills}
            placeholder="Ex: Atendimento ao Cliente, Excel, Vendas, Organização"
            className={inputClass}
          />
        </div>
      </div>

      {/* Experiências */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#FEEDDF] pb-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#2E221F]">
            <Briefcase className="h-4 w-4 text-[#E65100]" />
            <span>Experiências Profissionais</span>
          </h2>
          <button
            type="button"
            onClick={() => setExperiences((prev) => [...prev, emptyExp()])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FEEDDF] bg-[#FFF8F2] px-3 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FEEDDF]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar experiência
          </button>
        </div>

        {experiences.map((item, index) => (
          <div
            key={`exp-${index}`}
            className="space-y-3 rounded-2xl border border-[#FEEDDF] bg-[#FFFBF7] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">
                Experiência {index + 1}
              </span>
              {experiences.length > 1 && (
                <button
                  type="button"
                  onClick={() => setExperiences((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Empresa / Estabelecimento</label>
                <input
                  type="text"
                  name="expCompany"
                  value={item.company}
                  onChange={(e) =>
                    setExperiences((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, company: e.target.value } : row)),
                    )
                  }
                  placeholder="Ex: Comercial Silva / Autônomo"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Cargo / Função</label>
                <input
                  type="text"
                  name="expPosition"
                  value={item.position}
                  onChange={(e) =>
                    setExperiences((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, position: e.target.value } : row)),
                    )
                  }
                  placeholder="Ex: Auxiliar de Vendas / Operador de Caixa"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Principais Atividades Realizadas</label>
              <textarea
                name="expDescription"
                rows={3}
                value={item.description}
                onChange={(e) =>
                  setExperiences((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, description: e.target.value } : row,
                    ),
                  )
                }
                placeholder="Descreva o que você fazia no dia a dia nesta função..."
                className={inputClass}
              />
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-[#57433C]">
              <input
                type="checkbox"
                name="expIsCurrent"
                value={String(index)}
                checked={item.isCurrent}
                onChange={(e) =>
                  setExperiences((prev) =>
                    prev.map((row, i) =>
                      i === index ? { ...row, isCurrent: e.target.checked } : row,
                    ),
                  )
                }
                className="rounded border-[#FEEDDF]"
              />
              Trabalho atual
            </label>
          </div>
        ))}
      </div>

      {/* Formações */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#FEEDDF] pb-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#2E221F]">
            <GraduationCap className="h-4 w-4 text-[#E65100]" />
            <span>Formações</span>
          </h2>
          <button
            type="button"
            onClick={() => setEducations((prev) => [...prev, emptyEdu(educationLevelDefault)])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FEEDDF] bg-[#FFF8F2] px-3 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FEEDDF]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar formação
          </button>
        </div>

        {educations.map((item, index) => (
          <div
            key={`edu-${index}`}
            className="space-y-3 rounded-2xl border border-[#FEEDDF] bg-[#FFFBF7] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">
                Formação {index + 1}
              </span>
              {educations.length > 1 && (
                <button
                  type="button"
                  onClick={() => setEducations((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Instituição de Ensino</label>
                <input
                  type="text"
                  name="eduInstitution"
                  value={item.institution}
                  onChange={(e) =>
                    setEducations((prev) =>
                      prev.map((row, i) =>
                        i === index ? { ...row, institution: e.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Ex: Escola Rotary / AESA"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Curso / Nível</label>
                <input
                  type="text"
                  name="eduCourse"
                  value={item.course}
                  onChange={(e) =>
                    setEducations((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, course: e.target.value } : row)),
                    )
                  }
                  placeholder="Ex: Ensino Médio / Administração"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nível de Escolaridade</label>
                <select
                  name="eduLevel"
                  value={item.level}
                  onChange={(e) =>
                    setEducations((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, level: e.target.value } : row)),
                    )
                  }
                  className={`${inputClass} bg-white`}
                >
                  <option value="FUNDAMENTAL">Ensino Fundamental</option>
                  <option value="MEDIO">Ensino Médio</option>
                  <option value="TECNICO">Ensino Técnico</option>
                  <option value="SUPERIOR">Ensino Superior</option>
                  <option value="POS">Pós-Graduação</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cursos */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#FEEDDF] pb-2">
          <h2 className="text-base font-bold text-[#2E221F]">Cursos e certificações</h2>
          <button
            type="button"
            onClick={() => setCourses((prev) => [...prev, emptyCourse()])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#FEEDDF] bg-[#FFF8F2] px-3 py-1.5 text-[11px] font-bold text-[#E65100] hover:bg-[#FEEDDF]"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar curso
          </button>
        </div>

        {courses.map((item, index) => (
          <div
            key={`course-${index}`}
            className="space-y-3 rounded-2xl border border-[#FEEDDF] bg-[#FFFBF7] p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wide text-[#78716c]">
                Curso {index + 1}
              </span>
              {courses.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCourses((prev) => prev.filter((_, i) => i !== index))}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Curso Complementar</label>
                <input
                  type="text"
                  name="courseTitle"
                  value={item.title}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((row, i) => (i === index ? { ...row, title: e.target.value } : row)),
                    )
                  }
                  placeholder="Ex: Atendimento ao Cliente / Informática Básica"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Instituição do Curso</label>
                <input
                  type="text"
                  name="courseInstitution"
                  value={item.institution}
                  onChange={(e) =>
                    setCourses((prev) =>
                      prev.map((row, i) =>
                        i === index ? { ...row, institution: e.target.value } : row,
                      ),
                    )
                  }
                  placeholder="Ex: Sebrae PE / Senac Arcoverde"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-[#E65100] px-8 py-3.5 text-xs font-bold text-white shadow-md transition hover:bg-[#D84315] sm:w-auto"
      >
        Salvar Currículo Estruturado
      </button>
    </form>
  );
}
