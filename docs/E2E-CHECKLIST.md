# Checklist E2E — Emprega Arcoverde (produto final)

Execute após deploy/staging com Resend (domínio próprio) e bucket configurados. Contas seed: `senha123`.

Guia de infra: [GO-LIVE.md](./GO-LIVE.md).

## Infra

- [ ] `GET /api/health` → `readyForDemo: true` (mínimo segunda) / `readyForEndUsers: true` (público)
- [ ] `checks.storage` = `supabase` (nunca `local` ou `missing` na Vercel)
- [ ] `checks.email` = `resend` (ou `smtp`); para público: `emailFromMode` = `production`
- [ ] `checks.appUrl` = `ok` e `authSecret` = `ok`
- [ ] Reset de senha chega na caixa real (só após domínio Resend)
- [ ] Upload de anexo no currículo persiste após refresh/redeploy
- [ ] Cron: Vercel Cron diário em `/api/cron/jobs` com `Authorization: Bearer $CRON_SECRET`
- [ ] `npm run stack:validate` / `npm run prod:health`

### Entrega segunda-feira

1. Colar na Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `STORAGE_BUCKET=emprega-arcoverde-docs`
2. Remover `STORAGE_DRIVER=local` se existir
3. Redeploy + `npm run prod:health` → `readyForDemo: true`
4. Testar PDF com `candidato.demo@demo.com` / `senha123`

> Sem as keys do Supabase na Vercel, o código **não** grava mais em `/tmp` (evita anexo fantasma). A UI mostra `storage_indisponivel`.

### Snapshot automático (código)

| Check | Status |
|-------|--------|
| Testes / RBAC audit | `npm test` |
| Storage exige Supabase em produção | Código |
| Mensagem `storage_indisponivel` no currículo | Código |
| Empresa não cria vaga | Código |
| CMS + links no menu | Código |

## Público

- [ ] Home busca vagas
- [ ] Navbar: Vagas, Cursos, Conteúdos, Links úteis, Contato
- [ ] `/contato` envia formulário → e-mail institucional
- [ ] `/conteudos` e `/links-uteis` refletem CRUD admin

## Candidato (`candidato.demo@demo.com`)

- [ ] Login → painel
- [ ] Completar perfil/currículo
- [ ] Enviar 1 PDF e remover/reenviar
- [ ] Candidatar-se a vaga → notificação in-app
- [ ] `/painel/privacidade` → baixar JSON
- [ ] Preferências de e-mail salvam
- [ ] `/esqueci-a-senha` com e-mail real (após domínio Resend)

## Empresa (`empresa.comercio@demo.com`)

- [ ] Não consegue criar vaga (`/empresa/vagas/nova` bloqueada)
- [ ] Funil candidatos + export CSV
- [ ] Agendar entrevista → candidato notificado (se opt-in e-mail)
- [ ] Configurações → convidar membro (OWNER/ADMIN)
- [ ] Sino de notificações

## Sala (`operador.sala@demo.com`)

- [ ] Atendimento assistido completo
- [ ] Não acessa `/admin/vagas` nem `/admin/conteudos` (redirect)
- [ ] Menu só: visão, empresas, candidatos, atendimento

## ACA (`admin.aca@demo.com`)

- [ ] Moderar / criar vaga
- [ ] Validar currículo
- [ ] Menu: Conteúdos e Links úteis visíveis
- [ ] CRUD conteúdos e links
- [ ] Configurações do portal

## Prefeitura (`admin.prefeitura@demo.com`)

- [ ] Cursos, indicadores, usuários
- [ ] Processar exclusão LGPD (anonimiza User + remove arquivos)
- [ ] Auditoria

## Critério de pronto

Todos os itens de **Infra** + papéis acima OK em staging → sistema apto a operação (usuário final).
