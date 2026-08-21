"use client";

import React, { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { PageHeader, PrimaryButton, StatusPill, SurfaceCard } from "@/components/admin/ui";

export type LinkRow = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  order: number;
  isActive: boolean;
};

type Props = { links: LinkRow[]; sucesso?: string; erro?: string };

export function LinksBoard({ links, sucesso, erro }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Links úteis"
        description="Portais oficiais exibidos em /links-uteis."
        actions={
          <PrimaryButton type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            Novo link
          </PrimaryButton>
        }
      />

      {sucesso && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          Alteração salva.
        </div>
      )}
      {erro && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800">
          Não foi possível salvar.
        </div>
      )}

      {showForm && (
        <SurfaceCard className="p-5">
          <form action="/api/admin/links" method="POST" className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="action" value="CREATE" />
            <input name="title" required placeholder="Título" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm sm:col-span-2" />
            <input name="url" required placeholder="https://" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm sm:col-span-2" />
            <input name="category" placeholder="Categoria" defaultValue="Cidadão" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm" />
            <input name="order" type="number" defaultValue={0} className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm" />
            <textarea name="description" required rows={2} placeholder="Descrição" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm sm:col-span-2" />
            <PrimaryButton type="submit" className="sm:col-span-2 sm:w-fit">
              Salvar link
            </PrimaryButton>
          </form>
        </SurfaceCard>
      )}

      <SurfaceCard className="overflow-hidden">
        <ul className="divide-y divide-[#E6E8EB]">
          {links.length === 0 ? (
            <li className="px-4 py-10 text-center text-xs text-[#78716c]">
              <Link2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Nenhum link cadastrado.
            </li>
          ) : (
            links.map((l) => (
              <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1C1410]">{l.title}</p>
                  <p className="truncate text-[11px] text-[#78716c]">
                    {l.category} · {l.url}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill label={l.isActive ? "Ativo" : "Inativo"} tone={l.isActive ? "success" : "neutral"} />
                  <form action="/api/admin/links" method="POST">
                    <input type="hidden" name="action" value="TOGGLE" />
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="text-xs font-bold text-[#E65100] hover:underline">
                      {l.isActive ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                  <form action="/api/admin/links" method="POST">
                    <input type="hidden" name="action" value="DELETE" />
                    <input type="hidden" name="id" value={l.id} />
                    <button type="submit" className="rounded-md p-1.5 text-[#78716c] hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </SurfaceCard>
    </div>
  );
}
