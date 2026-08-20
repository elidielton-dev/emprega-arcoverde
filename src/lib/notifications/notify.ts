import { prisma } from "@/lib/db/prisma";

export type NotifyPayload = {
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
};

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Recebida",
  UNDER_REVIEW: "Em triagem",
  CONTACT_SELECTED: "Contato selecionado",
  INTERVIEW_SCHEDULED: "Entrevista agendada",
  APPROVED: "Aprovado(a)",
  NOT_SELECTED: "Não selecionado(a)",
  WITHDRAWN: "Candidatura retirada",
};

/** Cria notificação in-app. Falhas não interrompem o fluxo principal. */
export async function notifyUser(payload: NotifyPayload): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        type: payload.type,
        link: payload.link || null,
        channel: "IN_APP",
        status: "DELIVERED",
      },
    });
  } catch (error) {
    console.error("Falha ao criar notificação:", error);
  }
}

export async function notifyUsers(
  userIds: string[],
  payload: Omit<NotifyPayload, "userId">,
): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  await Promise.all(unique.map((userId) => notifyUser({ ...payload, userId })));
}

export async function notifyCompanyMembers(
  companyId: string,
  payload: Omit<NotifyPayload, "userId">,
): Promise<void> {
  try {
    const members = await prisma.companyMember.findMany({
      where: { companyId },
      select: { userId: true },
    });
    await notifyUsers(
      members.map((m) => m.userId),
      payload,
    );
  } catch (error) {
    console.error("Falha ao notificar membros da empresa:", error);
  }
}

export async function notifyUsersByRoles(
  roles: string[],
  payload: Omit<NotifyPayload, "userId">,
): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });
    await notifyUsers(
      users.map((u) => u.id),
      payload,
    );
  } catch (error) {
    console.error("Falha ao notificar papéis:", error);
  }
}

export async function notifyAdmins(payload: Omit<NotifyPayload, "userId">): Promise<void> {
  await notifyUsersByRoles(["ACA_ADMIN", "MUNICIPAL_ADMIN", "SUPER_ADMIN"], payload);
}

export async function notifyMunicipalAdmins(
  payload: Omit<NotifyPayload, "userId">,
): Promise<void> {
  await notifyUsersByRoles(["MUNICIPAL_ADMIN", "SUPER_ADMIN"], payload);
}
