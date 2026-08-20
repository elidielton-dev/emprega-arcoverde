import { redirect } from "next/navigation";

export default function EmpresaPerfilRedirect({
  searchParams,
}: {
  searchParams: { sucesso?: string; erro?: string };
}) {
  const qs = new URLSearchParams();
  if (searchParams.sucesso) qs.set("sucesso", searchParams.sucesso);
  if (searchParams.erro) qs.set("erro", searchParams.erro);
  const suffix = qs.toString() ? `?${qs}` : "";
  redirect(`/empresa/configuracoes${suffix}`);
}
