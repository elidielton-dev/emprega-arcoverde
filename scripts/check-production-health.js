/**
 * Consulta GET /api/health em produção.
 * Uso: node scripts/check-production-health.js [url]
 * Exit 0 se readyForDemo (storage supabase + db + auth).
 */
const base = (process.argv[2] || "https://empregaarcoverde.vercel.app").replace(/\/$/, "");

(async () => {
  const res = await fetch(`${base}/api/health`);
  const body = await res.json();
  console.log("\n=== HEALTH PRODUÇÃO ===\n");
  console.log(JSON.stringify(body, null, 2));
  console.log("");

  const c = body.checks || {};
  const demoOk =
    body.readyForDemo === true ||
    (body.readyForDemo == null &&
      c.database === "ok" &&
      c.storage === "supabase" &&
      c.authSecret === "ok");

  const rows = [
    ["database", c.database === "ok"],
    ["storage supabase", c.storage === "supabase"],
    ["authSecret", c.authSecret === "ok"],
    ["readyForDemo (segunda)", demoOk],
    ["email real", c.email && c.email !== "mock"],
    ["emailFrom produção", c.emailFromMode === "production"],
    ["appUrl", c.appUrl === "ok"],
    ["readyForEndUsers", Boolean(body.readyForEndUsers)],
  ];

  if (c.storage === "local" || c.storage === "missing") {
    console.log(
      "AÇÃO: na Vercel cole SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL + STORAGE_BUCKET e remova STORAGE_DRIVER=local. Depois Redeploy.\n",
    );
  }

  let fail = 0;
  for (const [name, ok] of rows) {
    const critical = name.startsWith("database") || name.startsWith("storage") || name.startsWith("auth") || name.startsWith("readyForDemo");
    console.log(`[${ok ? "OK " : "FAIL"}] ${name}${!ok && !critical ? " (pós-demo)" : ""}`);
    if (!ok && critical) fail++;
  }

  if (fail) {
    console.log("\nDemo de segunda NÃO está pronta até storage=supabase. Veja docs/GO-LIVE.md\n");
    process.exit(1);
  }
  console.log("\nreadyForDemo OK — pode demonstrar segunda (anexo persistente).\n");
  if (!body.readyForEndUsers) {
    console.log("Nota: readyForEndUsers ainda false (domínio Resend / APP_URL) — ok para demo.\n");
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
