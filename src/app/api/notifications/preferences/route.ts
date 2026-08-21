import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { formRedirect } from "@/lib/http/form-redirect";
import { getOrCreateNotificationPref } from "@/lib/notifications/preferences";
import { prisma } from "@/lib/db/prisma";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return formRedirect(new URL("/entrar", req.url));

  const data = await req.formData();
  const emailEnabled = data.get("emailEnabled") === "on";
  const jobAlerts = data.get("jobAlerts") === "on";
  const statusAlerts = data.get("statusAlerts") === "on";

  await getOrCreateNotificationPref(session.userId);
  await prisma.notificationPreference.update({
    where: { userId: session.userId },
    data: { emailEnabled, jobAlerts, statusAlerts },
  });

  await logAudit({
    userId: session.userId,
    action: "NOTIFICATION_PREFS_UPDATED",
    resourceType: "NotificationPreference",
    details: { emailEnabled, jobAlerts, statusAlerts },
  });

  const back =
    session.role === "CANDIDATE"
      ? "/painel/privacidade?sucesso=preferencias"
      : session.role === "COMPANY_MEMBER"
        ? "/empresa/configuracoes?tab=notificacoes&sucesso=preferencias"
        : "/admin";

  return formRedirect(new URL(back, req.url));
}
