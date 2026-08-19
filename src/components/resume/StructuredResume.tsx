import React from "react";
import { educationLabels } from "@/lib/resume/files";

type Experience = {
  company: string;
  position: string;
  startDate: Date;
  endDate: Date | null;
  isCurrent: boolean;
  description: string | null;
};

type Education = {
  institution: string;
  course: string;
  level: string;
  status: string;
};

type Course = {
  institution: string;
  title: string;
  hours: number | null;
};

function formatDate(value: Date | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" }).format(value);
}

export function StructuredResume({
  name,
  headline,
  city,
  state,
  neighborhood,
  phone,
  email,
  educationLevel,
  summary,
  experiences,
  educations,
  courses,
  skills,
}: {
  name: string;
  headline?: string | null;
  city: string;
  state: string;
  neighborhood?: string | null;
  phone?: string | null;
  email: string;
  educationLevel: string;
  summary?: string | null;
  experiences: Experience[];
  educations: Education[];
  courses: Course[];
  skills: string[];
}) {
  return (
    <div className="bg-white text-[#1A1A1A]">
      <header className="border-b border-[#E6E8EB] pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">{name}</h1>
        {headline ? <p className="mt-1 text-[#4B5563]">{headline}</p> : null}
        <p className="mt-3 text-sm text-[#4B5563]">
          {city} - {state}
          {neighborhood ? ` · ${neighborhood}` : ""}
          {phone ? ` · ${phone}` : ""}
          {` · ${email}`}
        </p>
        <p className="mt-1 text-sm text-[#4B5563]">
          Escolaridade: {educationLabels[educationLevel] || educationLevel}
        </p>
      </header>

      {summary ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A]">Resumo</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{summary}</p>
        </section>
      ) : null}

      {experiences.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A]">Experiência</h2>
          <ul className="mt-3 space-y-4">
            {experiences.map((exp, i) => (
              <li key={i}>
                <p className="font-bold">
                  {exp.position} · {exp.company}
                </p>
                <p className="text-sm text-[#4B5563]">
                  {formatDate(exp.startDate)} — {exp.isCurrent ? "atual" : formatDate(exp.endDate)}
                </p>
                {exp.description ? <p className="mt-1 text-[15px] leading-relaxed">{exp.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {educations.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A]">Formação</h2>
          <ul className="mt-3 space-y-3">
            {educations.map((edu, i) => (
              <li key={i}>
                <p className="font-bold">{edu.course}</p>
                <p className="text-sm text-[#4B5563]">
                  {edu.institution} · {educationLabels[edu.level] || edu.level}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {courses.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A]">Cursos</h2>
          <ul className="mt-3 space-y-2">
            {courses.map((course, i) => (
              <li key={i} className="text-[15px]">
                {course.title} — {course.institution}
                {course.hours ? ` (${course.hours}h)` : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {skills.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-extrabold text-[#1A1A1A]">Habilidades</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{skills.join(" · ")}</p>
        </section>
      ) : null}
    </div>
  );
}
