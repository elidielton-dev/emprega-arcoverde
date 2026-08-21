const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

const {
  parseBrazilianResume,
  isContactLine,
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

Formação Acadêmica
AESA
Análise e Desenvolvimento de Sistemas
2022 - 2025

Cursos
Lógica de Programação
Senac
HTML e CSS
Curso em Vídeo

Habilidades
Java
HTML
CSS
JavaScript
Pacote Microsoft 365 (Outlook, Teams, OneDrive)
Instalação e configuração de software
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

const LINKEDIN_LIKE_CV = `
João Pedro Santos
Software Developer
joao@email.com

About
Desenvolvedor com foco em aplicações web.

Experience
Desenvolvedor Front-end
Tech PE
2022 - Present
React e TypeScript.

Education
UFPE
Ciência da Computação

Skills
React, TypeScript, Node.js, Git
`;

describe("detecção de contato", () => {
  it("identifica linha de endereço+telefone+email", () => {
    assert.equal(
      isContactLine("Rua: Florencio José de Moura, 08 – Custodia PE | 87999463608 | eltnxz@gmail.com"),
      true,
    );
  });

  it("não marca nome como contato", () => {
    assert.equal(isContactLine("Elton Silva"), false);
  });
});

describe("objetivo → título curto", () => {
  it("extrai cargo de 'Atuar como ...'", () => {
    const h = headlineFromObjective([
      "Atuar como Developer Júnior, aplicando conhecimentos básicos em Java",
    ]);
    assert.match(h, /Developer J[uú]nior/i);
    assert.ok(!/@/.test(h));
    assert.ok(!/Rua/i.test(h));
  });
});

describe("modelo currículo do usuário", () => {
  it("mapeia cada campo ao lugar certo", () => {
    const r = parseBrazilianResume(USER_LIKE_CV);

    assert.match(r.fullName || "", /Elton/i);
    assert.ok(!isContactLine(r.headline), `headline contato: ${r.headline}`);
    assert.match(r.headline, /Developer J[uú]nior/i);
    assert.ok(!/Rua:|87999|eltnxz@/i.test(r.headline));

    assert.ok(r.summary && r.summary.length > 40);
    assert.match(r.summary, /Atuar como Developer|Java|JavaScript/i);
    assert.ok(!/^Rua:/i.test(r.summary));

    assert.ok(r.skills.length >= 4);
    assert.ok(r.skills.some((s) => /java/i.test(s)));
    assert.ok(r.skills.some((s) => /html/i.test(s)));
    assert.ok(r.skills.every((s) => s.length < 80));

    assert.ok(r.experiences.length >= 1);
    assert.match(r.experiences[0].position, /Estagi[aá]rio/i);
    assert.match(r.experiences[0].company, /Prefeitura/i);

    assert.ok(r.educations.length >= 1);
    assert.match(r.educations[0].course + r.educations[0].institution, /AESA|Desenvolvimento|An[aá]lise/i);

    assert.ok(r.courses.length >= 1);
  });
});

describe("modelo clássico BR", () => {
  it("objetivo curto no título e resumo separado", () => {
    const r = parseBrazilianResume(CLASSIC_BR_CV);
    assert.match(r.fullName || "", /Maria/i);
    assert.match(r.headline, /Assistente Administrativo/i);
    assert.ok(!isContactLine(r.headline));
    assert.match(r.summary || "", /experiência|atendimento|documentos/i);
    assert.ok(r.experiences.length >= 1);
    assert.ok(r.skills.some((s) => /excel/i.test(s)));
  });
});

describe("modelo LinkedIn-like", () => {
  it("preenche experience/education/skills", () => {
    const r = parseBrazilianResume(LINKEDIN_LIKE_CV);
    assert.match(r.fullName || "", /Jo[aã]o/i);
    assert.ok(r.experiences.length >= 1);
    assert.ok(r.educations.length >= 1);
    assert.ok(r.skills.some((s) => /react/i.test(s)));
  });
});
