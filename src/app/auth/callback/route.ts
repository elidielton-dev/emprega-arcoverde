import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth/session";
import { upsertUserFromSupabase } from "@/lib/auth/sync-supabase-user";
import { logAudit } from "@/lib/audit/audit";
import { applySupabaseCookies, createSupabaseRouteClient, type CookieToSet } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNext(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "";
}

function destinationForRole(role: string, next: string) {
  if (next) return next;
  if (role === "COMPANY_MEMBER") return "/empresa";
  if (role === "ASSISTED_OPERATOR") return "/admin/atendimento-assistido";
  if (role !== "CANDIDATE") return "/admin";
  return "/painel";
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const next = safeNext(req.nextUrl.searchParams.get("next"));

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }

  const cookieJar: CookieToSet[] = [];
  const supabase = createSupabaseRouteClient(req, cookieJar);
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }

  try {
    const session = await upsertUserFromSupabase(user);
    const destination = destinationForRole(session.role, next);
    const redirectResponse = NextResponse.redirect(new URL(destination, req.url));
    applySupabaseCookies(redirectResponse, cookieJar);

    await attachSessionCookie(redirectResponse, session);
    await logAudit({
      userId: session.userId,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: session.userId,
    });
    return redirectResponse;
  } catch (err) {
    console.error("OAuth sync error:", err);
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }
}
