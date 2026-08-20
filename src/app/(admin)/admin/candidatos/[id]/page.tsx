import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canDeleteCurriculum, canValidateCurriculum, canViewAllCandidates } from "@/lib/auth/rbac";
import {
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";
import { EyeOff, Lock, MapPin } from "lucide-react";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!domain) return "***";
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string | null) {
  if (!phone) return "Não informado";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `(**) *****-${digits.slice(-4)}`;
}

export default async function AdminCandidatoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session || !canViewAllCandidates(session.role)) {
    redirect("/entrar");
  }

  const cand = await prisma.candidateProfile.findUnique({
    where: { id: params.id },
    include: {
      user: true,
      resumeVersions: {
        where: { isCurrent: true },
        take: 1,
        include: {
          experiences: { orderBy: { startDate: "desc" } },
          educations: true,
        },
      },
      documents: true,
      applications: {
        include: { job: { select: { title: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { applications: true } },
    },
  });

  if (!cand) notFound();

  const resume = cand.resumeVersions[0];
  let skills: string[] = [];
  try {
    skills = resume?.skillsSnapshot ? JSON.parse(resume.skillsSnapshot) : [];
  } catch {
    skills = [];
  }

  const mayValidate = canValidateCurriculum(session.role);
  const mayDelete = canDeleteCurriculum(session.role);
  const initials = cand.fullName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Perfil do candidato"
        description="Visualização institucional com dados protegidos"
        actions={
          <>
            <PrimaryButton href="/admin/atendimento-assistido">Encaminhar para vaga</PrimaryButton>
            <Link
              href="/admin/candidatos"
              className="rounded-md border border-[#E6E8EB] px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
            >
              Voltar à lista
            </Link>
          </>
        }
      />

      <SurfaceCard className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1C1410] text-lg font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black text-[#1C1410]">{cand.fullName}</h2>
                <StatusPill
                  label={
                    cand.validationStatus === "VALIDATED"
                      ? "Perfil validado"
                      : cand.validationStatus === "REJECTED"
                        ? "Rejeitado"
                        : "Validação pendente"
                  }
                  tone={
                    cand.validationStatus === "VALIDATED"
                      ? "success"
                      : cand.validationStatus === "REJECTED"
                        ? "danger"
                        : "warn"
                  }
                />
              </div>
              <p className="text-sm text-[#57433C]">
                {cand.professionalHeadline || "Perfil geral"}
              </p>
              <p className="mt-1 flex items-center gap-1 text-xs text-[#78716c]">
                <MapPin className="h-3.5 w-3.5" />
                {cand.city} - {cand.state}
                {cand.neighborhood ? ` · ${cand.neighborhood}` : ""}
              </p>
            </div>
          </div>
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
            {cand.availability === "IMEDIATA" || !cand.availability
              ? "Disponível · Disponibilidade imediata"
              : `Disponibilidade: ${cand.availability}`}
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard className="p-5">
          <h3 className="text-sm font-bold text-[#1C1410]">Resumo profissional</h3>
          <p className="mt-3 text-xs leading-relaxed text-[#57433C]">
            {resume?.summary || cand.summary || "Sem resumo cadastrado."}
          </p>
          <div className="mt-4 flex flex-wrap gap-1">
            {skills.map((s) => (
              <span key={s} className="rounded bg-[#F4F5F7] px-2 py-0.5 text-[11px] text-[#57433C]">
                {s}
              </span>
            ))}
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <dt className="text-[#78716c]">Escolaridade</dt>
              <dd className="font-bold text-[#1C1410]">{cand.educationLevel}</dd>
            </div>
            <div>
              <dt className="text-[#78716c]">CNH</dt>
              <dd className="font-bold text-[#1C1410]">
                {cand.driverLicense === "NENHUMA" ? "Não possui" : cand.driverLicense}
              </dd>
            </div>
            <div>
              <dt className="text-[#78716c]">Candidaturas</dt>
              <dd className="font-bold text-[#1C1410]">{cand._count.applications}</dd>
            </div>
            <div>
              <dt className="text-[#78716c]">Origem</dt>
              <dd className="font-bold text-[#1C1410]">
                {cand.isAssisted ? `Assistido (${cand.assistedUnit || "Sala"})` : "Portal"}
              </dd>
            </div>
          </dl>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-[#E65100]" />
            <h3 className="text-sm font-bold text-[#1C1410]">Privacidade e consentimentos</h3>
          </div>
          <ul className="mt-4 space-y-3 text-xs">
            <li className="flex items-center justify-between gap-2 rounded-md bg-[#F4F5F7] px-3 py-2">
              <span className="text-[#78716c]">E-mail</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#1C1410]">
                <EyeOff className="h-3 w-3" />
                {maskEmail(cand.user.email)}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-md bg-[#F4F5F7] px-3 py-2">
              <span className="text-[#78716c]">Telefone</span>
              <span className="inline-flex items-center gap-1 font-semibold text-[#1C1410]">
                <EyeOff className="h-3 w-3" />
                {maskPhone(cand.phone)}
              </span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-[#78716c]">Consentimento e-mail</span>
              <StatusPill label={cand.emailConsent ? "Concedido" : "Negado"} tone={cand.emailConsent ? "success" : "neutral"} />
            </li>
            <li className="flex items-center justify-between gap-2">
              <span className="text-[#78716c]">Consentimento WhatsApp</span>
              <StatusPill
                label={cand.whatsappConsent ? "Concedido" : "Negado"}
                tone={cand.whatsappConsent ? "success" : "neutral"}
              />
            </li>
          </ul>
          <p className="mt-3 text-[11px] text-[#78716c]">
            Acesso a dados sensíveis é restrito e registrado em auditoria.
          </p>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SurfaceCard className="p-5">
          <h3 className="text-sm font-bold text-[#1C1410]">Currículo estruturado — Experiência</h3>
          <ul className="mt-3 space-y-3">
            {(resume?.experiences || []).length === 0 ? (
              <li className="text-xs text-[#78716c]">Nenhuma experiência cadastrada.</li>
            ) : (
              resume!.experiences.map((exp) => (
                <li key={exp.id} className="rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2.5">
                  <p className="text-xs font-bold text-[#1C1410]">{exp.position}</p>
                  <p className="text-[11px] text-[#57433C]">{exp.company}</p>
                  <p className="text-[11px] text-[#78716c]">
                    {new Date(exp.startDate).toLocaleDateString("pt-BR")} –{" "}
                    {exp.isCurrent
                      ? "Atual"
                      : exp.endDate
                        ? new Date(exp.endDate).toLocaleDateString("pt-BR")
                        : "—"}
                  </p>
                </li>
              ))
            )}
          </ul>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <h3 className="text-sm font-bold text-[#1C1410]">Candidaturas</h3>
          <ul className="mt-3 divide-y divide-[#E6E8EB]">
            {cand.applications.length === 0 ? (
              <li className="py-4 text-xs text-[#78716c]">Nenhuma candidatura.</li>
            ) : (
              cand.applications.map((app) => (
                <li key={app.id} className="flex items-center justify-between gap-2 py-2.5 text-xs">
                  <div>
                    <p className="font-semibold text-[#1C1410]">{app.job.title}</p>
                    <p className="text-[11px] text-[#78716c]">
                      {new Date(app.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <StatusPill label={app.status} tone="neutral" />
                </li>
              ))
            )}
          </ul>
        </SurfaceCard>
      </div>

      {mayValidate && (
        <SurfaceCard className="p-5">
          <h3 className="mb-3 text-sm font-bold text-[#1C1410]">Validação institucional</h3>
          <form
            action={`/api/admin/candidates/${cand.id}/validate`}
            method="POST"
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input
              name="notes"
              defaultValue={cand.validationNotes || ""}
              placeholder="Observações"
              className="flex-1 rounded-md border border-[#E6E8EB] px-3 py-2 text-xs"
            />
            <button
              name="status"
              value="VALIDATED"
              className="rounded-md bg-emerald-600 px-4 py-2 text-xs font-bold text-white"
            >
              Validar
            </button>
            <button
              name="status"
              value="REJECTED"
              className="rounded-md border border-red-200 px-4 py-2 text-xs font-bold text-red-700"
            >
              Rejeitar
            </button>
          </form>
          {mayDelete && (
            <form action={`/api/admin/candidates/${cand.id}/delete`} method="POST" className="mt-3">
              <button type="submit" className="text-xs font-bold text-red-700 hover:underline">
                Excluir currículo e dados relacionados
              </button>
            </form>
          )}
        </SurfaceCard>
      )}
    </div>
  );
}
