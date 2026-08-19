import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { UserRole } from "./rbac";

const SECRET_KEY = process.env.AUTH_SECRET || "emprega-arcoverde-jwt-secret-key-2026";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string;
  expiresAt?: number;
}

const COOKIE_NAME = "ea_auth_session";

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signToken(payload);
  cookies().set(COOKIE_NAME, token, cookieOptions);
}

/** Anexa o cookie na resposta do redirect (Route Handler). cookies().set() sozinho costuma se perder no 303. */
export async function attachSessionCookie(response: NextResponse, payload: SessionPayload) {
  const token = await signToken(payload);
  response.cookies.set(COOKIE_NAME, token, cookieOptions);
  return response;
}

export function attachClearSessionCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
