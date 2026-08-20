import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageCourses } from "@/lib/auth/rbac";

export default async function NovoCursoPage({ searchParams }: { searchParams: { erro?: string } }) {
  const session = await getSession();
  if (!session || !canManageCourses(session.role)) redirect("/admin");
  const providers = await prisma.courseProvider.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <Link href="/admin/cursos" className="text-xs font-bold text-[#E65100]">← Voltar aos cursos</Link>
        <h1 className="text-2xl font-black text-[#2E221F] mt-2">Cadastrar curso</h1>
        <p className="text-sm text-[#78716c]">Publique oportunidades oficiais de qualificação.</p>
      </div>
      {searchParams.erro && <p className="text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl p-3">Preencha todos os campos obrigatórios.</p>}
      <form action="/api/admin/courses" method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 space-y-4">
        <label className="block text-xs font-bold text-[#57433C]">
          Título *
          <input name="title" required maxLength={160} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-[#57433C]">
            Provedor existente
            <select name="providerId" defaultValue="" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] bg-white text-base">
              <option value="">Criar pelo nome ao lado</option>
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            Novo provedor
            <input name="providerName" placeholder="Prefeitura, Senai..." className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
          </label>
        </div>
        <label className="block text-xs font-bold text-[#57433C]">
          Descrição *
          <textarea name="description" required rows={5} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-[#57433C]">
            Modalidade
            <select name="modality" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] bg-white text-base">
              <option value="ONLINE">Online</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-[#57433C]">
            Link externo *
            <input type="url" name="externalUrl" required className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-xs font-bold text-[#57433C]">Início das inscrições<input type="date" name="enrollmentStart" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" /></label>
          <label className="block text-xs font-bold text-[#57433C]">Fim das inscrições<input type="date" name="enrollmentEnd" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#FEEDDF] text-base" /></label>
        </div>
        <button className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl">Publicar curso ativo</button>
      </form>
    </main>
  );
}
