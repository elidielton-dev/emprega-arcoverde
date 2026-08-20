import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isMunicipalOrSuperAdmin } from "@/lib/auth/rbac";
import { PageHeader, SurfaceCard } from "@/components/admin/ui";
import { Mail, Shield, Smartphone } from "lucide-react";

export default async function AdminConfiguracoesPage() {
  const session = await getSession();
  if (!session || !isMunicipalOrSuperAdmin(session.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações institucionais"
        description="Parâmetros do portal, canais de comunicação e integrações."
      />

      <SurfaceCard className="space-y-6 p-5">
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1C1410]">
            <Mail className="h-4 w-4 text-[#E65100]" />
            E-mails transacionais
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#57433C]">Remetente oficial</label>
              <input
                type="text"
                disabled
                defaultValue="nao-responda@emprega.arcoverde.pe.gov.br"
                className="w-full rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs text-[#78716c]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-[#57433C]">Status do provedor</label>
              <input
                type="text"
                disabled
                defaultValue="Driver ativo (mock em desenvolvimento)"
                className="w-full rounded-md border border-[#E6E8EB] bg-[#F4F5F7] px-3 py-2 text-xs text-[#78716c]"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1C1410]">
            <Smartphone className="h-4 w-4 text-[#E65100]" />
            Integração oficial de WhatsApp
          </h2>
          <div className="rounded-md border border-[#E6E8EB] bg-[#FFF4EA] p-4 text-xs text-[#57433C]">
            <div className="mb-1 flex items-center gap-2 font-bold text-[#BF360C]">
              <Shield className="h-4 w-4" />
              Status: desativado por padrão (seguro)
            </div>
            <p>
              O envio via WhatsApp só opera com credenciais oficiais e opt-in explícito do candidato.
            </p>
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
