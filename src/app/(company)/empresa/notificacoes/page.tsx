import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";

export default async function EmpresaNotificacoesPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");

  return (
    <NotificationsInbox
      userId={session.userId}
      backHref="/empresa"
      backLabel="Voltar à visão geral"
      title="Notificações"
      description="Novas candidaturas, status de vagas e avisos da plataforma."
    />
  );
}
