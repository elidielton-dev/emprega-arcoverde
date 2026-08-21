# Plano — Produto Final (não MVP)

**Objetivo:** deixar o Emprega Arcoverde **100% funcional** para operação real (Prefeitura, ACA, Sala, empresas e candidatos), sem telas “em breve”, sem canais mock vendidos como prontos e sem gaps de segurança/LGPD.

**Base:** auditoria de 20/08/2026 (menus, papéis, APIs, mocks).

**Definição de pronto:** checklist no fim deste documento marcado 100%. Até lá, o sistema continua “demo operacional”, não produto final.

---

## Princípios do fechamento

1. **Não mentir na UI** — se a feature não envia de verdade, não mostrar como disponível.
2. **Regra de negócio do ERS** — empresa não cria vaga; ACA/Prefeitura publicam; Sala faz assistido.
3. **Produção primeiro** — e-mail, storage, secrets e RBAC antes de “nice to have”.
4. **Um entregável por fatia** — cada fase fecha e pode ser demonstrada sozinha.
5. **Teste de regressão** por perfil após cada fase (contas seed).

---

## Visão das fases

| Fase | Nome | Resultado |
|------|------|-----------|
| **P0** | Fundação de produção | Comunicação real, storage real, secrets, RBAC fechado |
| **P1** | Fechar buracos do produto | Zero “em breve”, CMS, configs, contato, multi-usuário |
| **P2** | LGPD + confiança | Portabilidade, anonimização, preferências, auditoria |
| **P3** | Polimento e operação | ATS UX, demos, cron, docs, QA E2E |

Ordem fixa: **P0 → P1 → P2 → P3**. Não pular P0.

---

## P0 — Fundação de produção (bloqueador)

Sem isso, **não é produto final**.

### P0.1 — E-mail transacional real
**Problema:** `src/lib/mail/mailer.ts` mocka em dev e, com API key, ainda retorna `prod-*` fake.

**Fazer:**
- Integrar provedor real (Resend ou SMTP institucional).
- Enviar de verdade: reset de senha, confirmação de candidatura, convite de entrevista, credenciais de empresa/candidato assistido (quando aplicável).
- Variáveis: `EMAIL_PROVIDER_API_KEY`, `EMAIL_FROM`, `APP_URL`.
- Log de falha + status na `Notification` (`channel: EMAIL`, `status: FAILED|DELIVERED`).
- Página admin ou log operacional mínimo de “últimos envios falhos” (opcional nesta fase: só audit log).

**Aceite:** reset de senha chega na caixa real; candidatura dispara e-mail real em staging.

### P0.2 — Storage de documentos em produção
**Problema:** só `./uploads` local — some em deploy efêmero.

**Fazer:**
- Implementar driver S3-compatível em `src/lib/storage/storage.ts` (já previsto em `docs/operations.md`).
- Fallback local só em `NODE_ENV=development`.
- Migrar/documentar variáveis `STORAGE_*`.
- Testar download via `/api/documents/[fileKey]` com candidato, empresa e admin.

**Aceite:** upload de currículo/anexo sobrevive a redeploy; ACL por papel mantida.

### P0.3 — Secrets e auth endurecidos
**Fazer:**
- Remover fallback hardcoded de JWT no middleware (`AUTH_SECRET` obrigatório em prod).
- Validar `CRON_SECRET` em produção.
- OAuth: se Supabase não configurado, **esconder** botões Google/LinkedIn (não mostrar erro na demo).
- Revisar cookies (`httpOnly`, `secure`, `sameSite`) em produção.

**Aceite:** app não sobe em prod sem `AUTH_SECRET`; OAuth só aparece se configurado.

### P0.4 — RBAC consistente (páginas + APIs)
**Problema:** operador Sala pode abrir `/admin/vagas` por URL; APIs dependem só de check local.

**Fazer:**
- Middleware ou guards por rota alinhados a `rbac.ts` (vagas só `isAdmin`; cursos/indicadores/usuários só municipal/super).
- Revisar cada `src/app/api/admin/**` e `company/**` com o mesmo helper.
- Testes mínimos de autorização (ou checklist manual documentado).

**Aceite:** Sala recebe 403/redirect em vagas/cursos/usuários/indicadores; ACA não acessa exclusão LGPD.

### P0.5 — WhatsApp: oficial ou honestidade
**Opção A (produto final com WA):** ativar provedor oficial (`WHATSAPP_PROVIDER_ENABLED`) + templates aprovados + só com consentimento.  
**Opção B (produto final sem WA oficial):** manter só `wa.me` manual na empresa; remover copy de “WhatsApp oficial” / mock como feature.

**Decisão necessária do produto.** Default sugerido: **B agora**, **A depois** se a Prefeitura tiver Meta Business.

**Aceite:** nenhuma tela promete envio oficial sem provedor ativo.

---

## P1 — Fechar buracos do produto (zero MVP na UI)

