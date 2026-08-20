"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Video,
  MapPin,
  Plus,
  RotateCcw,
  MessageSquare,
  ExternalLink,
  User,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { FunnelCard, PageHeader, StatusPill, SurfaceCard } from "@/components/company/ui";

export type InterviewRow = {
  id: string;
  scheduledAt: string;
  location: string | null;
  instructions: string | null;
  modality: string;
  interviewer: string | null;
  feedback: string | null;
  rating: number | null;
  status: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
};

export type ScheduleOption = {
  applicationId: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const MODALITY_META: Record<string, { label: string; tone: "neutral" | "info" | "orange" }> = {
  PRESENCIAL: { label: "Presencial", tone: "neutral" },
  ONLINE: { label: "Online", tone: "info" },
  HIBRIDO: { label: "Híbrido", tone: "orange" },
};

const STATUS_META: Record<string, { label: string; tone: "neutral" | "success" | "warn" | "danger" | "info" }> = {
  SCHEDULED: { label: "Agendada", tone: "info" },
  COMPLETED: { label: "Concluída", tone: "success" },
  CANCELLED: { label: "Cancelada", tone: "danger" },
  NO_SHOW: { label: "Não compareceu", tone: "warn" },
};

type Props = {
  interviews: InterviewRow[];
  jobs: Array<{ id: string; title: string }>;
  scheduleOptions: ScheduleOption[];
  defaultInterviewer?: string;
  success?: string;
};

export function InterviewsBoard({
  interviews,
  jobs,
  scheduleOptions,
  defaultInterviewer = "",
  success,
}: Props) {
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const [jobFilter, setJobFilter] = useState("");
  const [modalityFilter, setModalityFilter] = useState("");
  const [interviewerFilter, setInterviewerFilter] = useState("");
  const [period, setPeriod] = useState<"semana" | "proximas" | "todas">("semana");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const weekEnd = addDays(anchor, 7);

  const interviewers = useMemo(() => {
    return Array.from(
      new Set(interviews.map((i) => i.interviewer).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [interviews]);

  const filtered = useMemo(() => {
    return interviews.filter((i) => {
      if (jobFilter && i.jobId !== jobFilter) return false;
      if (modalityFilter && i.modality !== modalityFilter) return false;
      if (interviewerFilter && (i.interviewer || "") !== interviewerFilter) return false;
      const t = +new Date(i.scheduledAt);
      if (period === "semana") return t >= +anchor && t < +weekEnd;
      if (period === "proximas") return i.status === "SCHEDULED" && t >= Date.now();
      return true;
    });
  }, [interviews, jobFilter, modalityFilter, interviewerFilter, period, anchor, weekEnd]);

  const byDay = useMemo(() => {
    const map = new Map<string, InterviewRow[]>();
    for (const day of weekDays) map.set(day.toDateString(), []);
    for (const item of interviews) {
      if (jobFilter && item.jobId !== jobFilter) continue;
      if (modalityFilter && item.modality !== modalityFilter) continue;
      if (interviewerFilter && (item.interviewer || "") !== interviewerFilter) continue;
      const key = new Date(item.scheduledAt).toDateString();
      if (map.has(key)) map.get(key)!.push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    }
    return map;
  }, [interviews, weekDays, jobFilter, modalityFilter, interviewerFilter]);

  const weekItems = interviews.filter((i) => {
    const t = +new Date(i.scheduledAt);
    return t >= +anchor && t < +weekEnd;
  });

  const upcoming = interviews
    .filter((i) => i.status === "SCHEDULED" && +new Date(i.scheduledAt) >= Date.now())
    .slice(0, 8);

  const pendingFeedback = interviews.filter(
    (i) =>
      (i.status === "SCHEDULED" && +new Date(i.scheduledAt) < Date.now()) ||
      (i.status === "COMPLETED" && !i.feedback)
  );

  const completed = interviews.filter((i) => i.status === "COMPLETED").length;
  const cancelled = interviews.filter((i) => i.status === "CANCELLED" || i.status === "NO_SHOW").length;

  const weekLabel = `${anchor.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${addDays(anchor, 6).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  const rescheduleItem = interviews.find((i) => i.id === rescheduleId) || null;
  const feedbackItem = interviews.find((i) => i.id === feedbackId) || null;

  const successMsg: Record<string, string> = {
    agendada: "Entrevista agendada com sucesso.",
    reagendada: "Entrevista reagendada.",
    feedback: "Feedback registrado.",
    status: "Status da entrevista atualizado.",
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Entrevistas"
        description="Agenda semanal, filtros, reagendamento e registro de avaliação."
        actions={
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
          >
            <Plus className="h-3.5 w-3.5" />
            Agendar entrevista
          </button>
        }
      />

      {success && successMsg[success] && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          {successMsg[success]}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard
          label="Nesta semana"
          count={weekItems.length}
          icon={<CalendarDays className="h-4 w-4" />}
          active={period === "semana"}
          onClick={() => setPeriod("semana")}
        />
        <FunnelCard
          label="Próximas"
          count={upcoming.length}
          active={period === "proximas"}
          onClick={() => setPeriod("proximas")}
        />
        <FunnelCard label="Feedback pendente" count={pendingFeedback.length} />
        <FunnelCard label="Concluídas / encerradas" count={`${completed}/${cancelled}`} />
      </div>

      <SurfaceCard className="p-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="semana">Período: esta semana</option>
            <option value="proximas">Período: próximas</option>
            <option value="todas">Período: todas</option>
          </select>
          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="">Todas as vagas</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="">Todas as modalidades</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="ONLINE">Online</option>
            <option value="HIBRIDO">Híbrido</option>
          </select>
          <select
            value={interviewerFilter}
            onChange={(e) => setInterviewerFilter(e.target.value)}
            className="rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs"
          >
            <option value="">Todos os entrevistadores</option>
            {interviewers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </SurfaceCard>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <SurfaceCard className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#EEF2F0] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1C1410]">Calendário da semana</h3>
                <p className="mt-0.5 text-sm font-semibold capitalize text-[#E65100]">
                  {new Date().toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p className="text-[11px] text-[#78716c]">Semana {weekLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAnchor(startOfWeek(addDays(anchor, -7)))}
                  className="rounded-md border border-[#E6E8EB] bg-white p-2 text-[#1C1410] hover:bg-[#F4F5F7]"
                  aria-label="Semana anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setAnchor(startOfWeek(new Date()))}
                  className="rounded-md border border-[#E6E8EB] bg-white px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setAnchor(startOfWeek(addDays(anchor, 7)))}
                  className="rounded-md border border-[#E6E8EB] bg-white p-2 text-[#1C1410] hover:bg-[#F4F5F7]"
                  aria-label="Próxima semana"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 divide-y divide-[#EEF2F0] sm:grid-cols-7 sm:divide-x sm:divide-y-0">
              {weekDays.map((day, idx) => {
                const items = byDay.get(day.toDateString()) || [];
                const isToday = sameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[140px] p-2 ${isToday ? "bg-[#FFF4EA]/50" : ""}`}
                  >
                    <div className="mb-2 flex items-baseline justify-between gap-1">
                      <span className="text-[11px] font-semibold text-[#78716c]">{DAY_LABELS[idx]}</span>
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-xs font-black ${
                          isToday ? "bg-[#E65100] text-white" : "text-[#1C1410]"
                        }`}
                        title={day.toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    {isToday && (
                      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#E65100]">
                        Hoje
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const mod = MODALITY_META[item.modality] || MODALITY_META.PRESENCIAL;
                        return (
                          <div
                            key={item.id}
                            className="rounded-md border border-[#E6E8EB] bg-white px-1.5 py-1.5"
                          >
                            <p className="text-[10px] font-bold text-[#E65100]">
                              {new Date(item.scheduledAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="truncate text-[11px] font-semibold text-[#1C1410]">
                              {item.candidateName}
                            </p>
                            <p className="truncate text-[10px] text-[#78716c]">{mod.label}</p>
                          </div>
                        );
                      })}
                      {items.length === 0 && (
                        <p className="px-0.5 text-[10px] text-[#A8A29E]">—</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col overflow-hidden">
            <div className="shrink-0 border-b border-[#EEF2F0] px-4 py-3">
              <h3 className="text-sm font-bold text-[#1C1410]">Lista de entrevistas</h3>
              <p className="text-[11px] text-[#78716c]">
                {filtered.length} resultado{filtered.length === 1 ? "" : "s"} com os filtros atuais
              </p>
            </div>
            <div className="max-h-[240px] overflow-y-auto overscroll-contain">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[#78716c]">
                  Nenhuma entrevista neste filtro.
                </p>
              ) : (
                <ul className="divide-y divide-[#EEF2F0]">
                  {filtered.map((item) => {
                    const mod = MODALITY_META[item.modality] || MODALITY_META.PRESENCIAL;
                    const st = STATUS_META[item.status] || STATUS_META.SCHEDULED;
                    return (
                      <li key={item.id} className="px-4 py-3">
                        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-[#1C1410]">{item.candidateName}</p>
                              <StatusPill label={st.label} tone={st.tone} />
                              <StatusPill label={mod.label} tone={mod.tone} />
                            </div>
                            <p className="mt-0.5 text-xs text-[#78716c]">{item.jobTitle}</p>
                            <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-[#57433C]">
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-[#E65100]" />
                                {new Date(item.scheduledAt).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {item.interviewer && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="h-3.5 w-3.5 text-[#E65100]" />
                                  {item.interviewer}
                                </span>
                              )}
                              {item.location && (
                                <span className="inline-flex max-w-[220px] items-center gap-1 truncate">
                                  {item.modality === "ONLINE" ? (
                                    <Video className="h-3.5 w-3.5 shrink-0 text-[#E65100]" />
                                  ) : (
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E65100]" />
                                  )}
                                  {item.location}
                                </span>
                              )}
                            </div>
                            {item.feedback && (
                              <p className="mt-2 rounded-md bg-[#F4F5F7] px-2.5 py-1.5 text-[11px] text-[#57433C]">
                                Feedback{item.rating ? ` (${item.rating}/5)` : ""}: {item.feedback}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 lg:justify-end">
                            <Link
                              href={`/empresa/candidatos?vaga=${item.jobId}&app=${item.applicationId}`}
                              className="inline-flex items-center gap-1 rounded-md border border-[#E6E8EB] px-2.5 py-1.5 text-[11px] font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Candidato
                            </Link>
                            {item.status === "SCHEDULED" && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRescheduleId(item.id)}
                                  className="inline-flex items-center gap-1 rounded-md border border-[#E6E8EB] px-2.5 py-1.5 text-[11px] font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reagendar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFeedbackId(item.id)}
                                  className="inline-flex items-center gap-1 rounded-md bg-[#E65100] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#D84315]"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  Avaliar
                                </button>
                                <form action={`/api/company/interviews/${item.id}`} method="POST">
                                  <input type="hidden" name="action" value="status" />
                                  <input type="hidden" name="status" value="NO_SHOW" />
                                  <button className="rounded-md border border-amber-200 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 hover:bg-amber-50">
                                    Não compareceu
                                  </button>
                                </form>
                                <form action={`/api/company/interviews/${item.id}`} method="POST">
                                  <input type="hidden" name="action" value="status" />
                                  <input type="hidden" name="status" value="CANCELLED" />
                                  <button className="rounded-md border border-red-200 px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-50">
                                    Cancelar
                                  </button>
                                </form>
                              </>
                            )}
                            {item.status !== "SCHEDULED" && !item.feedback && (
                              <button
                                type="button"
                                onClick={() => setFeedbackId(item.id)}
                                className="inline-flex items-center gap-1 rounded-md border border-[#E6E8EB] px-2.5 py-1.5 text-[11px] font-bold text-[#1C1410]"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Registrar feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </SurfaceCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[4.5rem]">
          <SurfaceCard className="p-4">
            <h3 className="mb-3 text-sm font-bold text-[#1C1410]">Próximas</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#78716c]">Nenhuma entrevista futura.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.slice(0, 4).map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setRescheduleId(item.id)}
                      className="w-full rounded-md border border-[#EEF2F0] px-3 py-2 text-left hover:border-[#E65100]/35"
                    >
                      <p className="text-sm font-semibold text-[#1C1410]">{item.candidateName}</p>
                      <p className="text-[11px] text-[#78716c]">{item.jobTitle}</p>
                      <p className="mt-1 text-[11px] font-bold text-[#E65100]">
                        {new Date(item.scheduledAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-4">
            <h3 className="mb-3 text-sm font-bold text-[#1C1410]">Feedbacks pendentes</h3>
            {pendingFeedback.length === 0 ? (
              <p className="text-sm text-[#78716c]">Nenhum feedback pendente.</p>
            ) : (
              <ul className="space-y-2">
                {pendingFeedback.slice(0, 6).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-amber-100 bg-amber-50/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1C1410]">{item.candidateName}</p>
                      <p className="truncate text-[11px] text-[#78716c]">{item.jobTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFeedbackId(item.id)}
                      className="shrink-0 text-[11px] font-bold text-[#E65100] hover:underline"
                    >
                      Avaliar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-4">
            <h3 className="mb-2 text-sm font-bold text-[#1C1410]">Resumo da semana</h3>
            <ul className="space-y-1.5 text-xs text-[#57433C]">
              <li className="flex justify-between">
                <span>Agendadas</span>
                <strong className="text-[#1C1410]">
                  {weekItems.filter((i) => i.status === "SCHEDULED").length}
                </strong>
              </li>
              <li className="flex justify-between">
                <span>Online</span>
                <strong className="text-[#1C1410]">
                  {weekItems.filter((i) => i.modality === "ONLINE").length}
                </strong>
              </li>
              <li className="flex justify-between">
                <span>Presencial / híbrido</span>
                <strong className="text-[#1C1410]">
                  {weekItems.filter((i) => i.modality !== "ONLINE").length}
                </strong>
              </li>
            </ul>
          </SurfaceCard>
        </aside>
      </div>

      {/* Modal agendar */}
      {scheduleOpen && (
        <Modal title="Agendar entrevista" onClose={() => setScheduleOpen(false)}>
          {scheduleOptions.length === 0 ? (
            <p className="text-sm text-[#78716c]">
              Não há candidaturas elegíveis. Avance alguém para contato/triagem em{" "}
              <Link href="/empresa/candidatos" className="font-bold text-[#E65100]">
                Candidatos
              </Link>
              .
            </p>
          ) : (
            <form action="/api/company/interviews" method="POST" className="space-y-3">
              <label className="block text-xs font-bold text-[#57433C]">
                Candidato / vaga *
                <select
                  name="applicationId"
                  required
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione
                  </option>
                  {scheduleOptions.map((o) => (
                    <option key={o.applicationId} value={o.applicationId}>
                      {o.candidateName} — {o.jobTitle}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-[#57433C]">
                  Data e hora *
                  <input
                    type="datetime-local"
                    name="scheduledAt"
                    required
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs font-bold text-[#57433C]">
                  Modalidade
                  <select
                    name="modality"
                    defaultValue="PRESENCIAL"
                    className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                  >
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="ONLINE">Online</option>
                    <option value="HIBRIDO">Híbrido</option>
                  </select>
                </label>
              </div>
              <label className="block text-xs font-bold text-[#57433C]">
                Entrevistador
                <input
                  name="interviewer"
                  defaultValue={defaultInterviewer}
                  placeholder="Nome do recrutador"
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-[#57433C]">
                Local ou link
                <input
                  name="location"
                  placeholder="Endereço ou URL da videochamada"
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-xs font-bold text-[#57433C]">
                Orientações
                <input
                  name="instructions"
                  placeholder="Documentos, ponto de encontro…"
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
              >
                Confirmar agendamento
              </button>
            </form>
          )}
        </Modal>
      )}

      {/* Modal reagendar */}
      {rescheduleItem && (
        <Modal title="Reagendar entrevista" onClose={() => setRescheduleId(null)}>
          <p className="mb-3 text-sm text-[#57433C]">
            <strong>{rescheduleItem.candidateName}</strong> · {rescheduleItem.jobTitle}
          </p>
          <form
            action={`/api/company/interviews/${rescheduleItem.id}`}
            method="POST"
            className="space-y-3"
          >
            <input type="hidden" name="action" value="reschedule" />
            <label className="block text-xs font-bold text-[#57433C]">
              Nova data e hora *
              <input
                type="datetime-local"
                name="scheduledAt"
                required
                defaultValue={toLocalInputValue(rescheduleItem.scheduledAt)}
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-bold text-[#57433C]">
                Modalidade
                <select
                  name="modality"
                  defaultValue={rescheduleItem.modality}
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="ONLINE">Online</option>
                  <option value="HIBRIDO">Híbrido</option>
                </select>
              </label>
              <label className="block text-xs font-bold text-[#57433C]">
                Entrevistador
                <input
                  name="interviewer"
                  defaultValue={rescheduleItem.interviewer || defaultInterviewer}
                  className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-[#57433C]">
              Local ou link
              <input
                name="location"
                defaultValue={rescheduleItem.location || ""}
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Orientações
              <input
                name="instructions"
                defaultValue={rescheduleItem.instructions || ""}
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Salvar reagendamento
            </button>
          </form>
        </Modal>
      )}

      {/* Modal feedback */}
      {feedbackItem && (
        <Modal title="Registrar avaliação" onClose={() => setFeedbackId(null)}>
          <p className="mb-3 text-sm text-[#57433C]">
            <strong>{feedbackItem.candidateName}</strong> · {feedbackItem.jobTitle}
          </p>
          <form
            action={`/api/company/interviews/${feedbackItem.id}`}
            method="POST"
            className="space-y-3"
          >
            <input type="hidden" name="action" value="feedback" />
            <label className="block text-xs font-bold text-[#57433C]">
              Nota (1–5)
              <select
                name="rating"
                defaultValue={feedbackItem.rating || ""}
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              >
                <option value="">Sem nota</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Feedback *
              <textarea
                name="feedback"
                required
                rows={4}
                defaultValue={feedbackItem.feedback || ""}
                placeholder="Pontos fortes, gaps, recomendação…"
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Avançar no funil (opcional)
              <select
                name="applicationStatus"
                defaultValue=""
                className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              >
                <option value="">Manter etapa atual</option>
                <option value="APPROVED">Aprovar / oferta</option>
                <option value="NOT_SELECTED">Não selecionado</option>
              </select>
            </label>
            <button
              type="submit"
              className="w-full rounded-md bg-[#E65100] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Salvar avaliação
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Fechar" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-md border border-[#E6E8EB] bg-white p-5 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-base font-bold text-[#1C1410]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[#78716c] hover:bg-[#F4F5F7]"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
