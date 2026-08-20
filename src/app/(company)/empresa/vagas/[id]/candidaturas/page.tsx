import { redirect } from "next/navigation";

/** Unifica triagem na tela global de candidatos. */
export default function EmpresaVagaCandidaturasRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/empresa/candidatos?vaga=${params.id}`);
}
