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

## 2. Adaptador de E-mails Transacionais

- **Ambiente de Desenvolvimento**: O driver de desenvolvimento intercepta os disparos e exibe os e-mails formatados no console sem custos nem risco de envio real.
- **Ambiente de Produção**: Configure `EMAIL_PROVIDER_API_KEY` (Resend, SendGrid ou SMTP corporativo da Prefeitura de Arcoverde).

Templates já implementados:
- Confirmação de candidatura para o candidato (com sigilo total de vagas confidenciais)
- Notificações de mudança de status

---

## 3. Adaptador de WhatsApp Oficial

- **Política de Segurança**: A integração permanece **desativada por padrão (`WHATSAPP_PROVIDER_ENABLED=false`)** e não depende de web scraping ou métodos não oficiais.
- **Consentimento**: O sistema só tenta despachar notificações para candidatos que marcaram o consentimento explícito `whatsappConsent: true`.
- **Sigilo**: O nome da empresa contratante é automaticamente sanitizado para "Empresa Confidencial" antes do envio em vagas com flag sigilosa.

---

## 4. Armazenamento Seguro de Documentos (Storage)

- **Local (Desenvolvimento)**: Arquivos são salvos em `./uploads` com chaves randômicas não adivinháveis.
- **Produção (S3 compatível)**: Preencha `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY` e `STORAGE_SECRET_KEY` no `.env`.
- **Acesso**: Apenas usuários autorizados (o próprio candidato, recrutadores da vaga ou operadores da ACA) conseguem fazer o download através de `/api/documents/[fileKey]`.
