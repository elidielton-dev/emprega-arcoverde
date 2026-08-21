import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { canManageSiteSettings } from "@/lib/auth/rbac";
import { getContactSettings } from "@/lib/site/settings";
import { PageHeader, PrimaryButton, SurfaceCard } from "@/components/admin/ui";

export default async function AdminConfiguracoesPage({
  searchParams,
}: {
  searchParams: { sucesso?: string };
}) {
  const session = await getSession();
  if (!session || !canManageSiteSettings(session.role)) redirect("/admin");

  const s = await getContactSettings();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações do portal"
        description="Contatos e endereços exibidos em Contato e no rodapé institucional."
      />

      {searchParams.sucesso && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Configurações atualizadas.
        </div>
      )}

      <SurfaceCard className="p-5 sm:p-6">
        <form action="/api/admin/settings" method="POST" className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
            E-mail de contato (recebe formulário)
            <input
              name="contact_email"
              type="email"
              defaultValue={s.contact_email}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            Telefone Sala
            <input
              name="contact_phone_sala"
              defaultValue={s.contact_phone_sala}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            Telefone ACA
            <input
              name="contact_phone_aca"
              defaultValue={s.contact_phone_aca}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
            Endereço Sala
            <input
              name="address_sala"
              defaultValue={s.address_sala}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C] sm:col-span-2">
            Endereço ACA
            <input
              name="address_aca"
              defaultValue={s.address_aca}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            Horário Sala
            <input
              name="hours_sala"
              defaultValue={s.hours_sala}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            E-mail ACA
            <input
              name="email_aca"
              type="email"
              defaultValue={s.email_aca}
              className="mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="sm:col-span-2">
            <PrimaryButton type="submit">Salvar configurações</PrimaryButton>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
