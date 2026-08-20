import { createHash, randomBytes } from "crypto";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail, generatePasswordResetEmail } from "@/lib/mail/mailer";
import { formRedirect } from "@/lib/http/form-redirect";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const email = String(data.get("email") || "").trim().toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: createHash("sha256").update(token).digest("hex"),
        resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendEmail({
      to: user.email,
      subject: "Redefina sua senha — Emprega Arcoverde",
      html: generatePasswordResetEmail(user.name, token),
    });
  }

  return formRedirect(new URL("/esqueci-a-senha?sucesso=1", req.url));
}
