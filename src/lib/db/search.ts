export function containsInsensitive(value: string) {
  return { contains: value, mode: "insensitive" as const };
}
