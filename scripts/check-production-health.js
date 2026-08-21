/**
 * Consulta GET /api/health em produção e reporta se está pronto para usuário final.
 * Uso: node scripts/check-production-health.js [url]
 */
const base = (process.argv[2] || "https://empregaarcoverde.vercel.app").replace(/\/$/, "");

(async () => {
  const res = await fetch(`${base}/api/health`);
  const body = await res.json();
  console.log("\n=== HEALTH PRODUÇÃO ===\n");
  console.log(JSON.stringify(body, null, 2));
  console.log("");

  const c = body.checks || {};
  const rows = [
    ["database", c.database === "ok"],
    ["storage supabase", c.storage === "supabase"],
    ["email real", c.email && c.email !== "mock"],
    ["emailFrom produção", c.emailFromMode === "production"],
    ["appUrl", c.appUrl === "ok"],
    ["authSecret", c.authSecret === "ok"],
    [
      "readyForEndUsers",
      body.readyForEndUsers === true ||
        (body.readyForEndUsers == null &&
          c.database === "ok" &&
          c.storage === "supabase" &&
          c.email &&
          c.email !== "mock" &&
          c.authSecret === "ok"),
    ],
  ];

  // emailFromMode só após o deploy deste commit; avisa se ausente
  if (c.emailFromMode == null) {
    console.log("(aviso) Deploy ainda sem checks.emailFromMode / readyForEndUsers — faça redeploy do main.\n");
  }

  let fail = 0;
  for (const [name, ok] of rows) {
    console.log(`[${ok ? "OK " : "FAIL"}] ${name}`);
    if (!ok) fail++;
  }

  if (fail) {
    console.log("\nAções: veja docs/GO-LIVE.md (copiar SUPABASE_SERVICE_ROLE_KEY e domínio Resend para a Vercel).\n");
    process.exit(1);
  }
  console.log("\nProdução apta a usuário final.\n");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
