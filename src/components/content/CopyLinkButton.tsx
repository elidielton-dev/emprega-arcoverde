"use client";

import React, { useState } from "react";
import { Link2 } from "lucide-react";

export function CopyLinkButton() {
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
      className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] hover:text-[#E65100]"
    >
      <Link2 className="w-4 h-4" aria-hidden="true" />
      {copied ? "Link copiado" : "Copiar link"}
    </button>
  );
}
