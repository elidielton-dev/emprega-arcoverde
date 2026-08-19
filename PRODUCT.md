# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Cidadãos de Arcoverde (PE) buscando emprego ou qualificação, muitas vezes pelo celular ou no atendimento presencial da Sala do Empreendedor / ACA. Empresas locais publicam vagas. Operadores e gestores municipais/ACA moderam e fazem cadastro assistido.

## Product Purpose

Portal público e gratuito que conecta trabalhadores, empresas, a Prefeitura e a ACA às vagas da cidade, cursos de qualificação e atendimento presencial. Sucesso é a pessoa encontrar uma vaga (ou um curso) e conseguir se candidatar, inclusive quem não tem internet em casa.

## Positioning

Não é um marketplace nacional de vagas. É o canal oficial de empregabilidade de Arcoverde, ligado à Feira de Empregabilidade, à Sala do Empreendedor e à ACA.

## Operating Context

Uso em casa, no celular e no balcão presencial. Contas de candidato, empresa, operador assistido e admin. Cadastro assistido gratuito para quem não usa computador.

## Capabilities and Constraints

- Busca de vagas por texto e categoria (`GET /vagas?q=`).
- Currículo, candidaturas, publicação de vagas, cursos, conteúdos, links úteis, atendimento assistido.
- Next.js 14 App Router, Prisma, SQLite, sessão por cookie JWT.
- Rota `/entrar` precisa funcionar de verdade (form POST + sessão).
- Painéis `/painel`, `/empresa` e `/admin` ficam fora desta etapa de visual da home.

## Brand Commitments

- Nome: Emprega Arcoverde. Evento: Feira de Empregabilidade — “Arcoverde — Oportunidades que transformam”.
- Logo oficial aberta (gráfico de barras + swoosh + texto), sem o selo circular.
- Logo oficial da Feira (sol radiante + texto) entra no lugar do selo SVG inventado.
- Sem banner de campanha na home (decisão do responsável).
- Primeira dobra: busca grande no topo. Anti-referência: hero creme com blobs, Inter e ícones genéricos de IA.

## Evidence on Hand

- `public/brand/logo-emprega.png`
- `public/brand/logo-feira.png`
- Copy institucional já no site (Sala do Empreendedor, ACA, endereço, telefone). Não inventar depoimentos, números de colocação ou parceiros não citados.

## Product Principles

- A ação principal é buscar vaga, não “explorar um produto”.
- A marca oficial entra como arquivo, não como SVG aproximado.
- Quem não usa computador ainda precisa ser convidado ao atendimento presencial.
- Rotas públicas existentes continuam; o que estava quebrado (`/entrar`) precisa fechar o ciclo.

## Accessibility & Inclusion

Portal público municipal: foco visível, contraste, cadastro assistido presencial, declaração de acessibilidade em `/acessibilidade`.
