const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");

const storageSrc = fs.readFileSync(
  path.join(__dirname, "../src/lib/storage/storage.ts"),
  "utf8",
);

describe("storage produção", () => {
  it("não faz fallback silencioso para /tmp em produção", () => {
    assert.match(storageSrc, /STORAGE_INDISPONIVEL/);
    assert.match(storageSrc, /isProductionRuntime|VERCEL/);
    // Não deve ter o padrão antigo de fallback após falha do Supabase
    assert.ok(!/Storage Supabase falhou; tentando disco local/.test(storageSrc));
  });

  it("expõe isSupabaseStorageConfigured", () => {
    assert.match(storageSrc, /export function isSupabaseStorageConfigured/);
  });
});
