import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { canRegisterCompany } from "@/lib/auth/rbac";
import { formatCnpj, isValidCnpj, normalizeCnpj } from "@/lib/company/cnpj";

type BrasilApiCnpj = {
  razao_social?: string;
  nome_fantasia?: string;
  email?: string | null;
  ddd_telefone_1?: string | null;
  descricao_tipo_de_logradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cnae_fiscal_descricao?: string | null;
};

function buildAddress(data: BrasilApiCnpj) {
  const street = [data.descricao_tipo_de_logradouro, data.logradouro].filter(Boolean).join(" ").trim();
  const parts = [
    street || null,
    data.numero ? `nº ${data.numero}` : null,
    data.complemento || null,
    data.bairro || null,
    data.cep ? `CEP ${String(data.cep).replace(/\D/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2")}` : null,
  ].filter(Boolean);
  return parts.join(", ") || null;
}

function buildPhone(data: BrasilApiCnpj) {
  const raw = (data.ddd_telefone_1 || "").replace(/\D/g, "");
  if (!raw) return null;
  if (raw.length === 10) return `(${raw.slice(0, 2)}) ${raw.slice(2, 6)}-${raw.slice(6)}`;
  if (raw.length === 11) return `(${raw.slice(0, 2)}) ${raw.slice(2, 7)}-${raw.slice(7)}`;
  return raw;
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

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });

    if (response.status === 404) {
      return NextResponse.json({ error: "CNPJ não encontrado na Receita Federal." }, { status: 404 });
    }
    if (!response.ok) {
      return NextResponse.json(
        { error: "Não foi possível consultar o CNPJ agora. Tente de novo ou preencha manualmente." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as BrasilApiCnpj;

    return NextResponse.json({
      cnpj: formatCnpj(cnpj),
      name: data.razao_social || "",
      tradeName: data.nome_fantasia || "",
      email: data.email || "",
      phone: buildPhone(data) || "",
      address: buildAddress(data) || "",
      city: data.municipio || "",
      state: data.uf || "",
      sector: data.cnae_fiscal_descricao || "",
    });
  } catch (error) {
    console.error("Erro na consulta de CNPJ:", error);
    return NextResponse.json(
      { error: "Falha na consulta do CNPJ. Preencha os dados manualmente." },
      { status: 502 },
    );
  }
}
