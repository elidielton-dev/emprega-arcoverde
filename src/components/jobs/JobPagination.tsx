import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

function vagasHref(filters: Record<string, string>, pagina: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `/vagas?${query}` : "/vagas";
}

export function JobPagination({
  page,
  totalPages,
  filters,
}: {
  page: number;
  totalPages: number;
  filters: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-1 pt-2" aria-label="Paginação das vagas">
      {page > 1 ? (
        <Link
          href={vagasHref(filters, page - 1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#1A1A1A] hover:bg-[#F4F5F7]"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#9CA3AF]" aria-disabled="true">
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </span>
      )}

      {pages.map((n) =>
        n === page ? (
          <span
            key={n}
            aria-current="page"
            className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-full bg-[#1C1410] text-white text-sm font-bold"
          >
            {n}
          </span>
        ) : (
          <Link
            key={n}
            href={vagasHref(filters, n)}
            className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-full text-sm font-semibold text-[#1A1A1A] hover:bg-[#F4F5F7]"
          >
            {n}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link
          href={vagasHref(filters, page + 1)}
          className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#1A1A1A] hover:bg-[#F4F5F7]"
          aria-label="Próxima página"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </Link>
      ) : (
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full text-[#9CA3AF]" aria-disabled="true">
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
