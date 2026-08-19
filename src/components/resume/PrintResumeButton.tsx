"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintResumeButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2 bg-[#1C1410] hover:bg-black text-white text-sm font-bold px-5 py-2.5 rounded-full"
    >
      <Printer className="w-4 h-4" aria-hidden="true" />
      Imprimir ou salvar PDF
    </button>
  );
}
