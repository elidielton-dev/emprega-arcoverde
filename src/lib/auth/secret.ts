/**
 * Segredo JWT compartilhado (middleware Edge + Node).
 * Em produção AUTH_SECRET é obrigatório — sem fallback hardcoded.
 */
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET não configurado. Defina a variável de ambiente em produção.");
  }

  console.warn(
    "[auth] AUTH_SECRET ausente — usando segredo de desenvolvimento. Configure AUTH_SECRET antes de produção.",
  );
  return "emprega-arcoverde-dev-only-not-for-production";
}
