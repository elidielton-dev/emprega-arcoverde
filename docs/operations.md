# Operações, Tarefas Agendadas e Integrações — Emprega Arcoverde

Este documento reúne os procedimentos operacionais para execução de tarefas em segundo plano, configuração de storage, envio de e-mails, integração de WhatsApp e troubleshooting da plataforma.

---

## 1. Tarefas Programadas (Cron Jobs)

A plataforma disponibiliza a rota protegida `/api/cron/jobs` para execução periódica automatizada (via Vercel Cron, GitHub Actions ou Cron em servidor Linux).

### Como disparar o Cron
Faça uma requisição HTTP `GET` incluindo o segredo `CRON_SECRET`:

```bash
curl -X GET "https://emprega.arcoverde.pe.gov.br/api/cron/jobs" \
  -H "Authorization: Bearer cron-secret-arcoverde-key-987654"
```

### O que o Cron executa:
1. **Encerramento de Vagas Vencidas**: Transiciona automaticamente o status de vagas `PUBLISHED` para `CLOSED` quando a data limite (`applicationDeadline`) for ultrapassada, impedindo novas candidaturas.
2. **Atualização de Cursos**: Atualiza cursos `ACTIVE` para `EXPIRED` quando o prazo de inscrições (`enrollmentEnd`) expira.
3. **Auditoria**: Registra no `audit_logs` a quantidade de registros atualizados e o carimbo de data/hora.

---

## 2. Adaptador de E-mails Transacionais (Resend)

Configure no `.env`:

```bash
EMAIL_FROM="Emprega Arcoverde <onboarding@resend.dev>"
RESEND_API_KEY="re_xxxxxxxx"
```

- **Resend** é o provedor preferencial (`src/lib/mail/mailer.ts`).
- Teste: `npm run resend:verify -- seu-email@exemplo.com`
- Em produção, verifique um domínio no Resend e use `EMAIL_FROM` com esse domínio.
- Fallback SMTP (`SMTP_*`) ainda funciona se Resend não estiver configurado.
- Forçar mock: `EMAIL_MOCK=true`.

Templates: confirmação de candidatura, reset de senha, convite de entrevista, contato.

---

## 3. WhatsApp

**Decisão de produto:** não há provedor oficial ativo. Contato = links `wa.me` (interesse de empresa, recrutador no painel).  
`WHATSAPP_PROVIDER_ENABLED` deve permanecer `false`. A função `sendOfficialWhatsAppNotification` **não simula sucesso**.

---

## 4. Armazenamento de Documentos (Supabase Storage)

- Com `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`: upload/download no bucket `STORAGE_BUCKET` (padrão `emprega-arcoverde-docs`).
- Crie o bucket **privado** no painel Supabase Storage.
- Sem service role (ou `STORAGE_DRIVER=local`): pasta `./uploads`.
- Download autorizado: `/api/documents/[fileKey]` (candidato, empresa da vaga, staff).

---

## 5. Secrets

- `AUTH_SECRET` obrigatório em produção (sem fallback hardcoded).
- `CRON_SECRET` para `/api/cron/jobs`.
- OAuth Google/LinkedIn só aparece na UI se Supabase público estiver configurado.