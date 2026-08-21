const fs = require("fs");
const nodemailer = require("nodemailer");

const env = {};
for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const i = line.indexOf("=");
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[line.slice(0, i).trim()] = v;
}

if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
  console.log("SMTP não configurado — envio permanece em modo mock.");
  console.log("Preencha SMTP_HOST, SMTP_USER e SMTP_PASS no .env / Vercel.");
  process.exit(0);
}

(async () => {
  const port = Number(env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: env.SMTP_SECURE === "true" || port === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  await transporter.verify();
  console.log("SMTP OK — servidor aceitou autenticação.");
})().catch((e) => {
  console.error("SMTP falhou:", e.message);
  process.exit(1);
});
