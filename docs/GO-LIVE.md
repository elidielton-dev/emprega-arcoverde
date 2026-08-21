# Go-live — Emprega Arcoverde

Checklist operacional para deixar o portal apto a **usuário final**. Completar na ordem.

## 1. E-mail (bloqueador)

### Variáveis na Vercel (Production)

| Variável | Valor |
|----------|--------|
| `RESEND_API_KEY` | Chave `re_…` em https://resend.com/api-keys |
| `EMAIL_FROM` | `Emprega Arcoverde <noreply@SEU-DOMINIO>` |
| `APP_URL` | `https://empregaarcoverde.vercel.app` (ou domínio custom) |
| `EMAIL_MOCK` | vazio / não definir |

### Domínio próprio (obrigatório para cidadãos)

1. Em https://resend.com/domains adicione o domínio institucional (ex.: `arcoverde.pe.gov.br` ou domínio da ACA).
2. Publique os DNS (SPF, DKIM, etc.) que o Resend indicar.
3. Aguarde status **Verified**.
4. Atualize `EMAIL_FROM` para usar esse domínio.
5. **Não** use `onboarding@resend.dev` em produção: o Resend só envia para o e-mail da conta Resend (modo teste).

### Validar

```bash
npm run resend:verify -- seu-email@exemplo.com
npm run stack:validate
```

No site: `/esqueci-a-senha` com um e-mail de cidadão cadastrado → link deve chegar e abrir `/redefinir-senha?token=…` no domínio de `APP_URL`.

`GET /api/health` deve mostrar `checks.email: "resend"` (não `"mock"`) e `checks.emailFromMode: "production"` (não `"test_only"`).

---

## 2. Storage de currículos (bloqueador)

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (secreta) |
| `STORAGE_BUCKET` | `emprega-arcoverde-docs` |
| `STORAGE_DRIVER` | vazio ou `supabase` (não use `local` na Vercel) |

### Bucket

```bash
npm run storage:ensure
```

No painel Supabase → Storage: bucket **privado** `emprega-arcoverde-docs`.

### Validar

1. Login candidato → `/painel/curriculo` → enviar PDF.
2. Redeploy na Vercel (ou aguardar cold start).
3. Abrir de novo o painel: o anexo ainda deve aparecer (não some após `/tmp`).

`GET /api/health` → `checks.storage: "supabase"`.

---

## 3. Secrets obrigatórios

| Variável | Notas |
|----------|--------|
| `DATABASE_URL` | Pooler Supabase porta 6543 + `pgbouncer=true` |
| `AUTH_SECRET` | String longa aleatória |
| `CRON_SECRET` | Bearer do cron em `vercel.json` |
| `DIRECT_URL` | Só local / `db push` (porta 5432) |

---

## 4. Homologação por papel

Contas seed (senha `senha123`): ver [E2E-CHECKLIST.md](./E2E-CHECKLIST.md).

```bash
npm test
npm run rbac:audit
npm run stack:validate
```

Percorra o E2E com Candidato, Empresa, Sala, ACA e Prefeitura.

---

## Status atual (automático)

| Ambiente | Resultado |
|----------|-----------|
| Local `.env` | Storage Supabase OK; Resend envia; `EMAIL_FROM` ainda `onboarding@resend.dev` (teste); `APP_URL` localhost (esperado no PC) |
| Produção Vercel | `email=resend`, **`storage=local`** → anexos frágeis; falta espelhar `SUPABASE_SERVICE_ROLE_KEY` (+ não forçar `STORAGE_DRIVER=local`) e trocar `EMAIL_FROM` para domínio verificado |

Até `readyForEndUsers: true` no health, o portal **não** deve ser anunciado como aberto ao público.