### P1.1 — Remover / implementar todos os “em breve”
| Item | Ação |
|------|------|
| Export CSV candidatos (empresa) | Implementar export real (campos não sensíveis + audit) **ou** remover botão |
| Config empresa → Usuários | Implementar convite/listagem de `CompanyMember` **ou** ocultar aba |
| Config empresa → Etapas do funil | Etapas fixas documentadas **ou** config real; tirar texto “MVP” |
| Chevron empresa no sidebar | Remover ou abrir seletor real |

### P1.2 — CMS institucional (conteúdos + links)
**Problema:** `admin/conteudos` e `admin/links-uteis` só redirecionam; schema/seed existem.

**Fazer:**
- CRUD artigos (`Article`) no admin municipal (e ACA se desejado).
- CRUD links úteis.
- Publicar/despublicar; listagem pública já existe.
- Voltar itens ao menu `buildAdminNav` com RBAC correto.

**Aceite:** criar artigo no admin → aparece em `/conteudos` sem seed.

### P1.3 — Configurações do portal
**Problema:** `/admin/configuracoes` redirect; `SiteSetting` no schema sem UI.

**Fazer:**
- Tela de settings: contatos da home/footer, horários Sala/ACA, flags (OAuth, WhatsApp), textos institucionais.
- API admin com audit log.

**Aceite:** alterar telefone em settings → footer/contato refletem.

### P1.4 — Contato funcional
**Fazer:**
- Formulário em `/contato` (nome, e-mail, assunto, mensagem) → e-mail para Sala/ACA **ou** gravação + notificação admin.
- Rate limit básico + honeypot anti-spam.
- Manter endereços estáticos.

**Aceite:** envio gera e-mail/registro auditável.

### P1.5 — Multi-usuário empresa
**Fazer:**
- Listar membros; convidar por e-mail (cria user `COMPANY_MEMBER` + membership).
- Papéis OWNER/ADMIN/MEMBER (já no schema).
- Remover/desativar membro.
- E-mail de convite (depende P0.1).

**Aceite:** segundo recrutador entra e vê só dados da empresa.

### P1.6 — Demo e papéis
**Fazer:**
- Incluir ACA nos `DemoAccounts` (`admin.aca@demo.com`).
- Seed opcional `SUPER_ADMIN` **ou** documentar que Super = só ops internas.
- Garantir labels “Sala do Empreendedor” (não CEJA, salvo se produto oficializar CEJA).

---

## P2 — LGPD e confiança (obrigatório para município)

### P2.1 — Exclusão / anonimização completa
**Problema:** processar exclusão apaga perfil, mas User/e-mail podem permanecer.

**Fazer:**
- Fluxo: anonimizar User (e-mail hash, nome genérico), revogar sessões, limpar documentos no storage, manter audit mínimo sem PII.
- Soft-delete onde necessário para integridade de candidaturas históricas da empresa (sem expor PII).

**Aceite:** após processar, busca por e-mail do titular não encontra conta utilizável.

### P2.2 — Portabilidade (export do titular)
**Fazer:**
- Botão em `/painel/privacidade`: baixar JSON/PDF com perfil, currículo, candidaturas, consentimentos.
- Audit `DATA_EXPORT_REQUESTED`.

**Aceite:** candidato baixa pacote completo.

### P2.3 — Preferências de notificação
**Fazer:**
- UI em candidato (e empresa): e-mail / in-app / (WhatsApp se P0.5A).
- Respeitar `NotificationPreference` em `notify.ts` e mailer.

**Aceite:** desligar e-mail → candidatura não dispara e-mail (in-app continua se ligado).

### P2.4 — Consentimentos e textos legais
**Fazer:**
- Revisar `/privacidade` e `/termos` com base no fluxo real.
- Registrar versão do termo aceito (se ainda não).
- Checklist acessibilidade (`/acessibilidade`) alinhado ao que o sistema faz.

---

## P3 — Polimento de produto e operação

### P3.1 — Matching ATS na UX
- Decidir: mostrar score ao candidato (transparência ERS) **ou** manter só empresa com copy clara.
- Botão “Recalcular aderência” na empresa (API `ats-refresh` já existe).
- “Vagas recomendadas” no painel candidato usando score real (não top 3 genéricos).

### P3.2 — Notificações cobrindo 100% dos eventos críticos
Garantir create em todos os eventos (já parcial):
- Nova vaga publicada (empresa)
- Moderação rejeitada/aprovada
- Validação currículo
- LGPD
- Nova candidatura
- Status/entrevista
- Pedido alteração vaga
- (Novo) mensagem de contato, convite membro empresa

### P3.3 — Relatórios e export
- Export empresa (P1.1) + export admin já existente revisado.
- Relatórios empresa: PDF/CSV opcional.

### P3.4 — Cron e monitoramento
- Cron Vercel/GitHub configurado em produção (`docs/operations.md`).
- Health check simples (`/api/health`: db + storage ping).
- Alertas básicos (e-mail admin se cron falhar) — opcional.

