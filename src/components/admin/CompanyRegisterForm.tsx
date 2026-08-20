"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Search, Shield } from "lucide-react";
import { formatCnpj, normalizeCnpj } from "@/lib/company/cnpj";
import { PageHeader, SurfaceCard } from "@/components/admin/ui";

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

const inputClass =
  "w-full rounded-md border border-[#E6E8EB] bg-white px-3 py-2 text-sm text-[#1C1410] outline-none focus:border-[#E65100]";

const STEPS = [
  "Dados cadastrais",
  "Contato e endereço",
  "Responsável",
  "Revisão e consentimento",
] as const;

export function CompanyRegisterForm({
  needsInstitution,
  operatorName,
}: {
  needsInstitution: boolean;
  operatorName?: string;
}) {
  const [step, setStep] = useState(0);
  const [cnpj, setCnpj] = useState("");
  const [name, setName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Arcoverde");
  const [state, setState] = useState("PE");
  const [sector, setSector] = useState("");
  const [contactName, setContactName] = useState("");
  const [notes, setNotes] = useState("");
  const [institution, setInstitution] = useState("PREFEITURA");
  const [loading, setLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"ok" | "err">("ok");
  const lastLookupRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cnpjOk = normalizeCnpj(cnpj).length === 14;

  const checklist = useMemo(
    () => [
      {
        ok: lookedUp || cnpjOk,
        title: "CNPJ válido",
        hint: lookedUp ? "CNPJ consultado com sucesso" : cnpjOk ? "CNPJ informado" : "Consulte o CNPJ",
      },
      {
        ok: Boolean(name.trim()),
        title: "Empresa ainda não cadastrada",
        hint: name.trim() ? "Razão social preenchida" : "Preencha a razão social",
      },
      {
        ok: true,
        title: "Instituição autorizada",
        hint: "Você tem permissão para cadastrar",
      },
      {
        ok: Boolean(contactName.trim()) || step < 2,
        title: "Contato do responsável",
        hint: contactName.trim()
          ? "Responsável informado"
          : "Campo a ser preenchido na etapa de responsável",
      },
    ],
    [lookedUp, cnpjOk, name, contactName, step],
  );

  async function lookupCnpj(raw: string, force = false) {
    const digits = normalizeCnpj(raw);
    if (digits.length !== 14) {
      setMessageType("err");
      setMessage("Digite os 14 dígitos do CNPJ para buscar.");
      return;
    }
    if (!force && lastLookupRef.current === digits) return;

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

      lastLookupRef.current = digits;
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
      setLookedUp(true);
      setMessageType("ok");
      setMessage("Dados encontrados. Revise antes de salvar.");
    } catch {
      setMessageType("err");
      setMessage("Falha na consulta. Preencha manualmente.");
    } finally {
      setLoading(false);
    }
  }

  function scheduleLookup(digits: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void lookupCnpj(digits);
    }, 500);
  }

  function onCnpjChange(value: string) {
    const digits = normalizeCnpj(value).slice(0, 14);
    const next = digits.length === 14 ? formatCnpj(digits) : digits;
    setCnpj(next);
    if (digits.length === 14) scheduleLookup(digits);
    else {
      lastLookupRef.current = "";
      setLookedUp(false);
    }
  }

  function canGoNext() {
    if (step === 0) return cnpjOk && Boolean(name.trim());
    if (step === 1) return Boolean(city.trim());
    if (step === 2) return true;
    return true;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cadastrar empresa"
        description="Registre uma empresa parceira em nome da instituição autorizada."
        actions={
          <Link href="/admin/empresas" className="text-xs font-bold text-[#78716c] hover:text-[#E65100]">
            Cancelar
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-[#E6E8EB] pb-3">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold transition ${
              i === step
                ? "bg-[#FFF4EA] text-[#E65100] shadow-[inset_0_-2px_0_0_#E65100]"
                : i < step
                  ? "text-[#1C1410]"
                  : "text-[#78716c]"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                i === step
                  ? "bg-[#1C1410] text-white"
                  : i < step
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-[#F4F5F7] text-[#78716c]"
              }`}
            >
              {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            {label}
          </button>
        ))}
      </div>

      <form action="/api/admin/companies" method="POST">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <SurfaceCard className="space-y-4 p-5">
            {step === 0 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Dados da empresa</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">CNPJ</label>
                  <div className="flex gap-2">
                    <input
                      name="cnpj"
                      required
                      value={cnpj}
                      onChange={(e) => onCnpjChange(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      inputMode="numeric"
                      className={inputClass}
                    />
                    <button
                      type="button"
                      onClick={() => void lookupCnpj(cnpj, true)}
                      disabled={loading || !cnpjOk}
                      className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[#E65100] px-3 py-2 text-xs font-bold text-[#E65100] hover:bg-[#FFF4EA] disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      Consultar CNPJ
                    </button>
                  </div>
                  {lookedUp && (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      <Check className="h-3 w-3" /> Dados encontrados
                    </span>
                  )}
                </div>
                {message && (
                  <p
                    className={`rounded-md border px-3 py-2 text-xs ${
                      messageType === "ok"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-800"
                    }`}
                  >
                    {message}
                  </p>
                )}
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Razão social</label>
                  <input
                    name="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Nome fantasia</label>
                  <input
                    name="tradeName"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Setor de atuação</label>
                  <input
                    name="sector"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    placeholder="Comércio, serviços..."
                    className={inputClass}
                  />
                </div>
                {needsInstitution && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">
                      Instituição que cadastra
                    </label>
                    <select
                      name="createdByInstitution"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className={inputClass}
                    >
                      <option value="PREFEITURA">Prefeitura</option>
                      <option value="ACA">ACA</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Contato e endereço</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">E-mail</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Telefone</label>
                    <input
                      name="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Endereço</label>
                  <input
                    name="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">Cidade</label>
                    <input
                      name="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-[#57433C]">UF</label>
                    <input
                      name="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Responsável</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Nome do responsável</label>
                  <input
                    name="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#57433C]">Observações</label>
                  <textarea
                    name="notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {operatorName && (
                  <p className="text-[11px] text-[#78716c]">
                    Operador responsável: <strong className="text-[#1C1410]">{operatorName}</strong>
                  </p>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <h3 className="text-sm font-bold text-[#1C1410]">Revisão e consentimento</h3>
                <dl className="space-y-2 rounded-md bg-[#F4F5F7] p-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">CNPJ</dt>
                    <dd className="font-semibold text-[#1C1410]">{cnpj || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Razão social</dt>
                    <dd className="font-semibold text-[#1C1410]">{name || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Fantasia</dt>
                    <dd className="font-semibold text-[#1C1410]">{tradeName || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Cidade</dt>
                    <dd className="font-semibold text-[#1C1410]">
                      {city}/{state}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-[#78716c]">Responsável</dt>
                    <dd className="font-semibold text-[#1C1410]">{contactName || "—"}</dd>
                  </div>
                </dl>
                {/* Hidden fields so POST always has all values regardless of step */}
                <input type="hidden" name="cnpj" value={cnpj} />
                <input type="hidden" name="name" value={name} />
                <input type="hidden" name="tradeName" value={tradeName} />
                <input type="hidden" name="email" value={email} />
                <input type="hidden" name="phone" value={phone} />
                <input type="hidden" name="address" value={address} />
                <input type="hidden" name="city" value={city} />
                <input type="hidden" name="state" value={state} />
                <input type="hidden" name="sector" value={sector} />
                <input type="hidden" name="contactName" value={contactName} />
                <input type="hidden" name="notes" value={notes} />
                {needsInstitution && (
                  <input type="hidden" name="createdByInstitution" value={institution} />
                )}
                <p className="flex items-start gap-2 text-[11px] text-[#78716c]">
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E65100]" />
                  Os dados serão usados exclusivamente para intermediação de oportunidades e ficarão
                  registrados na auditoria.
                </p>
              </>
            )}

            {/* Keep named fields available when not on step 3 via duplication only on visible steps —
                for steps 0-2 the inputs already have name=. On step 3 we use hidden. */}
            {step !== 3 && (
              <>
                {step !== 0 && (
                  <>
                    <input type="hidden" name="cnpj" value={cnpj} />
                    <input type="hidden" name="name" value={name} />
                    <input type="hidden" name="tradeName" value={tradeName} />
                    <input type="hidden" name="sector" value={sector} />
                  </>
                )}
                {step !== 1 && (
                  <>
                    <input type="hidden" name="email" value={email} />
                    <input type="hidden" name="phone" value={phone} />
                    <input type="hidden" name="address" value={address} />
                    <input type="hidden" name="city" value={city} />
                    <input type="hidden" name="state" value={state} />
                  </>
                )}
                {step !== 2 && (
                  <>
                    <input type="hidden" name="contactName" value={contactName} />
                    <input type="hidden" name="notes" value={notes} />
                  </>
                )}
                {needsInstitution && step !== 0 && (
                  <input type="hidden" name="createdByInstitution" value={institution} />
                )}
              </>
            )}
          </SurfaceCard>

          <SurfaceCard className="h-fit p-4 xl:sticky xl:top-[4.5rem]">
            <h3 className="text-sm font-bold text-[#1C1410]">Checklist do cadastro</h3>
            <ul className="mt-3 space-y-3">
              {checklist.map((item) => (
                <li key={item.title} className="flex gap-2 text-xs">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      item.ok ? "bg-emerald-100 text-emerald-700" : "bg-[#FFF4EA] text-[#E65100]"
                    }`}
                  >
                    {item.ok ? <Check className="h-3 w-3" /> : "!"}
                  </span>
                  <div>
                    <p className="font-semibold text-[#1C1410]">{item.title}</p>
                    <p className="text-[11px] text-[#78716c]">{item.hint}</p>
                  </div>
                </li>
              ))}
            </ul>
          </SurfaceCard>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-[#E6E8EB] bg-white py-4">
          <Link
            href="/admin/empresas"
            className="rounded-md border border-[#E6E8EB] px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
          >
            Cancelar
          </Link>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="rounded-md border border-[#E6E8EB] px-3.5 py-2 text-xs font-bold text-[#1C1410] hover:bg-[#F4F5F7]"
            >
              Voltar
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              disabled={!canGoNext()}
              onClick={() => setStep((s) => s + 1)}
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315] disabled:opacity-50"
            >
              Próxima etapa
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-md bg-[#E65100] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#D84315]"
            >
              Salvar cadastro
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
