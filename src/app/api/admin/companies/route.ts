import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { institutionFromRole, isValidCnpj, normalizeCnpj } from "@/lib/company/cnpj";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !canRegisterCompany(session.role)) {
      return formRedirect(new URL("/entrar", req.url));
    }

    const formData = await req.formData();
    const name = (formData.get("name") as string)?.trim();
    const tradeName = (formData.get("tradeName") as string)?.trim() || null;
    const cnpjRaw = (formData.get("cnpj") as string)?.trim() || "";
    const email = (formData.get("email") as string)?.toLowerCase().trim() || null;
    const phone = (formData.get("phone") as string)?.trim() || null;
    const address = (formData.get("address") as string)?.trim() || null;
    const city = (formData.get("city") as string)?.trim() || "Arcoverde";
    const state = (formData.get("state") as string)?.trim() || "PE";
    const sector = (formData.get("sector") as string)?.trim() || null;
    const contactName = (formData.get("contactName") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    const description = (formData.get("description") as string)?.trim() || null;
    const institution = institutionFromRole(session.role, formData.get("createdByInstitution") as string);

    if (!name || !isValidCnpj(cnpjRaw)) {
      return formRedirect(new URL("/admin/empresas/nova?erro=dados_invalidos", req.url));
    }

    const cnpj = normalizeCnpj(cnpjRaw);
    const others = await prisma.company.findMany({
      where: { status: { in: ["ACTIVE", "PENDING"] }, NOT: { cnpj: null } },
      select: { cnpj: true },
    });
    if (others.some((item) => normalizeCnpj(item.cnpj || "") === cnpj)) {
      return formRedirect(new URL("/admin/empresas/nova?erro=cnpj_duplicado", req.url));
    }

    const company = await prisma.company.create({
      data: {
        name,
        tradeName,
        cnpj,
        email,
        phone,
        address,
        city,
        state,
        sector,
        contactName,
        notes,
        description,
        status: "ACTIVE",
        isVerified: true,
        createdByInstitution: institution,
        createdById: session.userId,
        reviewedAt: new Date(),
      },
    });

    await logAudit({
      userId: session.userId,
      action: "COMPANY_CREATED",
      resourceType: "Company",
      resourceId: company.id,
      details: {
        cnpj,
        name,
        status: "ACTIVE",
        institution,
      },
    });

    return formRedirect(new URL(`/admin/empresas?sucesso=cadastrada`, req.url));
  } catch (error) {
    console.error("Erro ao cadastrar empresa:", error);
    return formRedirect(new URL("/admin/empresas/nova?erro=erro_servidor", req.url));
  }
}
