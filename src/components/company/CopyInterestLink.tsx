"use client";

import React, { useState } from "react";
import { Link2 } from "lucide-react";

export function CopyInterestLink({ className = "" }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center justify-center gap-2 font-bold text-sm px-5 py-3 rounded-full border border-[#E6E8EB] bg-white hover:bg-[#F4F5F7] text-[#1A1A1A] ${className}`}
    >
      <Link2 className="w-4 h-4" aria-hidden="true" />
      {copied ? "Link copiado" : "Copiar este link"}
    </button>
  );
}
