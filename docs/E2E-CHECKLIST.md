# Checklist E2E — Emprega Arcoverde (produto final)

Execute após deploy/staging com Resend (domínio próprio) e bucket configurados. Contas seed: `senha123`.

Guia de infra: [GO-LIVE.md](./GO-LIVE.md).

## Infra

- [ ] `GET /api/health` → `ok: true`, `readyForEndUsers: true`
- [ ] `checks.email` = `resend` (ou `smtp`) e `emailFromMode` = `production` (não `test_only`)
- [ ] `checks.storage` = `supabase` (não `local` na Vercel)
- [ ] `checks.appUrl` = `ok` e `authSecret` = `ok`
- [ ] Reset de senha chega na caixa real de um cidadão
- [ ] Upload de anexo no currículo persiste após refresh/redeploy
- [ ] Cron: Vercel Cron diário em `/api/cron/jobs` com `Authorization: Bearer $CRON_SECRET`
- [ ] `npm run stack:validate` local apontando ao mesmo projeto → sem falhas

### Snapshot automático (código + produção)

| Check | Status |
|-------|--------|
| Testes unitários / RBAC audit (`npm test`) | Automatizado no CI/local |
| Empresa não cria vaga (API 403 + RBAC) | Verificado no código |
| Sala bloqueada em vagas/CMS/indicadores | Verificado no middleware |
| CMS + links no menu admin e nav pública | Verificado no código |
| Entrevista respeita preferência de e-mail | Verificado no código |
| LGPD apaga arquivos do storage | Verificado no código |

> Em 2026-08-21 a produção `empregaarcoverde.vercel.app` respondia `email=resend`, `storage=local` → **ainda não** `readyForEndUsers`. Corrija `SUPABASE_SERVICE_ROLE_KEY` + bucket e `EMAIL_FROM` com domínio verificado.

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
