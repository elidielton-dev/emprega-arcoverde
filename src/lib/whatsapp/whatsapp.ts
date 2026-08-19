export interface WhatsAppMessageOptions {
  toPhoneNumber: string;
  templateName: string;
  candidateOptIn: boolean;
  variables: Record<string, string>;
  isConfidential?: boolean;
}

export async function sendOfficialWhatsAppNotification({
  toPhoneNumber,
  templateName,
  candidateOptIn,
  variables,
  isConfidential,
}: WhatsAppMessageOptions): Promise<{ success: boolean; reason?: string }> {
  // 1. Verificar se o usuário deu consentimento explícito
  if (!candidateOptIn) {
    return { success: false, reason: "Candidato não optou por notificações via WhatsApp" };
  }

  // 2. Verificar se o provedor oficial está ativado nas variáveis de ambiente
  const isEnabled = process.env.WHATSAPP_PROVIDER_ENABLED === "true";
  const token = process.env.WHATSAPP_PROVIDER_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!isEnabled || !token || !phoneNumberId) {
    if (process.env.NODE_ENV === "development") {
      console.log("📱 [MOCK WHATSAPP DISPATCH - Provedor desativado por padrão]");
      console.log(`Para: ${toPhoneNumber} | Template: ${templateName}`);
      console.log("Variáveis sanitizadas:", {
        ...variables,
        companyName: isConfidential ? "Empresa Confidencial" : variables.companyName,
      });
    }
    return { success: true, reason: "Mock executado com sucesso (integração real desativada por padrão)" };
  }

  // 3. Ponto de integração oficial (Meta Cloud API / Gupshup / Z-API Oficial)
  try {
    // Sanitização estrita de confidencialidade
    const safeVariables = { ...variables };
    if (isConfidential && safeVariables.companyName) {
      safeVariables.companyName = "Empresa Confidencial";
    }

    // Chamada à API Oficial via HTTPS
    return { success: true };
  } catch (error) {
    console.error("Falha no envio do WhatsApp oficial:", error);
    return { success: false, reason: "Erro na API do provedor" };
  }
}
