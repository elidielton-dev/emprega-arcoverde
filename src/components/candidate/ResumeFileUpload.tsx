"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";

export function ResumeFileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onPick = () => {
    setError(null);
    inputRef.current?.click();
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFileName(file ? file.name : null);
    setError(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const file = inputRef.current?.files?.[0];
    if (!file || file.size === 0) {
      e.preventDefault();
      setError("Selecione um arquivo antes de enviar.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      e.preventDefault();
      setError("Arquivo acima de 10 MB.");
      return;
    }
    setSubmitting(true);
  };

  return (
    <form
      action="/api/candidate/documents"
      method="POST"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border-2 border-dashed border-[#FDCFA9] bg-[#FFF8F2] p-6 text-center"
    >
      <input type="hidden" name="documentType" value="RESUME" />
      {/* Input acessível sem display:none — evita submit silencioso do HTML5 required */}
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf"
        className="sr-only"
        onChange={onChange}
      />

      <div className="mx-auto max-w-xs space-y-2">
        <Upload className="mx-auto h-8 w-8 text-[#E65100]" aria-hidden />
        <button
          type="button"
          onClick={onPick}
          className="text-xs font-bold text-[#E65100] hover:underline"
        >
          Clique para selecionar um arquivo
        </button>
        <p className="text-[11px] text-[#A8A29E]">Formatos: PDF, DOCX, PNG ou JPG (até 10MB)</p>
        {fileName ? (
          <p className="truncate rounded-lg bg-white px-3 py-2 text-[11px] font-semibold text-[#2E221F] border border-[#FEEDDF]">
            {fileName}
          </p>
        ) : (
          <p className="text-[11px] text-[#78716c]">Nenhum arquivo selecionado</p>
        )}
      </div>

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-[#2E221F] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#1F1614] disabled:opacity-60"
      >
        {submitting ? "Enviando…" : "Enviar Arquivo de Currículo"}
      </button>
    </form>
  );
}
