"use client";

import React, { useRef, useState } from "react";
import { Upload } from "lucide-react";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx)$/i;

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
    if (!file) {
      setFileName(null);
      return;
    }
    if (!ALLOWED.test(file.name)) {
      setError("Envie apenas PDF ou DOCX.");
      e.target.value = "";
      setFileName(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo acima de 5 MB.");
      e.target.value = "";
      setFileName(null);
      return;
    }
    setFileName(file.name);
    setError(null);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const file = inputRef.current?.files?.[0];
    if (!file || file.size === 0) {
      e.preventDefault();
      setError("Selecione um arquivo PDF ou DOCX antes de enviar.");
      return;
    }
    if (!ALLOWED.test(file.name)) {
      e.preventDefault();
      setError("Envie apenas PDF ou DOCX.");
      return;
    }
    if (file.size > MAX_BYTES) {
      e.preventDefault();
      setError("Arquivo acima de 5 MB.");
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
      <input
        ref={inputRef}
        type="file"
        name="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
        <p className="text-[11px] text-[#A8A29E]">Apenas PDF ou DOCX (até 5 MB)</p>
        {fileName ? (
          <p className="truncate rounded-lg border border-[#FEEDDF] bg-white px-3 py-2 text-[11px] font-semibold text-[#2E221F]">
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
        {submitting ? "Enviando e preenchendo…" : "Enviar e preencher formulário"}
      </button>
    </form>
  );
}
