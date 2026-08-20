"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

export function MarkAllReadButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ all: true }),
          });
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-xs font-semibold text-[#1C1410] hover:border-[#E65100]/40 disabled:opacity-60"
    >
      <CheckCheck className="h-3.5 w-3.5 text-[#E65100]" />
      {busy ? "Marcando…" : "Marcar todas como lidas"}
    </button>
  );
}
