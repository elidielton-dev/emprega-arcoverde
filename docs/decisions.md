# Registro de Decisões Técnicas & Premissas Institucionais — Emprega Arcoverde

Este documento registra as principais decisões de engenharia adotadas e cataloga os pontos institucionais abertos para parametrização futura pela comissão gestora de Arcoverde.

---

## 1. Decisões Técnicas

| Decisão | Opção Adotada | Justificativa |
|---|---|---|
| **Arquitetura** | Monólito Modular Next.js (App Router) | Simplicidade de implantação, compartilhamento de tipos e zero complexidade de infraestrutura de microsserviços. |
| **Banco de Dados** | SQLite (Dev) / PostgreSQL (Prod) via Prisma ORM | Permite inicialização local instantânea sem dependências externas instaladas, com compatibilidade estrita para deploy em PostgreSQL gerenciado. |
| **Autenticação** | JWT assinado em Cookies HttpOnly (`jose` + `bcryptjs`) | Sessão protegida contra XSS, sem dependência de provedores de terceiros e com controle RBAC por middleware e Server Components. |
| **Algoritmo de Match** | Determinístico e Explicativo (0-100 pts) | Conformidade com o princípio de decisão humana: o algoritmo não descarta candidatos e explica os motivos da pontuação. |
| **WhatsApp** | Adaptador com flag `WHATSAPP_PROVIDER_ENABLED=false` | Segurança contra uso indevido de métodos não oficiais e respeito estrito ao opt-in do candidato (LGPD). |

---

## 2. Pontos Institucionais Configuráveis para Produção

Os itens abaixo foram entregues com valores padrão/demonstrativos e devem ser parametrizados pela equipe institucional quando da entrada oficial em produção:

1. **Credenciais Oficiais de E-mail**: Configuração da chave de API do provedor (Resend, SendGrid ou servidor SMTP institucional da Prefeitura).
2. **Meta Cloud API (WhatsApp)**: Configuração do número corporativo e cadastro dos templates oficiais aprovados pela Meta.
3. **Catálogo Oficial da Feira de Empregabilidade**: Inserção em lote das empresas parceiras associadas da ACA e suas respectivas vagas oficiais.
4. **Bucket de Storage**: Configuração de credenciais de S3 (AWS, Cloudflare R2 ou MinIO) para armazenamento definitivo de PDFs.
