import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Search, Briefcase, MapPin, Filter } from "lucide-react";
import { JobCard } from "@/components/jobs/JobCard";
import { JobPagination } from "@/components/jobs/JobPagination";
import { containsInsensitive } from "@/lib/db/search";
import { withDb } from "@/lib/db/safe";

const PAGE_SIZE = 6;

interface VagasPageProps {
  searchParams: {
    q?: string;
    cidade?: string;
    categoria?: string;
    modalidade?: string;
    contrato?: string;
    escolaridade?: string;
    cnh?: string;
    pagina?: string;
  };
}

export default async function VagasPage({ searchParams }: VagasPageProps) {
  const query = searchParams.q?.trim() || "";
  const cidade = searchParams.cidade?.trim() || "";
  const categoriaSlug = searchParams.categoria || "";
  const modalidade = searchParams.modalidade || "";
  const contrato = searchParams.contrato || "";
  const escolaridade = searchParams.escolaridade || "";
  const cnh = searchParams.cnh || "";
  const requestedPage = Math.max(1, Number.parseInt(searchParams.pagina || "1", 10) || 1);

  // Filtros dinâmicos no banco
  const where: any = {
    status: "PUBLISHED",
    OR: [
      { applicationDeadline: null },
      { applicationDeadline: { gte: new Date() } },
    ],
  };

  if (query) {
    where.AND = [
      {
        OR: [
          { title: containsInsensitive(query) },
          { summary: containsInsensitive(query) },
          { requirements: containsInsensitive(query) },
          { skillsText: containsInsensitive(query) },
        ],
      },
    ];
  }

  if (cidade) {
    where.city = containsInsensitive(cidade);
  }

  if (categoriaSlug) {
    where.category = { slug: categoriaSlug };
  }

  if (modalidade) {
    where.workplaceType = modalidade;
  }

  if (contrato) {
    where.contractType = contrato;
  }

  if (escolaridade) {
    where.educationLevel = escolaridade;
  }

  if (cnh && cnh !== "TODAS") {
    where.driverLicense = cnh;
  }

  const [total, categories] = await withDb(
    () =>
      Promise.all([
        prisma.job.count({ where }),
        prisma.jobCategory.findMany({ orderBy: { order: "asc" } }),
      ]),
    [0, []],
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const jobs = await withDb(
    () =>
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              tradeName: true,
              city: true,
            },
          },
          category: true,
          _count: { select: { applications: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
    [],
  );

  const filters = {
    q: query,
    cidade,
    categoria: categoriaSlug,
    modalidade,
    contrato,
    escolaridade,
    cnh: cnh && cnh !== "TODAS" ? cnh : "",
  };

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-[#E65100] tracking-tight">
          Vagas de Emprego em Arcoverde
        </h1>
        <p className="text-sm text-[#4B5563]">
          Explore todas as oportunidades de trabalho cadastradas e moderadas pelas empresas e pela ACA.
        </p>
      </div>

      {/* Formulário de Busca e Filtros */}
      <form method="GET" action="/vagas" className="bg-white p-6 rounded-2xl border border-[#E6E8EB] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-[#E65100] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar por título, palavra-chave ou habilidade..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E6E8EB] text-sm text-[#1A1A1A] placeholder-[#9CA3AF] bg-[#F4F5F7] focus:outline-none focus:border-[#E65100]"
            />
          </div>
          <div className="sm:w-48 relative">
            <MapPin className="w-5 h-5 text-[#E65100] absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              name="cidade"
              defaultValue={cidade}
              placeholder="Cidade"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E6E8EB] text-sm text-[#1A1A1A] placeholder-[#9CA3AF] bg-[#F4F5F7] focus:outline-none focus:border-[#E65100]"
            />
          </div>
          <button
            type="submit"
            className="bg-[#1C1410] hover:bg-black text-white font-semibold text-sm px-6 py-3 rounded-full flex items-center justify-center gap-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtrar Vagas</span>
          </button>
        </div>

        {/* Linha de Filtros Adicionais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E6E8EB]">
          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Área / Categoria</label>
            <select
              name="categoria"
              defaultValue={categoriaSlug}
              className="w-full text-xs p-2 rounded-lg border border-[#E6E8EB] bg-[#F4F5F7] text-[#1A1A1A] focus:outline-none"
            >
              <option value="">Todas as áreas</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Modalidade</label>
            <select
              name="modalidade"
              defaultValue={modalidade}
              className="w-full text-xs p-2 rounded-lg border border-[#E6E8EB] bg-[#F4F5F7] text-[#1A1A1A] focus:outline-none"
            >
              <option value="">Todas</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="HIBRIDO">Híbrido</option>
              <option value="REMOTO">Remoto</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Tipo de Contrato</label>
            <select
              name="contrato"
              defaultValue={contrato}
              className="w-full text-xs p-2 rounded-lg border border-[#E6E8EB] bg-[#F4F5F7] text-[#1A1A1A] focus:outline-none"
            >
              <option value="">Todos</option>
              <option value="CLT">CLT (Carteira Assinada)</option>
              <option value="ESTAGIO">Estágio</option>
              <option value="APRENDIZ">Jovem Aprendiz</option>
              <option value="TEMPORARIO">Temporário</option>
              <option value="PJ">PJ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#374151] mb-1">Escolaridade</label>
            <select
              name="escolaridade"
              defaultValue={escolaridade}
              className="w-full text-xs p-2 rounded-lg border border-[#E6E8EB] bg-[#F4F5F7] text-[#1A1A1A] focus:outline-none"
            >
              <option value="">Qualquer escolaridade</option>
              <option value="FUNDAMENTAL">Ensino Fundamental</option>
              <option value="MEDIO">Ensino Médio</option>
              <option value="TECNICO">Ensino Técnico</option>
              <option value="SUPERIOR">Ensino Superior</option>
              <option value="POS">Pós-graduação</option>
            </select>
          </div>
        </div>
      </form>

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#4B5563]">
          <span>
            {total === 0
              ? "Nenhuma vaga encontrada"
              : `Exibindo ${from}–${to} de ${total} ${total === 1 ? "vaga" : "vagas"}`}
          </span>
          {(query || categoriaSlug || modalidade || contrato || escolaridade || cidade) && (
            <Link href="/vagas" className="text-[#E65100] hover:underline font-semibold">
              Limpar todos os filtros
            </Link>
          )}
        </div>

        {total === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E6E8EB] text-center max-w-md mx-auto space-y-3">
            <Briefcase className="w-12 h-12 text-[#E65100] mx-auto" />
            <h3 className="text-base font-bold text-[#1A1A1A]">Nenhuma vaga encontrada para estes filtros</h3>
            <p className="text-xs text-[#4B5563]">
              Tente remover alguns filtros ou buscar por termos mais amplos. Você também pode cadastrar seu currículo para receber novas oportunidades.
            </p>
            <Link
              href="/cadastro"
              className="inline-block bg-[#1C1410] text-white text-xs font-bold px-4 py-2 rounded-full"
            >
              Cadastrar Currículo
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
            <JobPagination page={page} totalPages={totalPages} filters={filters} />
          </>
        )}
      </div>

      <section className="bg-white rounded-2xl border border-[#E6E8EB] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:items-center">
        <div className="w-12 h-12 rounded-full bg-[#F4F5F7] flex items-center justify-center shrink-0">
          <MapPin className="w-6 h-6 text-[#1A1A1A]" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-[#E65100]">Não consegue fazer o cadastro pela internet?</h2>
          <p className="text-sm text-[#4B5563] mt-1 leading-relaxed">
            Vá à Sala do Empreendedor ou à ACA. O cadastro assistido é gratuito: montamos o currículo com você.
          </p>
        </div>
        <Link
          href="/contato"
          className="shrink-0 inline-flex justify-center bg-[#1C1410] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full"
        >
          Ver endereço
        </Link>
      </section>
    </div>
  );
}
