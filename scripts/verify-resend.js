const fs = require("fs");
const { Resend } = require("resend");

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

const apiKey = env.RESEND_API_KEY || env.EMAIL_PROVIDER_API_KEY;
if (!apiKey) {
  console.log("RESEND_API_KEY não configurado — envio permanece em mock.");
  console.log("1) Crie a chave em https://resend.com/api-keys");
  console.log('2) Coloque no .env: RESEND_API_KEY="re_..."');
  console.log('3) EMAIL_FROM="Emprega Arcoverde <onboarding@resend.dev>" (teste)');
  process.exit(0);
}

(async () => {
  const resend = new Resend(apiKey);
  const from = env.EMAIL_FROM || "Emprega Arcoverde <onboarding@resend.dev>";
  const to = process.argv[2] || env.EMAIL_TEST_TO;
  if (!to) {
    console.log("Resend key presente. Para teste de envio:");
    console.log('  node scripts/verify-resend.js seu-email@exemplo.com');
    process.exit(0);
  }
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject: "Emprega Arcoverde — teste Resend",
    html: "<p>E-mail de teste ok.</p>",
  });
  if (error) {
    console.error("Falha:", error);
    process.exit(1);
  }
  console.log("Enviado:", data?.id);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
