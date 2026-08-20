import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: { token?: string; erro?: string };
}) {
  const invalidLink = searchParams.erro === "link_invalido" || !searchParams.token;
  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-[#F4F5F7] px-4 py-12">
      <section className="w-full max-w-md bg-white rounded-3xl border border-[#FEEDDF] p-6 sm:p-8 space-y-6 shadow-md">
        <BrandLogo className="justify-center" />
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-[#E65100]">Criar nova senha</h1>
          <p className="text-sm text-[#4B5563]">Use pelo menos 8 caracteres.</p>
        </div>
        {invalidLink ? (
          <div className="space-y-4">
            <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">
              Este link é inválido ou expirou. Solicite uma nova recuperação.
            </p>
            <Link href="/esqueci-a-senha" className="block text-center text-sm font-bold text-[#E65100]">
              Solicitar novo link
            </Link>
          </div>
        ) : (
          <form action="/api/auth/reset-password" method="POST" className="space-y-4">
            <input type="hidden" name="token" value={searchParams.token} />
            {searchParams.erro === "dados_invalidos" && (
              <p className="text-sm text-red-800">As senhas devem coincidir e ter pelo menos 8 caracteres.</p>
            )}
            <label className="block text-xs font-bold text-[#57433C]">
              Nova senha
              <input type="password" name="password" minLength={8} required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Confirmar nova senha
              <input type="password" name="passwordConfirmation" minLength={8} required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
            </label>
            <button className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl">
              Salvar nova senha
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
