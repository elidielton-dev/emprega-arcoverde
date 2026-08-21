import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/** Healthcheck: DB + (opcional) storage. */
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
  checks.storage = hasSupabase
    ? process.env.STORAGE_DRIVER === "local"
      ? "local"
      : "supabase"
    : "local";

  checks.email =
    process.env.EMAIL_MOCK === "true"
      ? "mock"
      : process.env.RESEND_API_KEY?.trim() || process.env.EMAIL_PROVIDER_API_KEY?.trim()
        ? "resend"
        : process.env.SMTP_HOST?.trim()
          ? "smtp"
          : "mock";
  checks.authSecret = process.env.AUTH_SECRET?.trim() ? "ok" : "missing";

  return NextResponse.json({
    ok: true,
    checks,
    ms: Date.now() - started,
  });
}
