import { NextRequest, NextResponse } from "next/server";

/** Empresa não cria vagas (ERS RN025). Use POST /api/admin/jobs. */
export async function POST(_req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "Somente ACA ou Prefeitura podem cadastrar vagas. A empresa solicita o cadastro pelo atendimento institucional.",
    },
    { status: 403 },
  );
}
