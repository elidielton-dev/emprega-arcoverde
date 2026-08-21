"use client";

import React, { useState } from "react";
import { File, Trash2 } from "lucide-react";

type DocItem = {
  id: string;
  fileName: string;
  fileSize: number;
};

export function ResumeDocumentList({ documents }: { documents: DocItem[] }) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!documents.length) return null;

  const onRemove = async (id: string) => {
    if (removingId) return;
    const ok = window.confirm("Remover este arquivo de currículo? Você poderá enviar outro depois.");
    if (!ok) return;

    setRemovingId(id);
    setError(null);

    try {
      const res = await fetch("/api/candidate/documents", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ documentId: id }),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        redirect?: string;
        erro?: string;
      } | null;

      if (!res.ok || !data?.ok) {
        setError("Não foi possível remover o arquivo. Tente novamente.");
        setRemovingId(null);
        return;
      }

      window.location.href =
        data.redirect || `/painel/curriculo?sucesso=anexo_removido&t=${Date.now()}`;
    } catch {
      setError("Falha ao remover. Tente novamente.");
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <h3 className="text-xs font-bold text-[#57433C]">Seu currículo anexado:</h3>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[#FEEDDF] bg-stone-50 p-3.5 text-xs"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <File className="h-4 w-4 shrink-0 text-[#E65100]" />
              <span className="truncate font-semibold text-[#2E221F]">{doc.fileName}</span>
              <span className="shrink-0 text-[11px] text-[#A8A29E]">
                ({(doc.fileSize / 1024).toFixed(1)} KB)
              </span>
            </div>

            <button
              type="button"
              onClick={() => onRemove(doc.id)}
              disabled={removingId === doc.id}
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-red-600 hover:underline disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {removingId === doc.id ? "Removendo…" : "Remover"}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
