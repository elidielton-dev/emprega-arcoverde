/** Unidade de atendimento inferida pelo papel do operador logado. */
export function assistedUnitFromRole(role: string): string {
  switch (role) {
    case "ACA_ADMIN":
      return "Associação Comercial de Arcoverde (ACA)";
    case "MUNICIPAL_ADMIN":
    case "SUPER_ADMIN":
      return "Prefeitura de Arcoverde / Sala do Empreendedor";
    case "ASSISTED_OPERATOR":
    default:
      return "Sala do Empreendedor de Arcoverde";
  }
}
