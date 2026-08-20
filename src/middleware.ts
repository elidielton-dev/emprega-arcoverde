import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ea_auth_session";
const SECRET_KEY = process.env.AUTH_SECRET || "emprega-arcoverde-jwt-secret-key-2026";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

type SessionLike = { role?: string };

async function readSession(req: NextRequest): Promise<SessionLike | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as SessionLike;
  } catch {
    return null;
  }
}

function isAdmin(role?: string) {
  return role === "ACA_ADMIN" || role === "MUNICIPAL_ADMIN" || role === "SUPER_ADMIN";
}

function isMunicipal(role?: string) {
  return role === "MUNICIPAL_ADMIN" || role === "SUPER_ADMIN";
}

function loginRedirect(req: NextRequest) {
  const url = new URL("/entrar", req.url);
  url.searchParams.set("redirect", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);

  if (pathname.startsWith("/painel")) {
    if (!session || session.role !== "CANDIDATE") return loginRedirect(req);
  }

  if (pathname.startsWith("/empresa")) {
    if (!session || (session.role !== "COMPANY_MEMBER" && !isAdmin(session.role))) {
      return loginRedirect(req);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!session) return loginRedirect(req);
    const allowed =
      isAdmin(session.role) ||
      session.role === "ASSISTED_OPERATOR";
    if (!allowed) return loginRedirect(req);

    if (
      (pathname.startsWith("/admin/indicadores") ||
        pathname.startsWith("/admin/cursos") ||
        pathname.startsWith("/admin/usuarios")) &&
      !isMunicipal(session.role)
    ) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*", "/empresa/:path*", "/admin/:path*"],
};
