import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { isAdmin } from "@/lib/auth/rbac";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
      return formRedirect(new URL("/entrar", req.url));
    }

    const membership = await prisma.companyMember.findFirst({
      where: { userId: session.userId },
    });

    if (!membership) {
      return formRedirect(new URL("/empresa", req.url));
    }

    const formData = await req.formData();
    const tradeName = (formData.get("tradeName") as string)?.trim() || null;
    const name = (formData.get("name") as string)?.trim() || "";
    const cnpj = (formData.get("cnpj") as string)?.trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const email = (formData.get("email") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const state = (formData.get("state") as string)?.trim() || "PE";
    const address = (formData.get("address") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const isConfidentialDefault = formData.get("isConfidentialDefault") === "on";

    const updated = await prisma.company.update({
      where: { id: membership.companyId },
      data: {
        name,
        tradeName,
        cnpj,
        phone,
        email,
        city,
        state,
        address,
        description,
        isConfidentialDefault,
      },
    });

    await logAudit({
      userId: session.userId,
      action: "COMPANY_PROFILE_UPDATED",
      resourceType: "Company",
      resourceId: updated.id,
      details: { companyName: name, tradeName },
    });

    return formRedirect(new URL("/empresa/perfil?sucesso=salvo", req.url));
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);
    return formRedirect(new URL("/empresa/perfil?erro=falha", req.url));
  }
}
