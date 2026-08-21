const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

function loadEnv() {
  const env = {};
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v;
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const results = [];

  // 1) Env essentials
  results.push({
    check: "AUTH_SECRET",
    ok: Boolean(env.AUTH_SECRET),
  });
  results.push({
    check: "RESEND_API_KEY",
    ok: Boolean(env.RESEND_API_KEY),
  });
  results.push({
    check: "EMAIL_FROM",
    ok: Boolean(env.EMAIL_FROM),
    detail: env.EMAIL_FROM || "(vazio)",
  });
  results.push({
    check: "SUPABASE_URL+SERVICE_ROLE",
    ok: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
  });
  results.push({
    check: "DATABASE_URL",
    ok: Boolean(env.DATABASE_URL),
  });

  results.push({
    check: "APP_URL público",
    ok: Boolean(env.APP_URL) && !/localhost|127\.0\.0\.1/i.test(env.APP_URL),
    detail: env.APP_URL || "(vazio)",
  });

  const from = env.EMAIL_FROM || "";
  const testOnly = /onboarding@resend\.dev/i.test(from);
  results.push({
    check: "EMAIL_FROM produção (não onboarding@resend.dev)",
    ok: Boolean(from) && !testOnly,
    detail: testOnly
      ? "test_only — só envia para o e-mail da conta Resend"
      : from || "(vazio)",
  });

  // 2) Resend send
  try {
    if (!env.RESEND_API_KEY) {
      results.push({ check: "Resend envio", ok: false, detail: "RESEND_API_KEY ausente" });
    } else {
      const resend = new Resend(env.RESEND_API_KEY);
      const { data, error } = await resend.emails.send({
        from: env.EMAIL_FROM || "Emprega Arcoverde <onboarding@resend.dev>",
        to: ["delivered@resend.dev"],
        subject: "Emprega Arcoverde — validação " + new Date().toISOString(),
        html: "<p>Validação automática OK.</p>",
      });
      results.push({
        check: "Resend envio",
        ok: !error && Boolean(data?.id),
        detail: error ? JSON.stringify(error) : data?.id,
      });
    }
  } catch (e) {
    results.push({ check: "Resend envio", ok: false, detail: e.message });
  }

  // 3) Supabase storage
  try {
    const bucket = env.STORAGE_BUCKET || "emprega-arcoverde-docs";
    const c = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
    const list = await c.storage.listBuckets();
    const exists = list.data?.some((b) => b.name === bucket);
    const path = `healthcheck/validation-${Date.now()}.txt`;
    const up = await c.storage.from(bucket).upload(path, Buffer.from("validation-ok"), {
      contentType: "text/plain",
      upsert: true,
    });
    results.push({
      check: "Storage bucket",
      ok: Boolean(exists),
      detail: bucket,
    });
    results.push({
      check: "Storage upload",
      ok: !up.error,
      detail: up.error ? up.error.message : up.data?.path,
    });
  } catch (e) {
    results.push({ check: "Storage", ok: false, detail: e.message });
  }

  // 4) Database via Prisma
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    await prisma.$disconnect();
    results.push({ check: "Database", ok: true, detail: `${users} users` });
  } catch (e) {
    results.push({ check: "Database", ok: false, detail: e.message });
  }

  console.log("\n=== VALIDAÇÃO EMPREGA ARCOVERDE ===\n");
  let failed = 0;
  for (const r of results) {
    const mark = r.ok ? "OK " : "FAIL";
    console.log(`[${mark}] ${r.check}${r.detail ? " — " + r.detail : ""}`);
    if (!r.ok) failed++;
  }
  console.log(
    failed === 0
      ? "\nResultado: TUDO OK\n"
      : `\nResultado: ${failed} falha(s)\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
