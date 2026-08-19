export function normalizeCnpj(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCnpj(value: string) {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;
  return true;
}

export function formatCnpj(value: string) {
  const cnpj = normalizeCnpj(value);
  if (cnpj.length !== 14) return value;
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

export function institutionFromRole(role: string, chosen?: string) {
  if (role === "ACA_ADMIN") return "ACA";
  if (role === "MUNICIPAL_ADMIN") return "PREFEITURA";
  if (chosen === "ACA" || chosen === "PREFEITURA") return chosen;
  return "PREFEITURA";
}
