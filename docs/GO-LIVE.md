# Go-live — Emprega Arcoverde

Checklist operacional. Para **demonstração de segunda-feira**, o mínimo é `readyForDemo: true` (storage Supabase + DB + auth).

## Entrega segunda-feira (faça HOJE na Vercel)

### 1. Environment Variables → Production

Copie do `.env` local (valores reais):

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (não a anon key) |
| `STORAGE_BUCKET` | `emprega-arcoverde-docs` |
| `STORAGE_DRIVER` | **apague** se estiver `local` |
| `APP_URL` | `https://empregaarcoverde.vercel.app` |
| `AUTH_SECRET` | já deve existir |
| `DATABASE_URL` | já deve existir |
| `RESEND_API_KEY` | já deve existir |
| `CRON_SECRET` | já deve existir |

### 2. Redeploy

Deployments → Redeploy do `main` (ou push novo).

### 3. Validar

```bash
npm run storage:ensure
npm run prod:health
```

Esperado:

- `checks.storage` = `supabase`
- `readyForDemo` = `true`

### 4. Teste do PDF (2 min)

1. https://empregaarcoverde.vercel.app/entrar → `candidato.demo@demo.com` / `senha123`
2. `/painel/curriculo` → enviar 1 PDF
3. Atualizar a página → anexo ainda listado

---

## E-mail (demo vs público)

| Modo | `EMAIL_FROM` | Quem recebe |
|------|--------------|-------------|
| Demo / teste | `… <onboarding@resend.dev>` | Só o e-mail da conta Resend |
| Público | `… <noreply@seu-dominio>` (domínio verificado) | Qualquer cidadão |

Segunda-feira com demo: Resend teste **ok**. Recuperação para todos os cidadãos exige domínio depois.

---

## Critério de pronto

**Demo segunda:** `readyForDemo: true` + PDF persiste após refresh.

**Usuário final público:** `readyForEndUsers: true` (também `emailFromMode=production` + `appUrl=ok`).

```bash
npm run prod:health
npm test
```

---

## Status

| Ambiente | Storage | Nota |
|----------|---------|------|
| Local | Supabase OK (após `storage:ensure`) | Dev |
| Vercel | Precisa das keys acima | Sem SERVICE_ROLE → `storage: missing` e upload avisa `storage_indisponivel` |
