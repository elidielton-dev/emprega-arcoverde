import { redirect } from "next/navigation";

/** Conteúdos sem CRUD — redireciona para o painel. */
export default function AdminConteudosRedirect() {
  redirect("/admin");
}
