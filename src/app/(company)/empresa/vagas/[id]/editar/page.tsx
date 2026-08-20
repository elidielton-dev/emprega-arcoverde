import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clock3 } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { isWithinCompanyEditWindow } from "@/lib/jobs/edit-window";


export default async function EditarVagaEmpresaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { erro?: string };
}) {
  const session = await getSession();
  if (!session || session.role !== "COMPANY_MEMBER") redirect("/entrar");

  const [job, categories] = await Promise.all([
    prisma.job.findFirst({
      where: { id: params.id, company: { members: { some: { userId: session.userId } } } },
      include: { changeRequests: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
    prisma.jobCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);
  if (!job) redirect("/empresa/vagas");

  const canEdit = isWithinCompanyEditWindow(job.createdAt);
  const inputClass = "w-full rounded-xl border border-[#E7DDD7] px-3.5 py-2.5 text-sm outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#FEEDDF]";
  const labelClass = "space-y-1.5 text-xs font-bold text-[#57433C]";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <Link href="/empresa/vagas" className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100]">
        <ArrowLeft className="w-4 h-4" /> Voltar às vagas
      </Link>
      <div>
        <h1 className="text-2xl font-black text-[#2E221F]">{canEdit ? "Editar vaga" : "Solicitar alteração"}</h1>
        <p className="text-sm text-[#78716c]">
          {canEdit ? "A empresa pode corrigir os dados nas primeiras 12 horas após o cadastro." : "O prazo de edição direta terminou. Envie a solicitação para análise da ACA/Prefeitura."}
        </p>
      </div>

      {searchParams.erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível concluir. Preencha os campos obrigatórios ou utilize a solicitação de alteração.
        </div>
      )}

      {canEdit ? (
        <form action={`/api/company/jobs/${job.id}`} method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 rounded-2xl bg-[#FFF8F2] p-4 text-xs text-[#57433C]">
            <Clock3 className="w-4 h-4 text-[#E65100]" /> Janela de edição direta ativa.
          </div>
          <label className={labelClass}>Título *
            <input name="title" required defaultValue={job.title} className={inputClass} />
          </label>
          <label className={labelClass}>Categoria
            <select name="categoryId" defaultValue={job.categoryId} className={inputClass}>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Resumo *
            <textarea name="summary" required rows={3} defaultValue={job.summary} className={inputClass} />
          </label>
          <label className={labelClass}>Descrição *
            <textarea name="description" required rows={7} defaultValue={job.description} className={inputClass} />
          </label>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className={labelClass}>Contrato
              <select name="contractType" defaultValue={job.contractType} className={inputClass}>
                <option value="CLT">CLT</option><option value="PJ">PJ</option><option value="ESTAGIO">Estágio</option><option value="TEMPORARIO">Temporário</option><option value="APRENDIZ">Aprendiz</option>
              </select>
            </label>
            <label className={labelClass}>Modalidade
              <select name="workplaceType" defaultValue={job.workplaceType} className={inputClass}>
                <option value="PRESENCIAL">Presencial</option><option value="HIBRIDO">Híbrido</option><option value="REMOTO">Remoto</option>
              </select>
            </label>
            <label className={labelClass}>Vagas
              <input name="vacanciesCount" type="number" min={1} defaultValue={job.vacanciesCount} className={inputClass} />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className={labelClass}>Cidade<input name="city" defaultValue={job.city} className={inputClass} /></label>
            <label className={labelClass}>Estado<input name="state" defaultValue={job.state} maxLength={2} className={inputClass} /></label>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <label className={labelClass}>Escolaridade
              <select name="educationLevel" defaultValue={job.educationLevel} className={inputClass}>
                <option value="FUNDAMENTAL">Fundamental</option><option value="MEDIO">Médio</option><option value="TECNICO">Técnico</option><option value="SUPERIOR">Superior</option><option value="POS">Pós</option>
              </select>
            </label>
            <label className={labelClass}>Experiência
              <select name="experienceRequired" defaultValue={job.experienceRequired || "SEM_EXPERIENCIA"} className={inputClass}>
                <option value="SEM_EXPERIENCIA">Sem experiência</option><option value="6_MESES">6 meses</option><option value="1_ANO">1 ano</option><option value="2_ANOS">2 anos</option><option value="3_ANOS_MAIS">3 anos ou mais</option>
              </select>
            </label>
            <label className={labelClass}>CNH
              <select name="driverLicense" defaultValue={job.driverLicense || "NENHUMA"} className={inputClass}>
                <option value="NENHUMA">Não exigida</option>{["A", "B", "AB", "C", "D", "E"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <label className={labelClass}>Requisitos<textarea name="requirements" rows={4} defaultValue={job.requirements || ""} className={inputClass} /></label>
          <label className={labelClass}>Competências<input name="skillsText" defaultValue={job.skillsText || ""} className={inputClass} /></label>
          <label className={labelClass}>Prazo para candidatura
            <input name="applicationDeadline" type="date" defaultValue={job.applicationDeadline?.toISOString().slice(0, 10) || ""} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-[#57433C]"><input name="isConfidential" type="checkbox" defaultChecked={job.isConfidential} className="accent-[#E65100]" /> Vaga confidencial</label>
          <div className="flex justify-end"><button className="rounded-xl bg-[#E65100] px-6 py-3 text-xs font-bold text-white hover:bg-[#D84315]">Salvar alterações</button></div>
        </form>
      ) : (
        <div className="space-y-4">
          <form action={`/api/company/jobs/${job.id}/change-request`} method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 sm:p-8 space-y-4">
            <label className={labelClass}>Descreva todas as alterações necessárias *
              <textarea name="message" required rows={8} className={inputClass} placeholder="Ex.: alterar o prazo para..., corrigir o requisito..." />
            </label>
            <div className="flex justify-end"><button className="rounded-xl bg-[#E65100] px-6 py-3 text-xs font-bold text-white">Enviar solicitação</button></div>
          </form>
          {job.changeRequests.length > 0 && (
            <div className="rounded-3xl border border-[#FEEDDF] bg-white p-6 space-y-3">
              <h2 className="text-sm font-extrabold text-[#2E221F]">Solicitações recentes</h2>
              {job.changeRequests.map((request) => <div key={request.id} className="border-t border-[#FEEDDF] pt-3 text-xs"><b>{request.status}</b> — {request.message}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
