# Arquitetura Técnica — Plataforma Emprega Arcoverde

## 1. Visão Geral
O **Emprega Arcoverde** é uma aplicação web completa construída com arquitetura de **monólito modular** em **Next.js (App Router)** com **TypeScript em modo estrito**, **Prisma ORM**, **Tailwind CSS** e **Autenticação Server-side via JWT (HttpOnly Cookies)**.

A plataforma conecta trabalhadores, empresas locais, a Associação Comercial de Arcoverde (**ACA**) e a **Sala do Empreendedor da Prefeitura de Arcoverde**, com foco especial em acessibilidade digital e suporte presencial na Feira de Empregabilidade.

---

## 2. Estrutura de Pastas e Módulos

```text
src/
  app/
    (public)/                  # Portal público (Home, /vagas, /cursos, /conteudos, /links-uteis, /contato, /termos, /privacidade, /acessibilidade)
    (auth)/                    # Autenticação (/entrar, /cadastro, /esqueci-a-senha)
    (candidate)/painel/        # Módulo do Candidato (/painel, /perfil, /curriculo, /candidaturas, /notificacoes, /privacidade)
    (company)/empresa/         # Módulo da Empresa (/empresa, /perfil, /vagas, /vagas/nova, /vagas/[id]/candidaturas)
    (admin)/admin/             # Módulo Administrativo (/admin, /vagas, /atendimento-assistido, /candidatos, /empresas, /cursos, /conteudos, /indicadores, /configuracoes)
    api/                       # Endpoints para ações sensíveis, uploads seguros, métricas de cursos, auditoria e Cron jobs
  components/
    ui/                        # BrandLogo vetorial, Badges, Botões acessíveis
    layout/                    # Navbar responsiva e Footer institucional com contatos da Sala do Empreendedor e ACA
  lib/
    auth/                      # Gestão de sessão JWT (HttpOnly cookies), hash Bcrypt e RBAC
    db/                        # Singleton do Prisma Client
    matching/                  # Algoritmo determinístico e explicável de compatibilidade (0 a 100 pontos)
    mail/                      # Adaptador de e-mails transacionais com driver de console/mock em dev
    storage/                   # Armazenamento privado de arquivos e URLs assinadas de curta duração
    whatsapp/                  # Adaptador oficial de WhatsApp (desativado por padrão / estrito opt-in)
    audit/                     # Registro centralizado de trilha de auditoria e consentimentos LGPD
    validators/                # Validação compartilhada com Zod
prisma/
  schema.prisma                # Modelagem de dados com SQLite (dev local) e compatível com PostgreSQL
  seed.js                      # Dados demonstrativos fictícios e idempotentes
tests/                         # Testes automatizados unitários
docs/                          # Documentação técnica e operacional
```

---

## 3. Matriz de Perfis e Permissões (RBAC)

| Papel | Código | Acesso / Responsabilidades |
|---|---|---|
| Visitante | `VISITOR` | Navega por vagas abertas, catálogo de cursos, artigos e links úteis. |
| Candidato | `CANDIDATE` | Constrói currículo estruturado, anexa arquivos, candidata-se a vagas e acompanha o status de seus processos. |
| Empresa | `COMPANY_MEMBER` | Mantém dados da empresa, cria vagas (que passam por moderação) e faz a triagem das próprias candidaturas. |
| Operador de Atendimento | `ASSISTED_OPERATOR` | Realiza o cadastro presencial assistido de cidadãos na Sala do Empreendedor e na ACA. |
| Administrador ACA | `ACA_ADMIN` | Modera vagas, gerencia empresas, cursos, artigos e acompanha indicadores. |
| Administrador Municipal | `MUNICIPAL_ADMIN` | Governança ampla, auditoria de operadores, gestão de usuários e configurações. |
| Superadministrador | `SUPER_ADMIN` | Acesso de nível técnico e implantação. |

---

## 4. Princípios de Segurança e LGPD

1. **Vagas Confidenciais**: Ocultação estrita de qualquer dado identificador da empresa (razão social, nome fantasia, CNPJ, logo, e-mail) em todas as interfaces públicas, URLs e notificações automáticas.
2. **Isolamento Multitenant**: Nenhuma empresa tem acesso a dados de candidatos ou vagas de outras empresas.
3. **Downloads Seguros**: Os documentos anexados ficam em diretório privado e só podem ser acessados via endpoint `/api/documents/[fileKey]` com validação de permissão no servidor e registro em log de auditoria.
4. **Decisão Humana Obrigatória**: O algoritmo de pontuação de compatibilidade é 100% determinístico e transparente, servindo apenas de orientação e ordenação auxiliar. Não há descarte automatizado por inteligência artificial.
