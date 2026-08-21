import { NextRequest, NextResponse } from "next/server";
import { formRedirect } from "@/lib/http/form-redirect";
import { sendEmail } from "@/lib/mail/mailer";
import { getSetting } from "@/lib/site/settings";
import { logAudit } from "@/lib/audit/audit";
import { notifyAdmins } from "@/lib/notifications/notify";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const honeypot = String(data.get("website") || "").trim();
    if (honeypot) {
      return formRedirect(new URL("/contato?sucesso=1", req.url));
    }

    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !email || !subject || !message || !email.includes("@")) {
      return formRedirect(new URL("/contato?erro=campos", req.url));
    }

    const to = (await getSetting("contact_email")) || process.env.EMAIL_FROM || "";
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#E65100">Mensagem pelo portal</h2>
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Assunto:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Mensagem:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `;

    await sendEmail({
      to,
      subject: `[Emprega Arcoverde] ${subject}`,
      html,
      text: `${name} <${email}>\n\n${message}`,
    });

    await notifyAdmins({
      title: "Nova mensagem de contato",
      message: `${name}: ${subject}`,
      type: "SYSTEM",
      link: "/admin",
    });

    await logAudit({
      action: "CONTACT_MESSAGE_SENT",
      resourceType: "Contact",
      details: { name, email, subject },
    });

    return formRedirect(new URL("/contato?sucesso=1", req.url));
  } catch (error) {
    console.error("Contato:", error);
    return formRedirect(new URL("/contato?erro=falha", req.url));
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
