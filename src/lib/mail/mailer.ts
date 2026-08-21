import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

function resendApiKey() {
  return (
    process.env.RESEND_API_KEY?.trim() ||
    process.env.EMAIL_PROVIDER_API_KEY?.trim() ||
    ""
  );
}

function resendConfigured() {
  return Boolean(resendApiKey());
}

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );
}

function emailProvider(): "resend" | "smtp" | "mock" {
  if (process.env.EMAIL_MOCK === "true") return "mock";
  if (resendConfigured()) return "resend";
  if (smtpConfigured()) return "smtp";
  return "mock";
}

/** True se há Resend ou SMTP real (não mock). */
export function isEmailDeliveryConfigured() {
  return emailProvider() !== "mock";
}

export function getEmailProviderName() {
  return emailProvider();
}

let transporter: Transporter | null = null;
let resendClient: Resend | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!.trim(),
      pass: process.env.SMTP_PASS!.trim(),
    },
  });
  return transporter;
}

function getResend(): Resend {
  if (!resendClient) resendClient = new Resend(resendApiKey());
  return resendClient;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; messageId: string; error?: string }> {
  const from =
    process.env.EMAIL_FROM?.trim() || "Emprega Arcoverde <onboarding@resend.dev>";
  const provider = emailProvider();

  if (provider === "mock") {
    console.log("=================================================");
    console.log("📧 [MOCK EMAIL — configure RESEND_API_KEY ou SMTP_*]");
    console.log(`De: ${from}`);
    console.log(`Para: ${to}`);
    console.log(`Assunto: ${subject}`);
    console.log("Conteúdo (HTML resumido):", html.substring(0, 300) + "...");
    console.log("=================================================");
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  if (provider === "resend") {
    try {
      const { data, error } = await getResend().emails.send({
        from,
        to: [to],
        subject,
        html,
        text: text || undefined,
      });
      if (error) {
        console.error("Falha no envio Resend:", error);
        return {
          success: false,
          messageId: "",
          error: typeof error === "object" && error && "message" in error
            ? String((error as { message?: string }).message || error)
            : String(error),
        };
      }
      return {
        success: true,
        messageId: String(data?.id || `resend-${Date.now()}`),
      };
    } catch (error) {
      console.error("Falha no envio Resend:", error);
      return {
        success: false,
        messageId: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  try {
    const info = await getTransporter().sendMail({
      from,
      to,
      subject,
      text: text || undefined,
      html,
    });
    return {
      success: true,
      messageId: String(info.messageId || `smtp-${Date.now()}`),
    };
  } catch (error) {
    console.error("Falha no envio de e-mail SMTP:", error);
    return { success: false, messageId: "" };
  }
}

export function generateApplicationConfirmationEmail(
  jobTitle: string,
  candidateName: string,
  isConfidential: boolean,
  companyName: string,
) {
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

export function generatePasswordResetEmail(
  name: string,
  token: string,
  appUrl?: string,
) {
  const base = (appUrl || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const url = `${base}/redefinir-senha?token=${encodeURIComponent(token)}`;
  return {
    html: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color: #e65100; font-size: 22px;">Redefinição de senha</h1>
      <p>Olá, <strong>${name}</strong>.</p>
      <p>Recebemos uma solicitação para redefinir sua senha. O link abaixo é válido por uma hora.</p>
      <p><a href="${url}" style="background:#e65100;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Criar nova senha</a></p>
      <p style="font-size:12px;color:#666;word-break:break-all;">Se o botão não funcionar, copie e cole este link no navegador:<br/>${url}</p>
      <p>Se você não fez esta solicitação, ignore esta mensagem.</p>
    </div>
  `,
    text: `Olá, ${name}.\n\nRedefina sua senha (válido por 1 hora):\n${url}\n\nSe você não solicitou, ignore este e-mail.`,
    resetUrl: url,
  };
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
