import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { NotificationsInbox } from "@/components/notifications/NotificationsInbox";

export default async function AdminNotificacoesPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");

  return (
    <NotificationsInbox
      userId={session.userId}
      backHref="/admin"
      backLabel="Voltar à visão geral"
      title="Notificações"
      description="Moderação, validações, LGPD e pedidos das empresas."
    />
  );
}
