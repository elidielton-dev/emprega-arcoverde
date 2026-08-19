export async function withDb<T>(query: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await query();
  } catch (error) {
    console.error("Banco indisponível:", error);
    return fallback;
  }
}
