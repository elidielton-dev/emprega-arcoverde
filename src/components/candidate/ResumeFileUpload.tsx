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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file || file.size === 0) {
      setError("Selecione um arquivo PDF ou DOCX antes de enviar.");
      return;
    }
    if (!ALLOWED.test(file.name)) {
      setError("Envie apenas PDF ou DOCX.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo acima de 5 MB.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const body = new FormData();
      body.set("documentType", "RESUME");
      body.set("file", file);

      const res = await fetch("/api/candidate/documents", {
        method: "POST",
        body,
        headers: {
          Accept: "application/json",
          "X-EA-Fetch": "1",
        },
      });

      const data = (await res.json().catch(() => null)) as {
        redirect?: string;
        erro?: string | null;
        ok?: boolean;
        message?: string;
        stage?: string;
      } | null;

      if (!data?.ok && data?.message) {
        console.warn("Upload error:", data.stage, data.message);
      }

      const target =
        data?.redirect ||
        (data?.erro
          ? `/painel/curriculo?erro=${data.erro}`
          : `/painel/curriculo?sucesso=preenchido`);

      window.location.href = target.includes("t=")
        ? target
        : `${target}${target.includes("?") ? "&" : "?"}t=${Date.now()}`;
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      setError("Falha ao enviar. Tente novamente.");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border-2 border-dashed border-[#FDCFA9] bg-[#FFF8F2] p-6 text-center"
    >
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
        <button type="button" onClick={onPick} className="text-xs font-bold text-[#E65100] hover:underline">
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
