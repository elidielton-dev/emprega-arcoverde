import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/mail/mailer";

export async function getOrCreateNotificationPref(userId: string) {
  return prisma.notificationPreference.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export async function shouldSendEmailAlert(
  userId: string,
  kind: "status" | "job" | "system" = "system",
): Promise<boolean> {
  const pref = await getOrCreateNotificationPref(userId);
  if (!pref.emailEnabled) return false;
  if (kind === "status" && !pref.statusAlerts) return false;
  if (kind === "job" && !pref.jobAlerts) return false;
  return true;
}

/** Envia e-mail só se preferências permitirem. */
export async function sendEmailIfAllowed(
  userId: string,
  opts: { to: string; subject: string; html: string; kind?: "status" | "job" | "system" },
) {
  const ok = await shouldSendEmailAlert(userId, opts.kind || "system");
  if (!ok) return { success: false, skipped: true as const };
  const result = await sendEmail({
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
  return { ...result, skipped: false as const };
}
