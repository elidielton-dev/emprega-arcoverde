import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { Bell, ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export default async function CandidatoNotificacoesPage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/painel"
          className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100] mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao painel do candidato</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F] tracking-tight">
          Notificações & Avisos
        </h1>
        <p className="text-xs text-[#78716c]">
          Confira o histórico de comunicados sobre processos seletivos e novas vagas em Arcoverde.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#FEEDDF] shadow-xs space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Bell className="w-8 h-8 text-[#A8A29E] mx-auto" />
            <h3 className="text-sm font-bold text-[#2E221F]">Nenhuma notificação no momento</h3>
            <p className="text-xs text-[#78716c]">
              Você receberá avisos aqui sempre que o status de uma de suas candidaturas for atualizado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-[#2E221F]">{n.title}</h4>
                  <span className="text-[10px] text-[#78716c]">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-xs text-[#57433C]">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
