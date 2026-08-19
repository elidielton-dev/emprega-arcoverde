# Emprega Arcoverde — Portal Público de Empregabilidade e Qualificação

> Plataforma web oficial de empregabilidade e qualificação profissional de **Arcoverde - PE**, desenvolvida para conectar trabalhadores, empresas locais, a **Associação Comercial de Arcoverde (ACA)** e a **Secretaria de Desenvolvimento Econômico / Sala do Empreendedor**, com apoio direto à **Feira de Empregabilidade**.

---

## 🎯 Principais Funcionalidades

1. **Portal Público**: Catálogo de vagas com busca textual e filtros avançados (área, contrato, modalidade, escolaridade e CNH), catálogo de cursos gratuitos de qualificação, área editorial com dicas de carreira e links úteis de serviços públicos.
2. **Identidade Visual**: Paleta de cores derivada das marcas do Emprega Arcoverde e da Feira de Empregabilidade (`#E65100`, `#E74C23`, `#F57C00`, `#FDBA2D`, `#2E221F`), com acessibilidade padrão WCAG AA.
3. **Candidatos**: Construtor de currículo digital estruturado com snapshots de versões históricas, upload seguro de anexos em PDF/imagem, cálculo explicável de aderência determinístico (sem descarte automático por IA) e acompanhamento de candidaturas em linha do tempo.
4. **Empresas**: Perfil corporativo, cadastro de vagas (com suporte a **Vagas Confidenciais** que ocultam dados da empresa), fluxo de submissão para moderação e painel exclusivo de triagem de candidatos com isolamento multitenant.
5. **Atendimento Presencial Assistido**: Módulo exclusivo para operadores da Sala do Empreendedor e ACA cadastrarem presencialmente cidadãos sem acesso digital, registrando operador responsável e termo formal de consentimento.
6. **Administração & Governança**: Fila de moderação de vagas, verificação de empresas, banco de talentos, painel de indicadores municipais e exportação de dados em CSV auditada.
7. **Tarefas Agendadas (Cron)**: Encerramento automático de vagas vencidas e expiração de cursos via rota protegida por segredo.
8. **Privacidade e LGPD**: Trilha de auditoria em ações sensíveis, consentimentos formais separados para e-mail e WhatsApp oficial (desativado por padrão).

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js**: v18+ ou v20+
- **NPM**

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
O arquivo `.env` já vem pré-configurado para desenvolvimento com PostgreSQL local:
```bash
cp .env.example .env
docker compose up -d
```

### 3. Inicializar o Banco e Carregar Dados de Demonstração
```bash
npm run db:push
npm run db:seed
```

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```

Acesse o portal em: **[http://localhost:3000](http://localhost:3000)** (ou a porta indicada pelo terminal).

---

## Deploy na Vercel

1. Importe o repositório `elidielton-dev/emprega-arcoverde` em [vercel.com/new](https://vercel.com/new).
2. Cadastre as variáveis de ambiente **antes** do primeiro deploy:
   - `DATABASE_URL` — connection string **Session pooler** do Postgres no Supabase (porta **6543**), com `?pgbouncer=true&sslmode=require`
   - `AUTH_SECRET` — string longa aleatória
   - `APP_URL` — URL do projeto na Vercel (`https://….vercel.app`)
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` — se for usar Google/LinkedIn
3. No Supabase, em **Authentication → URL Configuration**, adicione `https://SEU-DOMINIO.vercel.app/auth/callback`.
4. Depois do primeiro deploy, rode o seed **uma vez** apontando para o mesmo `DATABASE_URL`:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

O Postgres do Docker na sua máquina **não** funciona na Vercel. O banco precisa ser o do Supabase (ou outro Postgres na nuvem).

---

## 🔑 Contas de Demonstração (Ambiente Dev)

Todas as contas utilizam a senha padrão: **`senha123`**

| Papel | E-mail | Perfil / Permissões |
|---|---|---|
| **Candidato Demonstrativo** | `candidato.demo@demo.com` | Currículo estruturado, acompanhamento de processos e match |
| **Candidato Assistido** | `candidato.assistido@demo.com` | Cadastrado presencialmente na Sala do Empreendedor |
| **Empresa Comercial** | `empresa.comercio@demo.com` | Gestão de vagas e triagem de candidatos |
| **Empresa Logística** | `empresa.logistica@demo.com` | Gestão de vagas de transporte e logística |
| **Operador de Atendimento** | `operador.sala@demo.com` | Módulo de Cadastro Assistido presencial |
| **Administrador ACA** | `admin.aca@demo.com` | Moderação de vagas, parceiros e cursos |
| **Gestor Municipal** | `admin.prefeitura@demo.com` | Governança institucional, indicadores e relatórios |

*(Você também pode utilizar os botões de preenchimento rápido na tela de login em `/entrar`).*

---

## 🧪 Testes Automatizados

Para rodar os testes unitários do algoritmo de compatibilidade e segurança de vagas confidenciais:
```bash
npm test
```

Para verificar a tipagem estrita de TypeScript:
```bash
npx tsc --noEmit
```

Para testar o build de produção:
```bash
npm run build
```

---

## 📚 Documentação Técnica

- [docs/architecture.md](docs/architecture.md): Arquitetura modular, RBAC e segurança.
- [docs/data-model.md](docs/data-model.md): Diagrama de entidades e modelo Prisma.
- [docs/operations.md](docs/operations.md): Cron jobs, adapters de e-mail, WhatsApp e storage.
- [docs/acceptance-checklist.md](docs/acceptance-checklist.md): Checklist de critérios de aceite do MVP.
- [docs/decisions.md](docs/decisions.md): Registro de decisões técnicas e pontos institucionais.
