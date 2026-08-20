import { NextRequest } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "CANDIDATE") {
      return formRedirect(new URL("/entrar", req.url));
    }

    const formData = await req.formData();
    const action = formData.get("action");

    if (action === "REQUEST_DELETION") {
      await prisma.deletionRequest.create({
        data: {
          userId: session.userId,
          reason: "Solicitação expressa do titular via painel de privacidade",
        },
      });

      await logAudit({
        userId: session.userId,
        action: "DATA_DELETION_REQUESTED",
        resourceType: "User",
        resourceId: session.userId,
      });

      const { notifyMunicipalAdmins } = await import("@/lib/notifications/notify");
      await notifyMunicipalAdmins({
        title: "Solicitação LGPD",
        message: "Um titular solicitou exclusão de dados pessoais.",
        type: "SYSTEM",
        link: "/admin/auditoria",
      });
    }

    return formRedirect(new URL("/painel/privacidade?sucesso=solicitacao_registrada", req.url));
  } catch (error) {
    console.error("Erro na privacidade:", error);
    return formRedirect(new URL("/painel/privacidade?erro=falha", req.url));
  }
}
