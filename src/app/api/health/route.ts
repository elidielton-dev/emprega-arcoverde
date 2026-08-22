import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isSupabaseStorageConfigured } from "@/lib/storage/storage";

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

  const hasSupabase = isSupabaseStorageConfigured();
  const driver = process.env.STORAGE_DRIVER?.trim().toLowerCase();
  const onVercel = Boolean(process.env.VERCEL);

  if (hasSupabase) {
    checks.storage = "supabase";
    if (driver === "local" && onVercel) {
      checks.storageDriverNote = "local_ignored_on_vercel";
    }
  } else {
    checks.storage = onVercel || process.env.NODE_ENV === "production" ? "missing" : "local";
  }

  const emailMock = process.env.EMAIL_MOCK === "true";
  const hasResend = Boolean(
    process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_PROVIDER_API_KEY?.trim(),
  );
  const hasSmtp = Boolean(process.env.SMTP_HOST?.trim());
  checks.email = emailMock ? "mock" : hasResend ? "resend" : hasSmtp ? "smtp" : "mock";

  const from = process.env.EMAIL_FROM?.trim() || "";
  checks.emailFromMode = /onboarding@resend\.dev/i.test(from)
    ? "test_only"
    : from
      ? "production"
      : "missing";

  const appUrl = process.env.APP_URL?.trim() || "";
  checks.appUrl = !appUrl
    ? "missing"
    : /localhost|127\.0\.0\.1/i.test(appUrl)
      ? "localhost"
      : "ok";

  checks.authSecret = process.env.AUTH_SECRET?.trim() ? "ok" : "missing";

  /** Demo segunda: DB + storage Supabase + auth. */
  const readyForDemo =
    checks.database === "ok" &&
    checks.storage === "supabase" &&
    checks.authSecret === "ok";

  /** Público geral: também e-mail com domínio próprio + APP_URL. */
  const readyForEndUsers =
    readyForDemo &&
    checks.email !== "mock" &&
    checks.emailFromMode === "production" &&
    checks.appUrl === "ok";

  return NextResponse.json({
    ok: true,
    readyForDemo,
    readyForEndUsers,
    checks,
    ms: Date.now() - started,
  });
}
