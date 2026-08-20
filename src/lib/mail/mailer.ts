export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<{ success: boolean; messageId: string }> {
  const from = process.env.EMAIL_FROM || "nao-responda@emprega.arcoverde.pe.gov.br";
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;

  if (process.env.NODE_ENV === "development" || !apiKey) {
    console.log("=================================================");
    console.log("📧 [MOCK EMAIL DISPATCH - EMPREGA ARCOVERDE]");
    console.log(`De: ${from}`);
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log("Conteúdo (HTML resumido):", html.substring(0, 300) + "...");
    console.log("=================================================");
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  // Em produção com API Key configurada (e.g. Resend ou SMTP):
  try {
    // Ponto de integração para Resend/SendGrid/SES
    return { success: true, messageId: `prod-${Date.now()}` };
  } catch (error) {
    console.error("Falha no envio de email:", error);
    return { success: false, messageId: "" };
  }
}

export function generateApplicationConfirmationEmail(jobTitle: string, candidateName: string, isConfidential: boolean, companyName: string) {
  const displayedCompany = isConfidential ? "Empresa Confidencial" : companyName;
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #feeddf; border-radius: 8px;">
      <div style="background-color: #e65100; color: white; padding: 16px; text-align: center; border-radius: 6px;">
        <h1 style="margin: 0; font-size: 20px;">Emprega Arcoverde</h1>
      </div>
      <div style="padding: 20px; color: #2e221f;">
        <h2>Candidatura confirmada!</h2>
        <p>Olá, <strong>${candidateName}</strong>,</p>
        <p>Sua candidatura para a vaga <strong>${jobTitle}</strong> (${displayedCompany}) foi registrada com sucesso.</p>
        <p>Acompanhe o andamento do processo seletivo pelo seu painel de candidato.</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${process.env.APP_URL || "http://localhost:3000"}/painel/candidaturas" style="background-color: #e65100; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Ver Minhas Candidaturas</a>
        </div>
        <p style="font-size: 12px; color: #78716c;">Esta é uma mensagem automática da plataforma pública Emprega Arcoverde.</p>
      </div>
    </div>
  `;
}

export function generatePasswordResetEmail(name: string, token: string) {
  const url = `${process.env.APP_URL || "http://localhost:3000"}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #e65100; font-size: 22px;">Redefinição de senha</h1>
      <p>Olá, <strong>${name}</strong>.</p>
      <p>Recebemos uma solicitação para redefinir sua senha. O link abaixo é válido por uma hora.</p>
      <p><a href="${url}" style="background:#e65100;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Criar nova senha</a></p>
      <p>Se você não fez esta solicitação, ignore esta mensagem.</p>
    </div>
  `;
}

export function generateInterviewInviteEmail(
  candidateName: string,
  jobTitle: string,
  scheduledAt: Date,
  location?: string | null,
  instructions?: string | null,
) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #e65100; font-size: 22px;">Entrevista agendada</h1>
      <p>Olá, <strong>${candidateName}</strong>.</p>
      <p>Sua entrevista para <strong>${jobTitle}</strong> foi agendada para <strong>${scheduledAt.toLocaleString("pt-BR")}</strong>.</p>
      ${location ? `<p><strong>Local:</strong> ${location}</p>` : ""}
      ${instructions ? `<p><strong>Orientações:</strong> ${instructions}</p>` : ""}
      <p>Consulte sua candidatura no Emprega Arcoverde para acompanhar o processo.</p>
    </div>
  `;
}
