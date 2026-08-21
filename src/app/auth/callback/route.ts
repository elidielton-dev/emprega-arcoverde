import { NextRequest, NextResponse } from "next/server";
import { attachSessionCookie } from "@/lib/auth/session";
import { upsertUserFromSupabase } from "@/lib/auth/sync-supabase-user";
import { logAudit } from "@/lib/audit/audit";
import { applySupabaseCookies, createSupabaseRouteClient, type CookieToSet } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { fetchLinkedInProfileFromApi } from "@/lib/linkedin/fetch-profile";

function safeNext(value: string | null) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return "";
}

function destinationForRole(
  role: string,
  next: string,
  opts: { isNew: boolean; isLinkedIn: boolean; hasStructuredCv: boolean },
) {
  if (next) return next;
  if (role === "COMPANY_MEMBER") return "/empresa";
  if (role === "ASSISTED_OPERATOR") return "/admin/atendimento-assistido";
  if (role !== "CANDIDATE") return "/admin";
  // Novo candidato LinkedIn sem CV estruturado → fluxo de importação
  if (opts.isNew && opts.isLinkedIn && !opts.hasStructuredCv) {
    return "/painel/importar-linkedin";
  }
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
  const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);

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

  const isLinkedIn =
    user.app_metadata?.provider === "linkedin_oidc" ||
    user.identities?.some((i) => i.provider === "linkedin_oidc");

  let linkedIn = null;
  const providerToken = exchangeData.session?.provider_token;
  if (isLinkedIn && providerToken) {
    try {
      linkedIn = await fetchLinkedInProfileFromApi(providerToken);
    } catch (err) {
      console.warn("LinkedIn API enrichment failed:", err);
    }
  }

  try {
    const session = await upsertUserFromSupabase(user, { linkedIn });
    const hasStructuredCv = Boolean(
      linkedIn &&
        (linkedIn.experiences.length > 0 ||
          linkedIn.educations.length > 0 ||
          linkedIn.courses.length > 0),
    );
    const destination = destinationForRole(session.role, next, {
      isNew: session.isNew,
      isLinkedIn: session.isLinkedIn,
      hasStructuredCv,
    });
    const redirectResponse = NextResponse.redirect(new URL(destination, req.url));
    applySupabaseCookies(redirectResponse, cookieJar);

    await attachSessionCookie(redirectResponse, session);
    await logAudit({
      userId: session.userId,
      action: "USER_LOGIN",
      resourceType: "User",
      resourceId: session.userId,
      details: {
        provider: isLinkedIn ? "linkedin_oidc" : user.app_metadata?.provider,
        linkedInImport: hasStructuredCv,
      },
    });
    return redirectResponse;
  } catch (err) {
    console.error("OAuth sync error:", err);
    return NextResponse.redirect(new URL("/entrar?erro=oauth_falhou", req.url));
  }
}
