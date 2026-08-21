import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canManageSiteSettings } from "@/lib/auth/rbac";
import { upsertSetting } from "@/lib/site/settings";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";

const KEYS = [
  "contact_email",
  "contact_phone_sala",
  "contact_phone_aca",
  "address_sala",
  "address_aca",
  "hours_sala",
  "email_aca",
] as const;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!canManageSiteSettings(session.role)) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const data = await req.formData();
  for (const key of KEYS) {
    const value = String(data.get(key) || "").trim();
    await upsertSetting(key, value);
  }

  await logAudit({
    userId: session.userId,
    action: "SITE_SETTINGS_UPDATED",
    resourceType: "SiteSetting",
    details: { keys: [...KEYS] },
  });

  return formRedirect(new URL("/admin/configuracoes?sucesso=1", req.url));
}
