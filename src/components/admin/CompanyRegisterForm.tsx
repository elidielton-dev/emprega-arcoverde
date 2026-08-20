"use client";

import React, { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { formatCnpj, normalizeCnpj } from "@/lib/company/cnpj";

type LookupResult = {
  cnpj: string;
  name: string;
  tradeName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  sector: string;
};

const inputClass = "w-full px-3 py-2 rounded-xl border border-[#FEEDDF] text-sm";

export function CompanyRegisterForm({ needsInstitution }: { needsInstitution: boolean }) {
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Arcoverde");
  const [state, setState] = useState("PE");
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");

  async function lookupCnpj(raw: string) {
    const digits = normalizeCnpj(raw);
    if (digits.length !== 14) {
      setMessageType("err");
      setMessage("Digite os 14 dígitos do CNPJ para buscar.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/companies/cnpj-lookup?cnpj=${digits}`);
      const data = await res.json();
      if (!res.ok) {
        setMessageType("err");
        setMessage(data.error || "Não foi possível consultar o CNPJ.");
        return;
      }

      const result = data as LookupResult;
      setCnpj(result.cnpj || formatCnpj(digits));
      if (result.name) setName(result.name);
      if (result.tradeName) setTradeName(result.tradeName);
      if (result.email) setEmail(result.email);
      if (result.phone) setPhone(result.phone);
      if (result.address) setAddress(result.address);
      if (result.city) setCity(result.city);
      if (result.state) setState(result.state);
      if (result.sector) setSector(result.sector);

      setMessageType("ok");
      setMessage("Dados do CNPJ preenchidos. Revise antes de salvar.");
    } catch {
      setMessageType("err");
      setMessage("Falha na consulta. Preencha manualmente.");
    } finally {
      setLoading(false);
    }
  }

  function onCnpjChange(value: string) {
    const digits = normalizeCnpj(value).slice(0, 14);
    const next = digits.length === 14 ? formatCnpj(digits) : digits;
    setCnpj(next);
    if (digits.length === 14) {
      void lookupCnpj(digits);
    }
  }

  function onCnpjBlur() {
    const digits = normalizeCnpj(cnpj);
    if (digits.length === 14) {
      setCnpj(formatCnpj(digits));
      void lookupCnpj(digits);
    }
  }

  return (
    <form action="/api/admin/companies" method="POST" className="bg-white rounded-3xl border border-[#FEEDDF] p-6 space-y-4">
      <div>
        <label className="block text-xs font-bold text-[#57433C] mb-1">CNPJ</label>
        <div className="flex gap-2">
          <input
            name="cnpj"
            required
            value={cnpj}
            onChange={(e) => onCnpjChange(e.target.value)}
            onBlur={onCnpjBlur}
            placeholder="00.000.000/0001-00"
            inputMode="numeric"
            autoComplete="off"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => void lookupCnpj(cnpj)}
            disabled={loading || normalizeCnpj(cnpj).length !== 14}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1C1410] hover:bg-black disabled:opacity-50 text-white text-xs font-bold"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>
        <p className="text-[11px] text-[#78716c] mt-1">
          Ao digitar o CNPJ completo, os dados são buscados automaticamente.
        </p>
      </div>

      {message && (
        <p
          className={`text-sm rounded-xl px-4 py-3 border ${
            messageType === "ok"
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : "text-red-800 bg-red-50 border-red-200"
          }`}
        >
          {message}
        </p>
      )}

      <div>
        <label className="block text-xs font-bold text-[#57433C] mb-1">Razão social</label>
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-xs font-bold text-[#57433C] mb-1">Nome fantasia</label>
        <input name="tradeName" value={tradeName} onChange={(e) => setTradeName(e.target.value)} className={inputClass} />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">E-mail</label>
          <input type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Telefone</label>
          <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-[#57433C] mb-1">Endereço</label>
        <input name="address" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-[#57433C] mb-1">Cidade</label>
          <input name="city" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">UF</label>
          <input name="state" value={state} onChange={(e) => setState(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Setor</label>
          <input
            name="sector"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            placeholder="Comércio, serviços..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Responsável</label>
          <input name="contactName" className={inputClass} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-[#57433C] mb-1">Observações</label>
        <textarea name="notes" rows={3} className={inputClass} />
      </div>
      {needsInstitution && (
        <div>
          <label className="block text-xs font-bold text-[#57433C] mb-1">Instituição que cadastra</label>
          <select name="createdByInstitution" className={inputClass}>
            <option value="PREFEITURA">Prefeitura</option>
            <option value="ACA">ACA</option>
          </select>
        </div>
      )}
      <button type="submit" className="w-full bg-[#E65100] hover:bg-[#D84315] text-white font-bold text-sm py-3 rounded-xl">
        Salvar cadastro
      </button>
    </form>
  );
}
