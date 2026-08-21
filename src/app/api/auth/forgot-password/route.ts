import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import {
  sendEmail,
  generatePasswordResetEmail,
  isEmailDeliveryConfigured,
} from "@/lib/mail/mailer";
import { formRedirect } from "@/lib/http/form-redirect";
import { resolvePublicAppUrl } from "@/lib/http/app-url";
import { logAudit } from "@/lib/audit/audit";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const email = String(data.get("email") || "").trim().toLowerCase();

    if (!email) {
      return formRedirect(new URL("/esqueci-a-senha?erro=email_obrigatorio", req.url));
    }

    // Sem provedor real, o "sucesso" mentia — e-mail nunca saía.
    if (!isEmailDeliveryConfigured()) {
      console.error(
        "Recuperação de senha: RESEND_API_KEY ou SMTP_* não configurados (modo mock).",
      );
      return formRedirect(new URL("/esqueci-a-senha?erro=email_nao_configurado", req.url));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    const appUrl = resolvePublicAppUrl(req);

    if (user) {
      const token = randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: createHash("sha256").update(token).digest("hex"),
          resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const mail = generatePasswordResetEmail(user.name, token, appUrl);
      const result = await sendEmail({
        to: user.email,
        subject: "Redefina sua senha — Emprega Arcoverde",
        html: mail.html,
        text: mail.text,
      });

      if (!result.success) {
        console.error("Recuperação de senha: falha no envio para", user.email, {
          appUrl,
          resetUrlHost: (() => {
            try {
              return new URL(mail.resetUrl).host;
            } catch {
              return "invalid";
            }
          })(),
        });
        return formRedirect(new URL("/esqueci-a-senha?erro=falha_envio", req.url));
      }

      try {
        await logAudit({
          userId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          resourceType: "User",
          resourceId: user.id,
          details: { email: user.email },
        });
      } catch {
        /* ignore */
      }
    }

    // Mesma mensagem com ou sem usuário (não revela se o e-mail existe)
    return formRedirect(new URL("/esqueci-a-senha?sucesso=1", req.url));
  } catch (error) {
    console.error("Erro em forgot-password:", error);
    return formRedirect(new URL("/esqueci-a-senha?erro=erro_servidor", req.url));
  }
}
