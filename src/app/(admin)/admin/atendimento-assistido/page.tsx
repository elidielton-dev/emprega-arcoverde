import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canPerformAssistedService } from "@/lib/auth/rbac";
import { AssistedServiceForm } from "@/components/admin/AssistedServiceForm";

export default async function AtendimentoAssistidoPage({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string; nome?: string };
}) {
  const session = await getSession();
  if (!session || !canPerformAssistedService(session.role)) {
    redirect("/entrar");
  }

  return (
    <AssistedServiceForm
      operatorName={session.name || session.email}
      operatorEmail={session.email}
      success={Boolean(searchParams.sucesso)}
      error={searchParams.erro}
      successName={searchParams.nome}
    />
  );
}
