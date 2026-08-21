/**
 * URL pública do app (links em e-mail, redirects).
 * Em produção, nunca usa localhost se houver Host / VERCEL_URL.
 */
export function resolvePublicAppUrl(req?: Request): string {
  const envRaw = process.env.APP_URL?.trim().replace(/\/$/, "") || "";
  const envIsLocal = !envRaw || /localhost|127\.0\.0\.1/i.test(envRaw);

  if (req) {
    const host =
      req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
      req.headers.get("host")?.trim() ||
      "";
    if (host && !/localhost|127\.0\.0\.1/i.test(host)) {
      const proto =
        req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
      // Preferir host da requisição quando APP_URL falta ou ainda é localhost
      if (envIsLocal) {
        return `${proto}://${host}`.replace(/\/$/, "");
      }
    }
  }

  if (envRaw && !envIsLocal) return envRaw;

  const vercel = process.env.VERCEL_URL?.trim().replace(/^https?:\/\//, "");
  if (vercel) return `https://${vercel}`.replace(/\/$/, "");

  if (req) {
    const host = req.headers.get("host")?.trim();
    if (host) {
      const proto =
        req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
        (/localhost|127\.0\.0\.1/i.test(host) ? "http" : "https");
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  return envRaw || "http://localhost:3000";
}
