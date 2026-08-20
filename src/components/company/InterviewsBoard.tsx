"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { FunnelCard, PageHeader, StatusPill, SurfaceCard } from "@/components/company/ui";

export type InterviewRow = {
  id: string;
  scheduledAt: string;
  location: string | null;
  status: string;
  candidateName: string;
  jobId: string;
  jobTitle: string;
  applicationId: string;
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

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

type Props = { interviews: InterviewRow[] };

export function InterviewsBoard({ interviews }: Props) {
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date()));
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);
  const weekEnd = addDays(anchor, 7);

  const byDay = useMemo(() => {
    const map = new Map<string, InterviewRow[]>();
    for (const day of weekDays) {
      map.set(day.toDateString(), []);
    }
    for (const item of interviews) {
      const d = new Date(item.scheduledAt);
      const key = d.toDateString();
      if (map.has(key)) map.get(key)!.push(item);
    }
    for (const list of map.values()) {
      list.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
    }
    return map;
  }, [interviews, weekDays]);

  const weekItems = interviews.filter((i) => {
    const t = +new Date(i.scheduledAt);
    return t >= +anchor && t < +weekEnd;
  });

  const upcoming = interviews
    .filter((i) => i.status === "SCHEDULED" && +new Date(i.scheduledAt) >= Date.now())
    .slice(0, 6);

  const pendingFeedback = interviews.filter(
    (i) => i.status === "SCHEDULED" && +new Date(i.scheduledAt) < Date.now()
  );

  const completed = interviews.filter((i) => i.status === "COMPLETED").length;
  const cancelled = interviews.filter((i) => i.status === "CANCELLED").length;

  const weekLabel = `${anchor.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} – ${addDays(anchor, 6).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Entrevistas"
        description="Agenda semanal, próximos horários e feedbacks pendentes."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <FunnelCard label="Nesta semana" count={weekItems.length} icon={<CalendarDays className="h-4 w-4" />} />
        <FunnelCard label="Próximas" count={upcoming.length} />
        <FunnelCard label="Feedback pendente" count={pendingFeedback.length} />
        <FunnelCard label="Concluídas / canceladas" count={`${completed}/${cancelled}`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <SurfaceCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#EEF2F0] px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-[#1C1410]">Calendário da semana</h3>
              <p className="text-[11px] text-[#78716c]">{weekLabel}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setAnchor(startOfWeek(addDays(anchor, -7)))}
                className="rounded-md border border-[#E6E8EB] p-1.5 text-[#1C1410] hover:bg-[#F4F5F7]"
                aria-label="Semana anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setAnchor(startOfWeek(new Date()))}
                className="rounded-md border border-[#E6E8EB] px-2.5 py-1.5 text-[11px] font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setAnchor(startOfWeek(addDays(anchor, 7)))}
                className="rounded-md border border-[#E6E8EB] p-1.5 text-[#1C1410] hover:bg-[#F4F5F7]"
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
                <div key={day.toISOString()} className={`min-h-[140px] p-2 ${isToday ? "bg-[#FFF4EA]/50" : ""}`}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[11px] font-semibold text-[#78716c]">{DAY_LABELS[idx]}</span>
                    <span
                      className={`text-xs font-black ${isToday ? "text-[#E65100]" : "text-[#1C1410]"}`}
                    >
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/empresa/candidatos?vaga=${item.jobId}&app=${item.applicationId}`}
                        className="block rounded-md border border-[#E6E8EB] bg-white px-1.5 py-1.5 hover:border-[#E65100]/40"
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
                        <p className="truncate text-[10px] text-[#78716c]">{item.jobTitle}</p>
                      </Link>
                    ))}
                    {items.length === 0 && (
                      <p className="px-0.5 text-[10px] text-[#A8A29E]">—</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="p-4">
            <h3 className="mb-3 text-sm font-bold text-[#1C1410]">Próximas</h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-[#78716c]">Nenhuma entrevista futura.</p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/empresa/candidatos?vaga=${item.jobId}&app=${item.applicationId}`}
                      className="block rounded-md border border-[#EEF2F0] px-3 py-2 hover:border-[#E65100]/35"
                    >
                      <p className="text-sm font-semibold text-[#1C1410]">{item.candidateName}</p>
                      <p className="text-[11px] text-[#78716c]">{item.jobTitle}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#57433C]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 text-[#E65100]" />
                          {new Date(item.scheduledAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {item.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-[#E65100]" />
                            {item.location}
                          </span>
                        )}
                      </p>
                    </Link>
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
                {pendingFeedback.slice(0, 5).map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 rounded-md border border-amber-100 bg-amber-50/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1C1410]">{item.candidateName}</p>
                      <p className="truncate text-[11px] text-[#78716c]">{item.jobTitle}</p>
                    </div>
                    <StatusPill label="Pendente" tone="warn" />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-[#78716c]">
              Após a entrevista, avance o candidato no funil em Candidatos (aprovado ou não selecionado).
            </p>
          </SurfaceCard>
        </div>
      </div>
    </div>
  );
}
