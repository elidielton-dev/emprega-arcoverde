import { redirect } from "next/navigation";

/** Configurações placeholder — redireciona até haver settings reais. */
export default function AdminConfiguracoesRedirect() {
  redirect("/admin");
}
