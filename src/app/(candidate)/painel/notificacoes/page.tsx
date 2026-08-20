import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";

export default async function CandidatoNotificacoesPage() {
  const session = await getSession();
  if (!session || session.role !== "CANDIDATE") {
    redirect("/entrar");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <NotificationsInbox
        userId={session.userId}
        backHref="/painel"
        backLabel="Voltar ao painel do candidato"
        title="Notificações & avisos"
        description="Processos seletivos, validação de currículo e comunicados."
      />
    </div>
  );
}
