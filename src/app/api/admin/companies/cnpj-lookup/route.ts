import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { formatCnpj, isValidCnpj, normalizeCnpj } from "@/lib/company/cnpj";

export type CnpjLookupData = {
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

function formatPhone(raw?: string | null) {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return digits;
}

function formatCep(raw?: string | null) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length !== 8) return digits || "";
  return digits.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

async function fromBrasilApi(cnpj: string): Promise<CnpjLookupData | null> {
  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 429) throw Object.assign(new Error("rate_limit"), { code: "RATE_LIMIT" });
  if (!response.ok) throw new Error(`brasilapi_${response.status}`);

  const data = await response.json();
  const street = [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(" ").trim();
  const address = [
    street || null,
    data.numero ? `nº ${data.numero}` : null,
    data.complemento || null,
    data.bairro || null,
    data.cep ? `CEP ${formatCep(data.cep)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    cnpj: formatCnpj(cnpj),
    name: data.razao_social || "",
    tradeName: data.nome_fantasia || "",
    email: data.email || "",
    phone: formatPhone(data.ddd_telefone_1),
    address,
    city: data.municipio || "",
    state: data.uf || "",
    sector: data.cnae_fiscal_descricao || "",
  };
}

async function fromOpenCnpja(cnpj: string): Promise<CnpjLookupData | null> {
  const response = await fetch(`https://open.cnpja.com/office/${cnpj}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 429) throw Object.assign(new Error("rate_limit"), { code: "RATE_LIMIT" });
  if (!response.ok) throw new Error(`cnpja_${response.status}`);

  const data = await response.json();
  const addr = data.address || {};
  const street = [addr.street, addr.number ? `nº ${addr.number}` : null, addr.details, addr.district]
    .filter(Boolean)
    .join(", ");
  const phones = Array.isArray(data.phones) ? data.phones : [];
  const phoneRaw = phones[0] ? `${phones[0].area || ""}${phones[0].number || ""}` : "";
  const emails = Array.isArray(data.emails) ? data.emails : [];
  const activity = data.mainActivity?.text || data.mainActivity?.text || "";

  return {
    cnpj: formatCnpj(cnpj),
    name: data.company?.name || "",
    tradeName: data.alias || "",
    email: emails[0]?.address || "",
    phone: formatPhone(phoneRaw),
    address: [street, addr.zip ? `CEP ${formatCep(addr.zip)}` : null].filter(Boolean).join(", "),
    city: addr.city || "",
    state: addr.state || "",
    sector: activity,
  };
}

async function fromPublicaCnpjWs(cnpj: string): Promise<CnpjLookupData | null> {
  const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (response.status === 429) throw Object.assign(new Error("rate_limit"), { code: "RATE_LIMIT" });
  if (!response.ok) throw new Error(`cnpjws_${response.status}`);

  const data = await response.json();
  const estabelecimento = data.estabelecimento || {};
  const street = [
    estabelecimento.tipo_logradouro,
    estabelecimento.logradouro,
    estabelecimento.numero ? `nº ${estabelecimento.numero}` : null,
    estabelecimento.complemento,
    estabelecimento.bairro,
    estabelecimento.cep ? `CEP ${formatCep(estabelecimento.cep)}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const ddd = estabelecimento.ddd1 || "";
  const tel = estabelecimento.telefone1 || "";
  const activity = estabelecimento.atividade_principal?.descricao || "";

  return {
    cnpj: formatCnpj(cnpj),
    name: data.razao_social || "",
    tradeName: estabelecimento.nome_fantasia || "",
    email: estabelecimento.email || "",
    phone: formatPhone(`${ddd}${tel}`),
    address: street,
    city: estabelecimento.cidade?.nome || estabelecimento.municipio?.nome || "",
    state: estabelecimento.estado?.sigla || "",
    sector: activity,
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !canRegisterCompany(session.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const cnpj = normalizeCnpj(req.nextUrl.searchParams.get("cnpj") || "");
  if (!isValidCnpj(cnpj)) {
    return NextResponse.json({ error: "CNPJ inválido. Informe 14 dígitos." }, { status: 400 });
  }

  const providers = [fromBrasilApi, fromOpenCnpja, fromPublicaCnpjWs];
  let rateLimited = false;

  for (const provider of providers) {
    try {
      const result = await provider(cnpj);
      if (result && result.name) {
        return NextResponse.json(result);
      }
      if (result === null) {
        return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal." }, { status: 404 });
      }
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "RATE_LIMIT") rateLimited = true;
      console.warn("CNPJ provider falhou:", (error as Error)?.message || error);
    }
  }

  return NextResponse.json(
    {
      error: rateLimited
        ? "Consulta temporariamente limitada. Aguarde alguns segundos e tente Buscar de novo."
        : "Não foi possível consultar o CNPJ agora. Tente de novo ou preencha manualmente.",
    },
    { status: 502 },
  );
}
