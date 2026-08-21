import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/audit";
import { formRedirect } from "@/lib/http/form-redirect";
import { sendEmail } from "@/lib/mail/mailer";
import bcrypt from "bcryptjs";

function randomPassword() {
  return `Ea${Math.random().toString(36).slice(2, 8)}!`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_MEMBER" || !session.companyId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const membership = await prisma.companyMember.findFirst({
    where: { userId: session.userId, companyId: session.companyId },
  });
  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json({ error: "Somente OWNER/ADMIN convidam membros" }, { status: 403 });
  }

  const data = await req.formData();
  const action = String(data.get("action") || "INVITE");
  const memberId = String(data.get("memberId") || "").trim();

  if (action === "REMOVE" && memberId) {
    const target = await prisma.companyMember.findFirst({
      where: { id: memberId, companyId: session.companyId },
    });
    if (!target) return formRedirect(new URL("/empresa/configuracoes?erro=membro", req.url));
    if (target.userId === session.userId) {
      return formRedirect(new URL("/empresa/configuracoes?erro=auto", req.url));
    }
    await prisma.companyMember.delete({ where: { id: memberId } });
    await logAudit({
      userId: session.userId,
      action: "COMPANY_MEMBER_REMOVED",
      resourceType: "CompanyMember",
      resourceId: memberId,
    });
    return formRedirect(new URL("/empresa/configuracoes?tab=usuarios&sucesso=removido", req.url));
  }

  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const role = String(data.get("role") || "MEMBER");
  if (!name || !email || !email.includes("@")) {
    return formRedirect(new URL("/empresa/configuracoes?tab=usuarios&erro=campos", req.url));
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  let userId = existing?.id;
  let tempPassword: string | null = null;

  if (existing) {
    if (existing.role !== "COMPANY_MEMBER") {
      return formRedirect(new URL("/empresa/configuracoes?tab=usuarios&erro=papel", req.url));
    }
    const already = await prisma.companyMember.findFirst({
      where: { userId: existing.id, companyId: session.companyId },
    });
    if (already) {
      return formRedirect(new URL("/empresa/configuracoes?tab=usuarios&erro=ja_membro", req.url));
    }
  } else {
    tempPassword = randomPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "COMPANY_MEMBER",
        isEmailVerified: true,
      },
    });
    userId = user.id;
  }

  const member = await prisma.companyMember.create({
    data: {
      userId: userId!,
      companyId: session.companyId,
      role: ["OWNER", "ADMIN", "MEMBER"].includes(role) ? role : "MEMBER",
    },
  });

  const company = await prisma.company.findUnique({ where: { id: session.companyId } });
  await sendEmail({
    to: email,
    subject: `Acesso ao painel — ${company?.tradeName || company?.name || "Emprega Arcoverde"}`,
    html: `
      <p>Olá, <strong>${name}</strong>.</p>
      <p>Você foi adicionado(a) à empresa <strong>${company?.tradeName || company?.name}</strong> no Emprega Arcoverde.</p>
      ${
        tempPassword
          ? `<p>Acesse com o e-mail <strong>${email}</strong> e a senha provisória: <strong>${tempPassword}</strong></p>`
          : `<p>Use sua senha já cadastrada em <a href="${process.env.APP_URL || ""}/entrar">entrar</a>.</p>`
      }
    `,
  });

  await logAudit({
    userId: session.userId,
    action: "COMPANY_MEMBER_INVITED",
    resourceType: "CompanyMember",
    resourceId: member.id,
    details: { email, role },
  });

  return formRedirect(new URL("/empresa/configuracoes?tab=usuarios&sucesso=convidado", req.url));
}
