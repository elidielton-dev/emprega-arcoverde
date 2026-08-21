import { prisma } from "@/lib/db/prisma";

const DEFAULTS: Record<string, string> = {
  contact_email: "contato@emprega.arcoverde.pe.gov.br",
  contact_phone_sala: "(87) 3821-9000",
  contact_phone_aca: "(87) 3821-1234",
  address_sala: "Rua Cap. Arlindo Pachêco de Albuquerque, Centro - Arcoverde - PE",
  address_aca: "Av. Cel. Antônio Japiassu, 590 - Centro - Arcoverde - PE",
  hours_sala: "Segunda a Sexta, das 08h às 14h",
  email_aca: "contato@acaarcoverde.com.br",
};

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (row?.value) return row.value;
  return DEFAULTS[key] || "";
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const key of keys) {
    map[key] = rows.find((r) => r.key === key)?.value || DEFAULTS[key] || "";
  }
  return map;
}

export async function upsertSetting(key: string, value: string, description?: string) {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, description: description || null },
    update: { value, description: description || undefined },
  });
}

export async function getContactSettings() {
  return getSettings([
    "contact_email",
    "contact_phone_sala",
    "contact_phone_aca",
    "address_sala",
    "address_aca",
    "hours_sala",
    "email_aca",
  ]);
}
