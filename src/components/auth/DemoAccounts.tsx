"use client";

import React from "react";

const DEMOS = [
  { email: "candidato.demo@demo.com", password: "senha123", label: "Candidato" },
  { email: "empresa.comercio@demo.com", password: "senha123", label: "Empresa" },
  { email: "operador.sala@demo.com", password: "senha123", label: "Sala" },
  { email: "admin.aca@demo.com", password: "senha123", label: "ACA" },
  { email: "admin.prefeitura@demo.com", password: "senha123", label: "Prefeitura" },
] as const;

export function DemoAccounts() {
  const fill = (email: string, password: string) => {
    const form = document.getElementById("login-form") as HTMLFormElement | null;
    if (!form) return;
    const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement | null;
    const passwordInput = form.querySelector('input[name="password"]') as HTMLInputElement | null;
    if (emailInput) emailInput.value = email;
    if (passwordInput) passwordInput.value = password;
  };

  return (
    <div className="pt-4 border-t border-[#FEEDDF] space-y-2">
      <p className="text-[11px] font-semibold text-[#78716c]">Contas de demonstração</p>
      <div className="grid grid-cols-2 gap-1.5">
        {DEMOS.map((demo) => (
          <button
            key={demo.email}
            type="button"
            onClick={() => fill(demo.email, demo.password)}
            className="p-2 rounded-xl bg-[#FFF8F2] hover:bg-[#FEEDDF] text-left text-[11px] font-medium text-[#57433C] border border-[#FEEDDF] transition"
          >
            {demo.label}
          </button>
        ))}
      </div>
    </div>
  );
}
