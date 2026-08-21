# Checklist de Critérios de Aceite — Emprega Arcoverde

Este documento valida todos os critérios de aceite obrigatórios definidos no escopo do projeto:

- [x] **1. Portal Público**: Home responsiva com destaque para a Feira de Empregabilidade, busca rápida de vagas, cursos gratuitos em destaque, artigos educativos e orientações sobre a Sala do Empreendedor e ACA.
- [x] **2. Busca e Filtros de Vagas**: Listagem com busca por palavras-chave e filtros por categoria, modalidade, contrato, escolaridade e CNH.
- [x] **3. Candidato & Currículo Estruturado**: Cadastro de perfil, construtor de currículo digital com snapshots versionados, upload seguro de anexos e gestão de privacidade LGPD.
- [x] **4. Compatibilidade Explicável**: Cálculo determinístico de aderência de 0 a 100 pontos com justificativas transparentes para o candidato e recrutador (sem descarte por IA).
- [x] **5. Acompanhamento de Candidatura**: Linha do tempo com status (`SUBMITTED`, `UNDER_REVIEW`, `CONTACT_SELECTED`, `INTERVIEW_SCHEDULED`, `APPROVED`, `NOT_SELECTED`, `WITHDRAWN`) e bloqueio de candidaturas duplicadas.
- [x] **6. Módulo da Empresa**: Perfil corporativo, criação de vagas em rascunho com fluxo de envio para moderação e isolamento multitenant entre empresas concorrentes.
- [x] **7. Moderação ACA / Prefeitura**: Fluxo completo de aprovação, pausa e rejeição de vagas com justificativa e trilha de auditoria.
- [x] **8. Sigilo de Vagas Confidenciais**: Proteção integral que oculta qualquer dado identificador da empresa em listagens, rotas, metadados e e-mails.
- [x] **9. Atendimento Presencial Assistido**: Fluxo guiado para operadores da Sala do Empreendedor e ACA cadastrarem cidadãos sem acesso à internet, com registro de operador e termo de consentimento formal.
- [x] **10. Cursos de Qualificação**: Catálogo administrável com registro de métricas de clique em inscrições externas e expiração automática.
- [x] **11. Painel de Indicadores**: Métricas municipais agregadas e gráficos consolidados sem expor dados pessoais sensíveis, com exportação CSV auditada.
- [x] **12. Tarefas Agendadas (Cron)**: Rota `/api/cron/jobs` protegida por `CRON_SECRET` para encerramento de vagas vencidas e expiração de cursos.
- [~] **13. E-mail e WhatsApp**: E-mail via SMTP Prefeitura (`SMTP_*`); mock só sem SMTP. WhatsApp oficial **não** faz parte do produto — só links `wa.me`.
- [x] **14. Qualidade e Testes**: Testes automatizados cobrindo algoritmo de compatibilidade e segurança de vagas confidenciais; build sem erros de TypeScript.
