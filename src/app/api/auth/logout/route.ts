import { NextRequest } from "next/server";
import { attachClearSessionCookie } from "@/lib/auth/session";
import { formRedirect } from "@/lib/http/form-redirect";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseCookieClient } from "@/lib/supabase/server";

async function signOutSupabase() {
  if (!isSupabaseConfigured()) return;
  try {
    const supabase = createSupabaseCookieClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Supabase signOut:", error);
  }
}

export async function POST(req: NextRequest) {
  await signOutSupabase();
  const response = formRedirect(new URL("/", req.url));
  attachClearSessionCookie(response);
  return response;
}

export async function GET(req: NextRequest) {
  await signOutSupabase();
  const response = formRedirect(new URL("/", req.url));
  attachClearSessionCookie(response);
  return response;
}
