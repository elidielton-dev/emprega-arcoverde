const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const {
  parseBrazilianResume,
  isContactLine,
  isSkillLine,
  isInstitutionLine,
  isCompanyLine,
  isSubjectOrCadeira,
  headlineFromObjective,
} = require(path.join(__dirname, "../src/lib/resume/br-resume-parser.js"));

const USER_LIKE_CV = `
Elton Silva
Rua: Florencio José de Moura, 08 – Custodia PE | 87999463608 | eltnxz@gmail.com

Objetivo
Atuar como Developer Júnior, aplicando conhecimentos básicos em Java, HTML, CSS e JavaScript no apoio à manutenção de aplicações web e mobile, testes e correção de bugs, com disposição para aprender e colaborar em equipes ágeis.

Experiência Profissional
Estagiário de TI
Prefeitura Municipal
jan 2023 - dez 2023
Apoio na manutenção de sistemas e atendimento ao usuário.

Auxiliar de Informática
Comércio Silva LTDA
2021 - 2022
Instalação de software e suporte aos usuários.

Formação Acadêmica
AESA
Análise e Desenvolvimento de Sistemas
2022 - 2025

Escola Estadual Rotary
Ensino Médio
2018

Cursos
Lógica de Programação
Senac
HTML e CSS
Curso em Vídeo

Disciplinas
Algoritmos I
Orientação a Objetos II
I I

Habilidades
Java
HTML
CSS
JavaScript
Pacote Microsoft 365 (Outlook, Teams, OneDrive)
Instalação e configuração de software
Aprendendo TypeScript
`;

const CLASSIC_BR_CV = `
Maria Souza
Av. Principal, 100 - Arcoverde/PE
(87) 99999-1111
maria.souza@email.com

Objetivo Profissional
Assistente Administrativo

Resumo
Profissional com experiência em atendimento e organização de documentos.

Experiência
Assistente Administrativo
Comércio Silva
2021 - atual
Atendimento ao cliente e controle de estoque.

Formação
Escola Estadual Rotary
Ensino Médio
2018

Habilidades
Excel, Word, Atendimento ao Cliente, Organização
`;

const TRICKY_EDU_SKILLS_CV = `
Pedro Alves
pedro@email.com

Formação
Java
HTML
CSS
AESA
Análise e Desenvolvimento de Sistemas
Cálculo I
Estrutura de Dados

Experiência
Desenvolvedor Júnior
Tech Solutions PE
2023 - atual
Desenvolvimento de APIs.
`;

describe("classificadores linha a linha", () => {
  it("identifica skills e cadeiras", () => {
    assert.equal(isSkillLine("Java"), true);
    assert.equal(isSkillLine("Aprendendo TypeScript"), true);
    assert.equal(isSubjectOrCadeira("Orientação a Objetos II"), true);
    assert.equal(isSubjectOrCadeira("I I"), true);
    assert.equal(isInstitutionLine("Java"), false);
    assert.equal(isInstitutionLine("AESA"), true);
    assert.equal(isInstitutionLine("Escola Estadual Rotary"), true);
  });

  it("não trata descrição como empresa", () => {
    assert.equal(isCompanyLine("Apoio na manutenção de sistemas e atendimento ao usuário."), false);
    assert.equal(isCompanyLine("Prefeitura Municipal"), true);
    assert.equal(isCompanyLine("Comércio Silva LTDA"), true);
  });

  it("contato vs nome", () => {
    assert.equal(
      isContactLine("Rua: Florencio José de Moura, 08 – Custodia PE | 87999463608 | eltnxz@gmail.com"),
      true,
    );
    assert.equal(isContactLine("Elton Silva"), false);
  });
});

describe("objetivo → título", () => {
  it("extrai cargo de Atuar como", () => {
    const h = headlineFromObjective([
      "Atuar como Developer Júnior, aplicando conhecimentos básicos em Java",
    ]);
    assert.match(h, /Developer J[uú]nior/i);
  });
});

describe("modelo completo (usuário + múltiplos)", () => {
  it("preenche empresas, escolas, cadeiras e skills corretamente", () => {
    const r = parseBrazilianResume(USER_LIKE_CV);

    assert.match(r.fullName || "", /Elton/i);
    assert.match(r.headline, /Developer J[uú]nior/i);
    assert.ok(!/Rua:|87999|eltnxz@/i.test(r.headline));

    assert.ok(r.experiences.length >= 2, `esperava 2+ experiências, veio ${r.experiences.length}`);
    assert.match(r.experiences[0].company, /Prefeitura/i);
    assert.match(r.experiences[1].company, /Com[eé]rcio Silva/i);
    assert.ok(!/Apoio na manuten/i.test(r.experiences[0].company));

    assert.ok(r.educations.length >= 2, `esperava 2+ formações, veio ${r.educations.length}`);
    const eduBlob = r.educations.map((e) => `${e.institution} ${e.course}`).join(" | ");
    assert.match(eduBlob, /AESA/i);
    assert.match(eduBlob, /Desenvolvimento|An[aá]lise/i);
    assert.match(eduBlob, /Rotary|Ensino M[eé]dio/i);
    assert.ok(!r.educations.some((e) => /java|html|css|algoritmos|i i/i.test(e.institution)));

    assert.ok(r.courses.some((c) => /Algoritmos|Objetos|I I|L[oó]gica|HTML/i.test(c.title)));

    assert.ok(r.skills.some((s) => /java/i.test(s)));
    assert.ok(r.skills.some((s) => /typescript|TypeScript/i.test(s)));
    assert.ok(!r.skills.some((s) => /^AESA$/i.test(s)));
  });
});

describe("modelo clássico BR", () => {
  it("objetivo curto e resumo separado", () => {
    const r = parseBrazilianResume(CLASSIC_BR_CV);
    assert.match(r.headline, /Assistente Administrativo/i);
    assert.match(r.summary || "", /experiência|atendimento|documentos/i);
    assert.ok(r.experiences.length >= 1);
  });
});

describe("skills na formação não viram universidade", () => {
  it("desvia Java/HTML/cadeiras para skills/cursos", () => {
    const r = parseBrazilianResume(TRICKY_EDU_SKILLS_CV);
    assert.ok(r.educations.some((e) => /AESA/i.test(e.institution)));
    assert.ok(r.educations.some((e) => /Desenvolvimento|An[aá]lise/i.test(e.course)));
    assert.ok(!r.educations.some((e) => /^Java$/i.test(e.institution)));
    assert.ok(!r.educations.some((e) => /^HTML$/i.test(e.institution)));
    assert.ok(r.skills.some((s) => /java|html|css/i.test(s)) || r.courses.some((c) => /C[aá]lculo|Estrutura/i.test(c.title)));
    assert.ok(r.experiences.length >= 1);
    assert.match(r.experiences[0].company, /Tech Solutions/i);
  });
});
