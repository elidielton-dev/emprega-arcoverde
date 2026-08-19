import { NextRequest, NextResponse } from "next/server";
import { createSupabaseCookieClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const PROVIDERS = new Set(["google", "linkedin_oidc"]);

function safeNext(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "/painel";
}

export async function GET(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") || "";
  const next = safeNext(req.nextUrl.searchParams.get("next"));

  if (!PROVIDERS.has(provider)) {
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/entrar?erro=oauth_nao_configurado", req.url));
  }

  const origin = req.nextUrl.origin;
  const redirectTo = new URL("/auth/callback", origin);
  redirectTo.searchParams.set("next", next);

  const supabase = createSupabaseCookieClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as "google" | "linkedin_oidc",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: provider === "google" ? { access_type: "offline", prompt: "consent" } : undefined,
    },
  });

  if (error || !data.url) {
    console.error("OAuth start error:", error);
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }

  return NextResponse.redirect(data.url);
}
