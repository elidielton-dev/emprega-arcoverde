import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Healthcheck: DB + storage + e-mail + secrets. */
export async function GET(_req: NextRequest) {
  const started = Date.now();
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "error";
    return NextResponse.json(
      { ok: false, checks, ms: Date.now() - started },
      { status: 503 },
    );
  }

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const forceLocal = process.env.STORAGE_DRIVER === "local";
  checks.storage = forceLocal ? "local" : hasSupabase ? "supabase" : "local";

  const emailMock = process.env.EMAIL_MOCK === "true";
  const hasResend = Boolean(
    process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_PROVIDER_API_KEY?.trim(),
  );
  const hasSmtp = Boolean(process.env.SMTP_HOST?.trim());
  checks.email = emailMock ? "mock" : hasResend ? "resend" : hasSmtp ? "smtp" : "mock";

  const from = process.env.EMAIL_FROM?.trim() || "";
  checks.emailFromMode = /onboarding@resend\.dev/i.test(from) ? "test_only" : from ? "production" : "missing";

  const appUrl = process.env.APP_URL?.trim() || "";
  checks.appUrl = !appUrl
    ? "missing"
    : /localhost|127\.0\.0\.1/i.test(appUrl)
      ? "localhost"
      : "ok";

  checks.authSecret = process.env.AUTH_SECRET?.trim() ? "ok" : "missing";

  const readyForEndUsers =
    checks.database === "ok" &&
    checks.storage === "supabase" &&
    checks.email !== "mock" &&
    checks.emailFromMode === "production" &&
    checks.appUrl === "ok" &&
    checks.authSecret === "ok";

  return NextResponse.json({
    ok: true,
    readyForEndUsers,
    checks,
    ms: Date.now() - started,
  });
}
