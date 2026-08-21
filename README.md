# Emprega Arcoverde — Portal Público de Empregabilidade e Qualificação

> Plataforma web oficial de empregabilidade e qualificação profissional de **Arcoverde - PE**, conectando trabalhadores, empresas locais, a **ACA** e a **Sala do Empreendedor** / Prefeitura.

---

## Principais funcionalidades

1. **Portal público** — vagas, cursos, conteúdos, links úteis e contato.
2. **Candidatos** — currículo estruturado, 1 anexo PDF/DOCX, candidaturas, privacidade/LGPD.
3. **Empresas** — triagem, entrevistas, banco de talentos e relatórios. **Não criam vagas** (só ACA/Prefeitura).
4. **Atendimento assistido** — Sala do Empreendedor cadastra cidadãos presencialmente.
5. **Administração** — vagas, empresas, validação de currículo, cursos, usuários, indicadores, CMS, auditoria.
6. **E-mail** — Resend (preferencial) ou SMTP; WhatsApp só via `wa.me` manual.

---

## Como executar localmente

### Pré-requisitos
- Node.js 18+ ou 20+
- Docker (Postgres local) **ou** Postgres Supabase

```bash
npm install
cp .env.example .env
docker compose up -d   # se for Postgres local
npm run db:push
npm run db:seed
npm run dev
```

Portal: http://localhost:3000

---

## Deploy na Vercel (produção)

Guia completo: **[docs/GO-LIVE.md](docs/GO-LIVE.md)**.

Variáveis mínimas:

| Variável | Obrigatório |
|----------|-------------|
| `DATABASE_URL` | Sim (pooler 6543 + pgbouncer) |
| `AUTH_SECRET` | Sim |
| `APP_URL` | Sim (`https://empregaarcoverde.vercel.app`) |
| `RESEND_API_KEY` + `EMAIL_FROM` | Sim (domínio verificado no Resend) |
| `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + `STORAGE_BUCKET` | Sim (anexos) |
| `CRON_SECRET` | Sim |

```bash
npm run storage:ensure
npm run stack:validate
```

`GET /api/health` deve retornar `readyForEndUsers: true`.

---

## Contas de demonstração

Senha: **`senha123`**

| Papel | E-mail |
|-------|--------|
| Candidato | `candidato.demo@demo.com` |
| Empresa | `empresa.comercio@demo.com` |
| Sala | `operador.sala@demo.com` |
| ACA | `admin.aca@demo.com` |
| Prefeitura | `admin.prefeitura@demo.com` |

Homologação papel a papel: **[docs/E2E-CHECKLIST.md](docs/E2E-CHECKLIST.md)**.

---

## Testes

```bash
npm test
npm run rbac:audit
npx tsc --noEmit
npm run build
```

---

## Documentação

- [docs/GO-LIVE.md](docs/GO-LIVE.md) — critérios de usuário final
- [docs/E2E-CHECKLIST.md](docs/E2E-CHECKLIST.md) — checklist operacional
- [docs/architecture.md](docs/architecture.md)
- [docs/operations.md](docs/operations.md)
