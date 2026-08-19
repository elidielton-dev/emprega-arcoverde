import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabasePublicConfig } from "./config";

export type CookieToSet = { name: string; value: string; options?: CookieOptions };

export function createSupabaseRouteClient(
  request: NextRequest,
  cookieJar: CookieToSet[],
) {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase não configurado");
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          cookieJar.push({ name, value, options });
        });
      },
    },
  });
}

export function applySupabaseCookies(response: NextResponse, cookieJar: CookieToSet[]) {
  cookieJar.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });
}

export function createSupabaseCookieClient() {
  const config = getSupabasePublicConfig();
  if (!config) {
    throw new Error("Supabase não configurado");
  }

  const cookieStore = cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll em Server Component pode falhar; Route Handlers funcionam.
        }
      },
    },
  });
}
