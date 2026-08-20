import { redirect } from "next/navigation";

/** Links úteis removidos do painel admin. */
export default function AdminLinksUteisRemoved() {
  redirect("/admin");
}
