import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BriefcaseBusiness } from "lucide-react";
import { getSession } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db/prisma";

export default async function NovaVagaAdminPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const session = await getSession();
  if (!session || !isAdmin(session.role)) redirect("/entrar");

  const [companies, categories] = await Promise.all([
    prisma.company.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ tradeName: "asc" }, { name: "asc" }],
    }),
    prisma.jobCategory.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  const inputClass =
    "w-full rounded-xl border border-[#E7DDD7] bg-white px-3.5 py-2.5 text-sm text-[#2E221F] outline-none focus:border-[#E65100] focus:ring-2 focus:ring-[#FEEDDF]";
  const labelClass = "space-y-1.5 text-xs font-bold text-[#57433C]";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <Link href="/admin/vagas" className="inline-flex items-center gap-2 text-xs text-[#78716c] hover:text-[#E65100]">
        <ArrowLeft className="w-4 h-4" /> Voltar às vagas
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#2E221F]">Cadastrar vaga</h1>
        <p className="text-sm text-[#78716c]">Cadastro institucional realizado pela ACA/Prefeitura.</p>
      </div>

      {searchParams.erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível cadastrar a vaga. Revise os campos obrigatórios e tente novamente.
        </div>
      )}

      <form action="/api/admin/jobs" method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 sm:p-8 space-y-7 shadow-sm">
        <div className="flex items-center gap-3 border-b border-[#FEEDDF] pb-5">
          <span className="rounded-2xl bg-[#FEEDDF] p-3 text-[#E65100]"><BriefcaseBusiness className="w-5 h-5" /></span>
          <div>
            <h2 className="font-extrabold text-[#2E221F]">Dados da oportunidade</h2>
            <p className="text-xs text-[#78716c]">Campos com * são obrigatórios.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <label className={labelClass}>Empresa contratante *
            <select name="companyId" required className={inputClass} defaultValue="">
              <option value="" disabled>Selecione uma empresa ativa</option>
              {companies.map((company) => <option key={company.id} value={company.id}>{company.tradeName || company.name}</option>)}
            </select>
          </label>
          <label className={labelClass}>Categoria *
            <select name="categoryId" required className={inputClass} defaultValue="">
              <option value="" disabled>Selecione</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
        </div>

        <label className={labelClass}>Título da vaga *
          <input name="title" required maxLength={120} className={inputClass} />
        </label>
        <label className={labelClass}>Resumo *
          <textarea name="summary" required rows={3} className={inputClass} />
        </label>
        <label className={labelClass}>Descrição completa *
          <textarea name="description" required rows={7} className={inputClass} />
        </label>

        <div className="grid sm:grid-cols-3 gap-5">
          <label className={labelClass}>Tipo de contrato
            <select name="contractType" className={inputClass} defaultValue="CLT">
              <option value="CLT">CLT</option><option value="PJ">PJ</option><option value="ESTAGIO">Estágio</option>
              <option value="TEMPORARIO">Temporário</option><option value="APRENDIZ">Aprendiz</option>
            </select>
          </label>
          <label className={labelClass}>Modalidade
            <select name="workplaceType" className={inputClass} defaultValue="PRESENCIAL">
              <option value="PRESENCIAL">Presencial</option><option value="HIBRIDO">Híbrido</option><option value="REMOTO">Remoto</option>
            </select>
          </label>
          <label className={labelClass}>Quantidade de vagas
            <input name="vacanciesCount" type="number" min={1} defaultValue={1} className={inputClass} />
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <label className={labelClass}>Cidade
            <input name="city" defaultValue="Arcoverde" className={inputClass} />
          </label>
          <label className={labelClass}>Estado
            <input name="state" defaultValue="PE" maxLength={2} className={inputClass} />
          </label>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <label className={labelClass}>Escolaridade
            <select name="educationLevel" className={inputClass} defaultValue="MEDIO">
              <option value="FUNDAMENTAL">Fundamental</option><option value="MEDIO">Médio</option><option value="TECNICO">Técnico</option>
              <option value="SUPERIOR">Superior</option><option value="POS">Pós-graduação</option>
            </select>
          </label>
          <label className={labelClass}>Experiência
            <select name="experienceRequired" className={inputClass} defaultValue="SEM_EXPERIENCIA">
              <option value="SEM_EXPERIENCIA">Sem experiência</option><option value="6_MESES">6 meses</option>
              <option value="1_ANO">1 ano</option><option value="2_ANOS">2 anos</option><option value="3_ANOS_MAIS">3 anos ou mais</option>
            </select>
          </label>
          <label className={labelClass}>CNH
            <select name="driverLicense" className={inputClass} defaultValue="NENHUMA">
              <option value="NENHUMA">Não exigida</option>{["A", "B", "AB", "C", "D", "E"].map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>

        <label className={labelClass}>Requisitos
          <textarea name="requirements" rows={4} className={inputClass} />
        </label>
        <label className={labelClass}>Competências (separadas por vírgula)
          <input name="skillsText" className={inputClass} />
        </label>
        <label className={labelClass}>Prazo para candidatura
          <input name="applicationDeadline" type="date" className={inputClass} />
        </label>

        <div className="rounded-2xl bg-[#FFF8F2] border border-[#FEEDDF] p-4 space-y-3 text-sm text-[#57433C]">
          <label className="flex items-center gap-2"><input name="isConfidential" type="checkbox" className="accent-[#E65100]" /> Empresa confidencial para candidatos</label>
          <label className="flex items-center gap-2 font-bold"><input name="publishNow" type="checkbox" defaultChecked className="accent-[#E65100]" /> Publicar imediatamente</label>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/vagas" className="rounded-xl border border-[#E7DDD7] px-5 py-3 text-xs font-bold text-[#57433C]">Cancelar</Link>
          <input type="hidden" name="actionType" value="CREATE" />
          <button className="rounded-xl bg-[#E65100] hover:bg-[#D84315] px-6 py-3 text-xs font-bold text-white shadow-md">
            Cadastrar vaga
          </button>
        </div>
      </form>
    </div>
  );
}
