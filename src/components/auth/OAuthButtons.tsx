import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface OAuthButtonsProps {
  next?: string;
  variant?: "dark" | "light";
  /** Override; por padrão detecta NEXT_PUBLIC_SUPABASE_* */
  enabled?: boolean;
}

export function OAuthButtons({ next = "", variant = "dark", enabled }: OAuthButtonsProps) {
  const show = enabled ?? isSupabaseConfigured();
  if (!show) return null;

  const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
  const isDark = variant === "dark";

  const googleClass = isDark
    ? "w-full flex items-center justify-center gap-3 bg-white text-[#1F1F1F] font-bold text-sm py-3 hover:bg-[#F4F5F7] transition"
    : "w-full flex items-center justify-center gap-3 bg-white text-[#1F1F1F] font-bold text-sm py-3 rounded-xl border border-[#E6E8EB] hover:bg-[#F4F5F7] transition";
  const linkedinClass = isDark
    ? "w-full flex items-center justify-center gap-3 bg-[#0A66C2] text-white font-bold text-sm py-3 hover:bg-[#004182] transition"
    : "w-full flex items-center justify-center gap-3 bg-[#0A66C2] text-white font-bold text-sm py-3 rounded-xl hover:bg-[#004182] transition";

  return (
    <div className="space-y-3">
      <Link href={`/api/auth/oauth?provider=google${nextQuery}`} className={googleClass}>
        <GoogleMark />
        Continuar com Google
      </Link>
      <Link href={`/api/auth/oauth?provider=linkedin_oidc${nextQuery}`} className={linkedinClass}>
        <LinkedInMark />
        Continuar com LinkedIn
      </Link>
      <div className={`relative py-1`}>
        <div className={`absolute inset-0 flex items-center`} aria-hidden>
          <div className={`w-full border-t ${isDark ? "border-[#3D271D]" : "border-[#FEEDDF]"}`} />
        </div>
        <p className="relative text-center text-xs bg-inherit">
          <span className={`${isDark ? "bg-[#1A1412] text-[#C4A574]" : "bg-white text-[#78716c]"} px-3`}>
            ou com e-mail e senha
          </span>
        </p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

function LinkedInMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