### P3.5 — QA E2E por perfil
Roteiro automatizado ou checklist obrigatório:
1. Candidato: cadastro → currículo → candidatar → ver notificação  
2. Empresa: funil → entrevista → feedback  
3. Sala: assistido completo → aparece em candidatos  
4. ACA: moderar vaga → empresa notificada  
5. Prefeitura: curso + indicador + LGPD  
6. Reset senha real  
7. Upload documento após redeploy  

### P3.6 — Documentação de operação
Atualizar `docs/operations.md`, `docs/acceptance-checklist.md` (hoje marca e-mail/WhatsApp como OK com mock — **corrigir honestidade**), README de deploy.

---

## Ordem de execução sugerida (sprints)

| Sprint | Duração sugerida | Escopo |
|--------|------------------|--------|
| **S1** | 3–5 dias | P0.1 e-mail + P0.3 secrets + P0.4 RBAC + P0.5 decisão WA |
| **S2** | 2–4 dias | P0.2 storage produção |
| **S3** | 4–6 dias | P1.1 limpar “em breve” + P1.5 multi-usuário + P1.4 contato |
| **S4** | 4–6 dias | P1.2 CMS + P1.3 settings |
| **S5** | 3–5 dias | P2 LGPD completo |
| **S6** | 3–4 dias | P3 ATS UX + notificações + cron + QA + docs |

**Total estimado:** ~4–6 semanas de trabalho focado (1 dev full-time), dependendo de acesso a Resend/SMTP, bucket S3 e Meta WhatsApp.

---

## Fora de escopo (não confundir com “produto final”)

- App mobile nativo  
- Marketplace nacional / multi-cidade  
- IA generativa de currículo  
- Pagamentos  
- Integração e-Social / gov.br (salvo requisito novo formal)

Se a Prefeitura exigir algo dessa lista, vira **fase P4** à parte.

---

## Checklist “produto final” (definição de pronto)

### Produção
- [x] Código e-mail SMTP real (`mailer.ts` + Nodemailer)
- [ ] Credenciais `SMTP_*` preenchidas no ambiente (TI/Prefeitura)
- [x] Storage Supabase (bucket `emprega-arcoverde-docs` criado + upload testado)
- [x] `AUTH_SECRET` / `CRON_SECRET` sem fallback inseguro em prod
- [x] OAuth só se configurado
- [x] WhatsApp: só `wa.me`

### Produto / UI
- [x] Zero botões “Em breve” enganosos
- [x] CMS conteúdos + links (ACA + Prefeitura)
- [x] Settings do portal
- [x] Contato com envio
- [x] Multi-usuário empresa + export CSV

### LGPD
- [x] Anonimização completa do User
- [x] Export do titular (JSON)
- [x] Preferências de notificação respeitadas no e-mail

### Qualidade
- [x] RBAC middleware (Sala fora de vagas/CMS/auditoria)
- [x] `/api/health` + Vercel Cron + `docs/E2E-CHECKLIST.md`
- [x] Sugestões de vagas por ATS (sem exibir score ao candidato)
- [ ] Rodar checklist E2E em staging com SMTP real

---

## Decisões de produto (20/08/2026)

| # | Tema | Decisão |
|---|------|---------|
| 1 | E-mail | **SMTP da Prefeitura** |
| 2 | Storage | **Supabase Storage** |
| 3 | WhatsApp oficial | **Não** — só links `wa.me` manuais; sem narrativa de provedor oficial |
| 4 | Score ATS ao candidato | **Não** — ATS só para empresa (e ops, se já visível) |
| 5 | CMS (conteúdos/links) | **Prefeitura e ACA** |
| 6 | Super Admin | **Não** — sem conta seed; Prefeitura é o topo operacional; papel permanece no código só por compatibilidade |

### Nota sobre o item 6 (Super Admin) — DECIDIDO

**Não** haverá conta Super Admin no seed. Operação do dia a dia: Prefeitura (`MUNICIPAL_ADMIN`) no topo. O enum `SUPER_ADMIN` pode permanecer no código (mesmas permissões da Prefeitura) para compatibilidade, sem uso demo.

---

## Próximo passo imediato

1. ~~Fechar decisão 6~~ ✅  
2. ~~S1 P0.1 SMTP + P0.3 secrets + P0.4 RBAC + P0.5 WhatsApp~~ ✅ (código; falta preencher `SMTP_*` no ambiente real)  
3. ~~P0.2 Supabase Storage~~ ✅ (código; criar bucket privado `emprega-arcoverde-docs` no Supabase)  
4. **Próximo:** P1 — limpar “em breve”, CMS (ACA+Prefeitura), settings, contato, multi-usuário  

### Checklist operacional P0 (você)

- [ ] Preencher `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (e porta) no `.env` / Vercel  
- [ ] Criar bucket **privado** no Supabase Storage com o nome de `STORAGE_BUCKET`  
- [ ] Confirmar `SUPABASE_SERVICE_ROLE_KEY` no deploy  
- [ ] Testar reset de senha com e-mail real em staging  

Não abrir P1 em produção até o checklist acima.

---

*Documento gerado para guiar o fechamento do Emprega Arcoverde como produto final. Atualizar este arquivo a cada sprint concluída.*
