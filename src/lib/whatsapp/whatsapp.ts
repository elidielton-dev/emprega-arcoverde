export interface WhatsAppMessageOptions {
  toPhoneNumber: string;
  templateName: string;
  candidateOptIn: boolean;
  variables: Record<string, string>;
  isConfidential?: boolean;
}

/**
 * Canal oficial Meta/etc. — desativado por decisão de produto (2026-08).
 * Contato WhatsApp na plataforma = links wa.me manuais (empresa / interesse).
 * Não simula sucesso quando o provedor está off.
 */
export async function sendOfficialWhatsAppNotification({
  toPhoneNumber,
  templateName,
  candidateOptIn,
}: WhatsAppMessageOptions): Promise<{ success: boolean; reason?: string }> {
  if (!candidateOptIn) {
    return { success: false, reason: "Candidato não optou por notificações via WhatsApp" };
  }

  const isEnabled = process.env.WHATSAPP_PROVIDER_ENABLED === "true";
  if (!isEnabled) {
    return {
      success: false,
      reason: "WhatsApp oficial não habilitado. Use contato manual (wa.me).",
    };
  }

  const token = process.env.WHATSAPP_PROVIDER_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { success: false, reason: "Credenciais do provedor WhatsApp ausentes" };
  }

  // Integração real ainda não ligada — não reportar sucesso falso
  console.warn(
    `[whatsapp] Provedor marcado como enabled, mas envio oficial não está implementado. Destino=${toPhoneNumber} template=${templateName}`,
  );
  return {
    success: false,
    reason: "Envio oficial WhatsApp não implementado. Desative WHATSAPP_PROVIDER_ENABLED.",
  };
}
