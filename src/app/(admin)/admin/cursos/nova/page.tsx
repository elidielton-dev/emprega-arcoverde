import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canManageCourses } from "@/lib/auth/rbac";
import { PageHeader, SurfaceCard } from "@/components/admin/ui";

export default async function NovoCursoPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const session = await getSession();
  if (!session || !canManageCourses(session.role)) redirect("/admin");
  const providers = await prisma.courseProvider.findMany({ orderBy: { name: "asc" } });

  const inputClass =
    "mt-1 w-full rounded-md border border-[#E6E8EB] px-3 py-2.5 text-sm outline-none focus:border-[#E65100]";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cadastrar curso"
        description="Publique oportunidades oficiais de qualificação."
        actions={
          <Link href="/admin/cursos" className="text-xs font-bold text-[#78716c] hover:text-[#E65100]">
            Voltar aos cursos
          </Link>
        }
      />
      {searchParams.erro && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Preencha todos os campos obrigatórios.
        </p>
      )}
      <form action="/api/admin/courses" method="POST">
        <SurfaceCard className="space-y-4 p-5">
          <label className="block text-xs font-bold text-[#57433C]">
            Título *
            <input name="title" required maxLength={160} className={inputClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-[#57433C]">
              Provedor existente
              <select name="providerId" defaultValue="" className={`${inputClass} bg-white`}>
                <option value="">Criar pelo nome ao lado</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Novo provedor
              <input
                name="providerName"
                placeholder="Prefeitura, Senai..."
                className={inputClass}
              />
            </label>
          </div>
          <label className="block text-xs font-bold text-[#57433C]">
            Descrição *
            <textarea name="description" required rows={5} className={inputClass} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-[#57433C]">
              Modalidade
              <select name="modality" className={`${inputClass} bg-white`}>
                <option value="ONLINE">Online</option>
                <option value="PRESENCIAL">Presencial</option>
                <option value="HIBRIDO">Híbrido</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Link externo *
              <input type="url" name="externalUrl" required className={inputClass} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-bold text-[#57433C]">
              Início das inscrições
              <input type="date" name="enrollmentStart" className={inputClass} />
            </label>
            <label className="block text-xs font-bold text-[#57433C]">
              Fim das inscrições
              <input type="date" name="enrollmentEnd" className={inputClass} />
            </label>
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-[#E65100] py-3 text-sm font-bold text-white hover:bg-[#D84315]"
          >
            Publicar curso ativo
          </button>
        </SurfaceCard>
      </form>
    </div>
  );
}
