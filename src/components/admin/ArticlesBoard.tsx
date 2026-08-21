"use client";

import React, { useState } from "react";
import { Newspaper, Plus, Trash2 } from "lucide-react";
import {
  PageHeader,
  PrimaryButton,
  StatusPill,
  SurfaceCard,
} from "@/components/admin/ui";

export type ArticleRow = {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: string;
  categoryName: string;
  authorName: string;
  readTimeMinutes: number;
  publishedAt: string | null;
};

type Props = { articles: ArticleRow[]; sucesso?: string; erro?: string };

export function ArticlesBoard({ articles, sucesso, erro }: Props) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Conteúdos"
        description="Artigos e dicas publicados no portal público."
        actions={
          <PrimaryButton type="button" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-3.5 w-3.5" />
            {showForm ? "Fechar formulário" : "Novo artigo"}
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
          Não foi possível salvar. Verifique os campos.
        </div>
      )}

      {showForm && (
        <SurfaceCard className="p-5">
          <form action="/api/admin/articles" method="POST" className="space-y-3">
            <input type="hidden" name="action" value="CREATE" />
            <h3 className="text-sm font-bold text-[#1C1410]">Novo artigo</h3>
            <input
              name="title"
              required
              placeholder="Título"
              className="w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
            />
            <input
              name="categoryName"
              placeholder="Categoria (ex.: Currículo)"
              className="w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
            />
            <textarea
              name="summary"
              required
              rows={2}
              placeholder="Resumo"
              className="w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
            />
            <textarea
              name="content"
              required
              rows={8}
              placeholder="Conteúdo (texto ou markdown simples)"
              className="w-full rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-3">
              <select name="status" className="rounded-md border border-[#E6E8EB] px-3 py-2 text-sm">
                <option value="PUBLISHED">Publicado</option>
                <option value="DRAFT">Rascunho</option>
              </select>
              <input
                name="readTimeMinutes"
                type="number"
                min={1}
                defaultValue={3}
                className="w-24 rounded-md border border-[#E6E8EB] px-3 py-2 text-sm"
              />
              <PrimaryButton type="submit">Publicar</PrimaryButton>
            </div>
          </form>
        </SurfaceCard>
      )}

      <SurfaceCard className="overflow-hidden">
        <ul className="divide-y divide-[#E6E8EB]">
          {articles.length === 0 ? (
            <li className="px-4 py-10 text-center text-xs text-[#78716c]">
              <Newspaper className="mx-auto mb-2 h-8 w-8 opacity-40" />
              Nenhum artigo cadastrado.
            </li>
          ) : (
            articles.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1C1410]">{a.title}</p>
                  <p className="text-[11px] text-[#78716c]">
                    {a.categoryName} · {a.readTimeMinutes} min · {a.authorName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={a.status === "PUBLISHED" ? "Publicado" : a.status}
                    tone={a.status === "PUBLISHED" ? "success" : "neutral"}
                  />
                  {a.status !== "PUBLISHED" && (
                    <form action="/api/admin/articles" method="POST">
                      <input type="hidden" name="action" value="SET_STATUS" />
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="PUBLISHED" />
                      <button type="submit" className="text-xs font-bold text-[#E65100] hover:underline">
                        Publicar
                      </button>
                    </form>
                  )}
                  {a.status === "PUBLISHED" && (
                    <form action="/api/admin/articles" method="POST">
                      <input type="hidden" name="action" value="SET_STATUS" />
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="status" value="ARCHIVED" />
                      <button type="submit" className="text-xs font-semibold text-[#78716c] hover:underline">
                        Arquivar
                      </button>
                    </form>
                  )}
                  <form action="/api/admin/articles" method="POST">
                    <input type="hidden" name="action" value="DELETE" />
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="rounded-md p-1.5 text-[#78716c] hover:bg-red-50 hover:text-red-600" title="Excluir">
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
