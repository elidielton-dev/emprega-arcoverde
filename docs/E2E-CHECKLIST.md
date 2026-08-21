# Checklist E2E — Emprega Arcoverde (produto final)

Execute após deploy/staging com SMTP e bucket configurados. Contas seed: `senha123`.

## Infra

- [ ] `GET /api/health` → `{ ok: true, checks.database: "ok" }`
- [ ] `SMTP_*` preenchido; reset de senha chega na caixa real
- [ ] Upload de anexo no currículo persiste após refresh (Supabase bucket)
- [ ] Cron: Vercel Cron diário em `/api/cron/jobs` com header `Authorization: Bearer $CRON_SECRET`

## Público

- [ ] Home busca vagas
- [ ] `/contato` envia formulário → e-mail institucional + notificação admin
- [ ] `/conteudos` e `/links-uteis` refletem CRUD admin

## Candidato (`candidato.demo@demo.com`)

- [ ] Login → painel
- [ ] Completar perfil/currículo
- [ ] Candidatar-se a vaga → notificação in-app
- [ ] `/painel/privacidade` → baixar JSON
- [ ] Preferências de e-mail salvam
- [ ] Solicitar exclusão (não processar se for conta demo de apresentação)

## Empresa (`empresa.comercio@demo.com`)

- [ ] Funil candidatos + export CSV
- [ ] Agendar entrevista → candidato notificado
- [ ] Configurações → convidar membro (OWNER/ADMIN)
- [ ] Sino de notificações

## Sala (`operador.sala@demo.com`)

- [ ] Atendimento assistido completo
- [ ] Não acessa `/admin/vagas` nem `/admin/conteudos` (redirect)

## ACA (`admin.aca@demo.com`)

- [ ] Moderar vaga
- [ ] Validar currículo
- [ ] CRUD conteúdos e links
- [ ] Configurações do portal

## Prefeitura (`admin.prefeitura@demo.com`)

- [ ] Cursos, indicadores, usuários
- [ ] Processar exclusão LGPD (anonimiza User)
- [ ] Auditoria

## Critério de pronto

Todos os itens acima OK em staging → sistema apto a operação (produto final).
