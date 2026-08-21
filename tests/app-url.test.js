const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

// Espelha a lógica de resolvePublicAppUrl (sem import TS)
function resolvePublicAppUrl(req, env = process.env) {
  const envRaw = (env.APP_URL || "").trim().replace(/\/$/, "");
  const envIsLocal = !envRaw || /localhost|127\.0\.0\.1/i.test(envRaw);

  if (req) {
    const host =
      (req.headers.get("x-forwarded-host") || "").split(",")[0].trim() ||
      (req.headers.get("host") || "").trim();
    if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
      const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0].trim();
      if (envIsLocal) return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  if (envRaw && !envIsLocal) return envRaw;

  const vercel = (env.VERCEL_URL || "").trim().replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  return envRaw || "http://localhost:3000";
}

describe("resolvePublicAppUrl", () => {
  it("usa host da requisição quando APP_URL é localhost", () => {
    const headers = new Map([
      ["host", "empregaarcoverde.vercel.app"],
      ["x-forwarded-proto", "https"],
    ]);
    const req = { headers: { get: (k) => headers.get(k) || null } };
    const url = resolvePublicAppUrl(req, { APP_URL: "http://localhost:3000" });
    assert.equal(url, "https://empregaarcoverde.vercel.app");
  });

  it("respeita APP_URL público", () => {
    const url = resolvePublicAppUrl(undefined, {
      APP_URL: "https://empregaarcoverde.vercel.app",
    });
    assert.equal(url, "https://empregaarcoverde.vercel.app");
  });
});
