import { prisma } from "../db/prisma";

export interface LogAuditOptions {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit({
  userId,
  action,
  resourceType,
  resourceId,
  details,
  ipAddress,
  userAgent,
}: LogAuditOptions) {
  try {
    // Sanitização de dados sensíveis (remover senhas, tokens e dados sigilosos)
    const cleanDetails = details ? JSON.stringify(details, (key, value) => {
      if (["password", "passwordHash", "token", "cpf"].includes(key.toLowerCase())) {
        return "[REDACTED]";
      }
      return value;
    }) : null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        details: cleanDetails,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (error) {
    console.error("Falha ao registrar auditoria:", error);
  }
}
