const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const { resumePdfBuffer } = require("./simple-pdf");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando o seed do Emprega Arcoverde...");

  // Limpar tabelas existentes em ordem reversa
  await prisma.auditLog.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.applicationStatusHistory.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.resumeCourse.deleteMany();
  await prisma.resumeEducation.deleteMany();
  await prisma.resumeExperience.deleteMany();
  await prisma.resumeVersion.deleteMany();
  await prisma.candidateDocument.deleteMany();
  await prisma.candidateProfile.deleteMany();
  await prisma.jobPublicationReview.deleteMany();
  await prisma.job.deleteMany();
  await prisma.jobCategory.deleteMany();
  await prisma.companyMember.deleteMany();
  await prisma.company.deleteMany();
  await prisma.courseClickEvent.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseProvider.deleteMany();
  await prisma.article.deleteMany();
  await prisma.contentCategory.deleteMany();
  await prisma.usefulLink.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("senha123", 10);

  // 1. Criar Usuários Fictícios de Demonstração
  const adminMunicipal = await prisma.user.create({
    data: {
      name: "Maria Eduarda (Gestora Municipal)",
      email: "admin.prefeitura@demo.com",
      passwordHash,
      role: "MUNICIPAL_ADMIN",
      isEmailVerified: true,
    },
  });

  const adminAca = await prisma.user.create({
    data: {
      name: "Carlos Henrique (Diretor ACA)",
      email: "admin.aca@demo.com",
      passwordHash,
      role: "ACA_ADMIN",
      isEmailVerified: true,
    },
  });

  const operatorSala = await prisma.user.create({
    data: {
      name: "Ana Beatriz (Atendimento Sala do Empreendedor)",
      email: "operador.sala@demo.com",
      passwordHash,
      role: "ASSISTED_OPERATOR",
      isEmailVerified: true,
    },
  });

  const companyUser1 = await prisma.user.create({
    data: {
      name: "Roberto Silva (RH Silva Comercial)",
      email: "empresa.comercio@demo.com",
      passwordHash,
      role: "COMPANY_MEMBER",
      isEmailVerified: true,
    },
  });

  const companyUser2 = await prisma.user.create({
    data: {
      name: "Juliana Mendes (RH Moxotó Log)",
      email: "empresa.logistica@demo.com",
      passwordHash,
      role: "COMPANY_MEMBER",
      isEmailVerified: true,
    },
  });

  const candidateUser1 = await prisma.user.create({
    data: {
      name: "Lucas Gabriel de Souza",
      email: "candidato.demo@demo.com",
      passwordHash,
      role: "CANDIDATE",
      isEmailVerified: true,
    },
  });

  const candidateUser2 = await prisma.user.create({
    data: {
      name: "Severino Alves de Lima",
      email: "candidato.assistido@demo.com",
      passwordHash,
      role: "CANDIDATE",
      isEmailVerified: true,
    },
  });

  const candidateCamila = await prisma.user.create({
    data: {
      name: "Camila Ferreira da Silva",
      email: "candidata.camila@demo.com",
      passwordHash,
      role: "CANDIDATE",
      isEmailVerified: true,
    },
  });

  const candidateJoao = await prisma.user.create({
    data: {
      name: "João Pedro dos Santos",
      email: "candidato.joao@demo.com",
      passwordHash,
      role: "CANDIDATE",
      isEmailVerified: true,
    },
  });

  const candidateFernanda = await prisma.user.create({
    data: {
      name: "Fernanda Oliveira Lima",
      email: "candidata.fernanda@demo.com",
      passwordHash,
      role: "CANDIDATE",
      isEmailVerified: true,
    },
  });

  console.log("✅ Usuários criados com sucesso.");

  // 2. Criar Empresas Demonstrativas
  const company1 = await prisma.company.create({
    data: {
      name: "Comércio Silva & Filhos Ltda",
      tradeName: "Supermercado & Magazine Silva",
      cnpj: "12.345.678/0001-90",
      email: "contato@silvacomercial.demo.com",
      phone: "(87) 3821-1000",
      city: "Arcoverde",
      state: "PE",
      address: "Av. Antônio Japiassu, 450 - Centro",
      description: "Tradicional rede de comércio varejista e atacadista de alimentos e utilidades em Arcoverde.",
      isVerified: true,
      members: {
        create: {
          userId: companyUser1.id,
          role: "OWNER",
        },
      },
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: "Moxotó Logística e Distribuição S/A",
      tradeName: "Moxotó Express",
      cnpj: "23.456.789/0001-01",
      email: "rh@moxotolog.demo.com",
      phone: "(87) 3822-2500",
      city: "Arcoverde",
      state: "PE",
      address: "Distrito Industrial, Galpão 03",
      description: "Empresa de armazenagem, logística refrigerada e transporte para o interior de Pernambuco.",
      isVerified: true,
      members: {
        create: {
          userId: companyUser2.id,
          role: "OWNER",
        },
      },
    },
  });

  const companyConfidential = await prisma.company.create({
    data: {
      name: "Grande Grupo Atacadista Regional",
      tradeName: "Empresa Confidencial",
      cnpj: "34.567.890/0001-12",
      email: "recrutamento.sigiloso@demo.com",
      city: "Arcoverde",
      state: "PE",
      description: "Grande player regional do setor de distribuição em processo de expansão estratégica.",
      isVerified: true,
      isConfidentialDefault: true,
    },
  });

  console.log("✅ Empresas criadas.");

  // 3. Categorias de Vagas
  const catAdmin = await prisma.jobCategory.create({
    data: { name: "Administração e Escritório", slug: "administracao", order: 1 },
  });
  const catComercio = await prisma.jobCategory.create({
    data: { name: "Comércio e Atendimento ao Cliente", slug: "comercio-atendimento", order: 2 },
  });
  const catLogistica = await prisma.jobCategory.create({
    data: { name: "Logística, Transporte e Estoque", slug: "logistica-transporte", order: 3 },
  });
  const catTech = await prisma.jobCategory.create({
    data: { name: "Tecnologia da Informação e Suporte", slug: "tecnologia-ti", order: 4 },
  });
  const catServicos = await prisma.jobCategory.create({
    data: { name: "Serviços Gerais e Manutenção", slug: "servicos-gerais", order: 5 },
  });

  console.log("✅ Categorias criadas.");

  // 4. Vagas de Demonstração
  const job1 = await prisma.job.create({
    data: {
      title: "Assistente Administrativo e Financeiro",
      slug: "assistente-administrativo-financeiro-silva",
      companyId: company1.id,
      categoryId: catAdmin.id,
      createdById: companyUser1.id,
      summary: "Atuação em rotinas de contas a pagar/receber, emissão de notas fiscais e atendimento telefônico.",
      description: `Buscamos um(a) profissional organizado(a) e proativo(a) para compor o time administrativo em Arcoverde.\n\nPrincipais atividades:\n- Controle de planilhas e fluxo de caixa diário\n- Emissão e conferência de notas fiscais eletrônicas\n- Suporte ao departamento de compras e estoque\n- Atendimento cordial a fornecedores e clientes`,
      contractType: "CLT",
      workplaceType: "PRESENCIAL",
      city: "Arcoverde",
      state: "PE",
      salaryMin: 1550,
      salaryMax: 1850,
      hideSalary: false,
      vacanciesCount: 2,
      educationLevel: "MEDIO",
      experienceRequired: "6_MESES",
      driverLicense: "NENHUMA",
      requirements: "- Ensino Médio completo (desejável cursando Administração ou Ciências Contábeis)\n- Domínio básico a intermediário de Excel\n- Boa comunicação verbal e escrita\n- Residir em Arcoverde ou proximidades",
      skillsText: "Excel, Atendimento ao Cliente, Emissão de NFe, Organização, Rotinas Administrativas",
      tags: "Administrativo, Varejo, CLT, Arcoverde",
      isConfidential: false,
      status: "PUBLISHED",
      applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 dias à frente
      viewsCount: 84,
      publishedAt: new Date(),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: "Operador de Caixa e Atendimento",
      slug: "operador-de-caixa-atendimento-silva",
      companyId: company1.id,
      categoryId: catComercio.id,
      createdById: companyUser1.id,
      summary: "Registro de mercadorias no caixa, recebimento de valores e excelente atendimento ao público.",
      description: `Oportunidade para início imediato com treinamento oferecido pela empresa.\n\nAtividades:\n- Operação de PDV (leitor de código de barras, cartões e dinheiro)\n- Abertura e fechamento de caixa\n- Auxílio na reposição de itens próximos ao caixa\n- Tirar dúvidas básicas de clientes com gentileza`,
      contractType: "CLT",
      workplaceType: "PRESENCIAL",
      city: "Arcoverde",
      state: "PE",
      salaryMin: 1412,
      salaryMax: 1550,
      hideSalary: true,
      vacanciesCount: 4,
      educationLevel: "MEDIO",
      experienceRequired: "SEM_EXPERIENCIA",
      driverLicense: "NENHUMA",
      requirements: "- Ensino Médio completo\n- Disponibilidade para trabalhar em escala de comércio (segunda a sábado)\n- Simpatia, atenção aos detalhes e vontade de aprender",
      skillsText: "Atendimento ao Cliente, Caixa, Pontualidade, Boa Comunicação",
      tags: "Primeiro Emprego, Varejo, Caixa, Arcoverde",
      isConfidential: false,
      status: "PUBLISHED",
      applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
      viewsCount: 152,
      publishedAt: new Date(),
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: "Motorista de Entregas Regionais (CNH B)",
      slug: "motorista-de-entregas-regionais-moxoto",
      companyId: company2.id,
      categoryId: catLogistica.id,
      createdById: companyUser2.id,
      summary: "Condução de veículo utilitário para distribuição de encomendas em Arcoverde e região do Moxotó.",
      description: `Responsável pelo transporte seguro, conferência de romaneios e entrega pontual de produtos aos clientes.\n\nAtividades:\n- Realizar rotas pré-estabelecidas nos municípios de Arcoverde, Sertânia, Pesqueira e arredores\n- Conferir mercadorias com a nota fiscal\n- Coletar assinaturas de recebimento e zelar pelo veículo`,
      contractType: "CLT",
      workplaceType: "PRESENCIAL",
      city: "Arcoverde",
      state: "PE",
      salaryMin: 1750,
      salaryMax: 2100,
      hideSalary: false,
      vacanciesCount: 1,
      educationLevel: "MEDIO",
      experienceRequired: "1_ANO",
      driverLicense: "B",
      requirements: "- CNH Categoria B definitiva e válida com EAR\n- Experiência comprovada com direção em estradas\n- Conhecimento da malha rodoviária da região",
      skillsText: "Direção Defensiva, Entregas, CNH B, Conferência de Carga, Logística",
      tags: "Motorista, Transporte, CNH B, Logística",
      isConfidential: false,
      status: "PUBLISHED",
      applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      viewsCount: 96,
      publishedAt: new Date(),
    },
  });

  // Vaga Confidencial
  const jobConfidential = await prisma.job.create({
    data: {
      title: "Gerente de Operações e Vendas (Confidencial)",
      slug: "gerente-de-operacoes-vendas-confidencial",
      companyId: companyConfidential.id,
      categoryId: catComercio.id,
      createdById: adminAca.id,
      summary: "Liderança de equipe comercial, gestão de metas de faturamento e planejamento estratégico de loja.",
      description: `Empresa de grande porte contrata profissional experiente para liderar operação comercial em Arcoverde.\n\nPrincipais atribuições:\n- Gestão de equipe de mais de 20 colaboradores\n- Acompanhamento de indicadores diários de desempenho (KPIs)\n- Desenvolvimento de campanhas promocionais locais\n- Relacionamento com fornecedores de alto volume`,
      contractType: "CLT",
      workplaceType: "PRESENCIAL",
      city: "Arcoverde",
      state: "PE",
      salaryMin: 3200,
      salaryMax: 4500,
      hideSalary: true,
      vacanciesCount: 1,
      educationLevel: "SUPERIOR",
      experienceRequired: "2_ANOS",
      driverLicense: "B",
      requirements: "- Ensino Superior completo em Administração, Marketing, Gestão Comercial ou áreas correlatas\n- Experiência sólida com gestão de equipes de vendas\n- Habilidade analítica e liderança participativa",
      skillsText: "Liderança, Gestão de Metas, Vendas, Estratégia Comercial, Negociação",
      tags: "Gestão, Gerência, Vendas, Confidencial",
      isConfidential: true, // FLAG CONFIDENCIAL OBRIGATÓRIA
      status: "PUBLISHED",
      applicationDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 25),
      viewsCount: 45,
      publishedAt: new Date(),
    },
  });

  const extraJobDefs = [
    {
      title: "Técnico de Informática e Suporte",
      slug: "tecnico-informatica-suporte-arcoverde",
      companyId: company1.id,
      categoryId: catTech.id,
      summary: "Atendimento de chamados, manutenção de computadores e apoio aos sistemas da loja.",
      contractType: "CLT",
      educationLevel: "TECNICO",
    },
    {
      title: "Auxiliar de Serviços Gerais",
      slug: "auxiliar-servicos-gerais-arcoverde",
      companyId: company1.id,
      categoryId: catServicos.id,
      summary: "Conservação do espaço, organização das áreas comuns e apoio à rotina da loja.",
      contractType: "CLT",
      educationLevel: "FUNDAMENTAL",
    },
    {
      title: "Atendente de Farmácia",
      slug: "atendente-farmacia-arcoverde",
      companyId: company1.id,
      categoryId: catComercio.id,
      summary: "Atendimento no balcão, organização de prateleiras e apoio ao caixa da farmácia.",
      contractType: "CLT",
      educationLevel: "MEDIO",
    },
    {
      title: "Auxiliar de Cozinha",
      slug: "auxiliar-de-cozinha-arcoverde",
      companyId: company2.id,
      categoryId: catServicos.id,
      summary: "Preparo de alimentos, higiene da cozinha e apoio ao refeitório da operação.",
      contractType: "CLT",
      educationLevel: "FUNDAMENTAL",
    },
    {
      title: "Conferente de Carga",
      slug: "conferente-de-carga-arcoverde",
      companyId: company2.id,
      categoryId: catLogistica.id,
      summary: "Conferência de notas, paletização e controle de entrada e saída no galpão.",
      contractType: "CLT",
      educationLevel: "MEDIO",
    },
    {
      title: "Jovem Aprendiz Administrativo",
      slug: "jovem-aprendiz-administrativo-arcoverde",
      companyId: company1.id,
      categoryId: catAdmin.id,
      summary: "Apoio em arquivos, atendimento telefônico e rotinas simples de escritório.",
      contractType: "APRENDIZ",
      educationLevel: "MEDIO",
    },
  ];

  for (const item of extraJobDefs) {
    await prisma.job.create({
      data: {
        ...item,
        createdById: companyUser1.id,
        description: item.summary,
        workplaceType: "PRESENCIAL",
        city: "Arcoverde",
        state: "PE",
        vacanciesCount: 2,
        experienceRequired: "SEM_EXPERIENCIA",
        driverLicense: "NENHUMA",
        requirements: "Residir em Arcoverde ou região e disponibilidade para horário comercial.",
        skillsText: "Organização, Pontualidade, Trabalho em equipe",
        isConfidential: false,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  // Vaga em Rascunho / Pendente
  await prisma.job.create({
    data: {
      title: "Auxiliar de Almoxarifado e Estoque",
      slug: "auxiliar-de-almoxarifado-estoque-moxoto",
      companyId: company2.id,
      categoryId: catLogistica.id,
      createdById: companyUser2.id,
      summary: "Recebimento, conferência e etiquetagem de cargas no armazém central.",
      description: "Vaga em processo de moderação institucional para posterior publicação na Feira de Empregabilidade.",
      contractType: "CLT",
      workplaceType: "PRESENCIAL",
      city: "Arcoverde",
      state: "PE",
      vacanciesCount: 2,
      educationLevel: "MEDIO",
      requirements: "- Ensino Médio completo\n- Boa disposição física e atenção",
      skillsText: "Armazenagem, Estoque, Organização",
      isConfidential: false,
      status: "PENDING_REVIEW",
    },
  });

  console.log("✅ Vagas criadas.");

  // 5. Perfis de Candidatos e Currículos Estruturados
  const profileLucas = await prisma.candidateProfile.create({
    data: {
      userId: candidateUser1.id,
      fullName: "Lucas Gabriel de Souza",
      phone: "(87) 99654-3210",
      whatsapp: "(87) 99654-3210",
      city: "Arcoverde",
      state: "PE",
      neighborhood: "São Cristóvão",
      birthDate: new Date("1998-05-14"),
      educationLevel: "SUPERIOR",
      driverLicense: "B",
      professionalHeadline: "Assistente Administrativo | Graduando em Administração",
      summary: "Profissional dedicado com experiência em rotinas financeiras, atendimento a clientes e domínio do pacote Office. Busca oportunidades para agregar eficiência na gestão comercial em Arcoverde.",
      availability: "INTEGRAL",
      emailConsent: true,
      whatsappConsent: true,
    },
  });

  const resumeLucas = await prisma.resumeVersion.create({
    data: {
      candidateId: profileLucas.id,
      versionNumber: 1,
      headline: profileLucas.professionalHeadline,
      summary: profileLucas.summary,
      educationLevel: "SUPERIOR",
      driverLicense: "B",
      skillsSnapshot: JSON.stringify(["Excel", "Atendimento ao Cliente", "Rotinas Administrativas", "Emissão de NFe", "Organização"]),
      experiences: {
        create: [
          {
            company: "Mercadinho São Cristóvão",
            position: "Auxiliar de Escritório e Caixa",
            startDate: new Date("2021-02-01"),
            endDate: new Date("2023-08-30"),
            isCurrent: false,
            description: "Atendimento ao público, conciliação diária de cartões e organização de arquivos fiscais.",
          },
        ],
      },
      educations: {
        create: [
          {
            institution: "AESA / CESA Arcoverde",
            course: "Bacharelado em Administração",
            level: "SUPERIOR",
            startDate: new Date("2022-02-01"),
            status: "EM_ANDAMENTO",
          },
        ],
      },
      courses: {
        create: [
          {
            institution: "Sebrae PE",
            title: "Gestão Financeira para Pequenas Empresas",
            completionDate: new Date("2023-05-10"),
            hours: 20,
          },
        ],
      },
    },
  });

  // Candidato Cadastrado em Atendimento Assistido
  const profileSeverino = await prisma.candidateProfile.create({
    data: {
      userId: candidateUser2.id,
      fullName: "Severino Alves de Lima",
      phone: "(87) 98822-1144",
      city: "Arcoverde",
      state: "PE",
      neighborhood: "Cohab 1",
      educationLevel: "MEDIO",
      driverLicense: "B",
      professionalHeadline: "Motorista e Entregador Prático",
      summary: "Profissional com 10 anos de experiência como motorista em Arcoverde e região, conhecedor de todas as rotas do Moxotó.",
      isAssisted: true,
      assistedById: operatorSala.id,
      assistedUnit: "Sala do Empreendedor de Arcoverde",
      assistedNotes: "Atendimento presencial realizado na Sala do Empreendedor. Documentos físicos conferidos e digitalizados pelo operador.",
      emailConsent: true,
      whatsappConsent: false,
    },
  });

  await prisma.resumeVersion.create({
    data: {
      candidateId: profileSeverino.id,
      versionNumber: 1,
      headline: profileSeverino.professionalHeadline,
      summary: profileSeverino.summary,
      educationLevel: "MEDIO",
      driverLicense: "B",
      skillsSnapshot: JSON.stringify(["Direção Defensiva", "Entregas", "CNH B", "Conhecimento de Rotas"]),
      experiences: {
        create: [
          {
            company: "Distribuidora de Água & Gás Arcoverde",
            position: "Motorista Entregador",
            startDate: new Date("2018-01-10"),
            endDate: new Date("2023-12-20"),
            isCurrent: false,
            description: "Entregas pontuais porta a porta e atendimento cordial a residências e empresas.",
          },
        ],
      },
      educations: {
        create: [
          {
            institution: "Escola Estadual Rotary",
            course: "Ensino Médio Geral",
            level: "MEDIO",
            status: "CONCLUIDO",
          },
        ],
      },
    },
  });

  console.log("✅ Candidatos e currículos estruturados criados.");

  const profileCamila = await prisma.candidateProfile.create({
    data: {
      userId: candidateCamila.id,
      fullName: "Camila Ferreira da Silva",
      phone: "(87) 99122-3344",
      city: "Arcoverde",
      state: "PE",
      educationLevel: "MEDIO",
      professionalHeadline: "Atendente de loja | Experiência em comércio",
      summary: "Experiência em atendimento ao público e organização de prateleiras no comércio de Arcoverde.",
      emailConsent: true,
      whatsappConsent: true,
    },
  });
  const resumeCamila = await prisma.resumeVersion.create({
    data: {
      candidateId: profileCamila.id,
      versionNumber: 1,
      headline: profileCamila.professionalHeadline,
      summary: profileCamila.summary,
      educationLevel: "MEDIO",
      isCurrent: true,
    },
  });

  const profileJoao = await prisma.candidateProfile.create({
    data: {
      userId: candidateJoao.id,
      fullName: "João Pedro dos Santos",
      phone: "(87) 99988-7766",
      city: "Arcoverde",
      state: "PE",
      educationLevel: "MEDIO",
      professionalHeadline: "Auxiliar de logística e conferência",
      summary: "Rotina de galpão, conferência de carga e organização de estoque.",
      emailConsent: true,
      whatsappConsent: true,
    },
  });
  const resumeJoao = await prisma.resumeVersion.create({
    data: {
      candidateId: profileJoao.id,
      versionNumber: 1,
      headline: profileJoao.professionalHeadline,
      summary: profileJoao.summary,
      educationLevel: "MEDIO",
      isCurrent: true,
    },
  });

  const profileFernanda = await prisma.candidateProfile.create({
    data: {
      userId: candidateFernanda.id,
      fullName: "Fernanda Oliveira Lima",
      phone: "(87) 99811-2233",
      city: "Arcoverde",
      state: "PE",
      educationLevel: "SUPERIOR",
      professionalHeadline: "Assistente administrativa",
      summary: "Rotinas de escritório, Excel básico e atendimento telefônico.",
      emailConsent: true,
      whatsappConsent: true,
    },
  });
  const resumeFernanda = await prisma.resumeVersion.create({
    data: {
      candidateId: profileFernanda.id,
      versionNumber: 1,
      headline: profileFernanda.professionalHeadline,
      summary: profileFernanda.summary,
      educationLevel: "SUPERIOR",
      isCurrent: true,
    },
  });

  // 6. Criar Candidaturas Demonstrativas com cálculo de match
  await prisma.application.create({
    data: {
      jobId: job1.id,
      candidateId: profileLucas.id,
      resumeVersionId: resumeLucas.id,
      origin: "SELF",
      status: "UNDER_REVIEW",
      matchScore: 95,
      matchExplanation: JSON.stringify([
        "Sua área principal corresponde à vaga (+30 pts)",
        "Você possui 4 de 5 habilidades desejadas (+20 pts)",
        "Sua escolaridade atende ao requisito da vaga (+20 pts)",
        "Sua cidade/localidade é compatível com a vaga (+10 pts)",
        "Não exige CNH específica (+10 pts)",
        "Perfil profissional elegível para análise (+5 pts)",
      ]),
      statusHistory: {
        create: [
          {
            status: "SUBMITTED",
            notes: "Candidatura submetida pelo portal.",
            changedById: candidateUser1.id,
          },
          {
            status: "UNDER_REVIEW",
            notes: "Currículo visualizado pela equipe de RH.",
            changedById: companyUser1.id,
          },
        ],
      },
    },
  });

  await prisma.application.createMany({
    data: [
      {
        jobId: job1.id,
        candidateId: profileFernanda.id,
        resumeVersionId: resumeFernanda.id,
        origin: "SELF",
        status: "SUBMITTED",
        matchScore: 82,
      },
      {
        jobId: job1.id,
        candidateId: profileCamila.id,
        resumeVersionId: resumeCamila.id,
        origin: "SELF",
        status: "CONTACT_SELECTED",
        matchScore: 70,
      },
      {
        jobId: job2.id,
        candidateId: profileCamila.id,
        resumeVersionId: resumeCamila.id,
        origin: "SELF",
        status: "UNDER_REVIEW",
        matchScore: 88,
      },
      {
        jobId: job2.id,
        candidateId: profileJoao.id,
        resumeVersionId: resumeJoao.id,
        origin: "SELF",
        status: "SUBMITTED",
        matchScore: 64,
      },
      {
        jobId: job2.id,
        candidateId: profileLucas.id,
        resumeVersionId: resumeLucas.id,
        origin: "SELF",
        status: "SUBMITTED",
        matchScore: 71,
      },
      {
        jobId: job3.id,
        candidateId: profileSeverino.id,
        origin: "ASSISTED",
        status: "UNDER_REVIEW",
        matchScore: 90,
      },
      {
        jobId: job3.id,
        candidateId: profileJoao.id,
        resumeVersionId: resumeJoao.id,
        origin: "SELF",
        status: "SUBMITTED",
        matchScore: 68,
      },
    ],
  });

  console.log("✅ Candidaturas registradas.");

  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const pdfCandidates = [
    {
      profile: profileLucas,
      user: candidateUser1,
      resume: resumeLucas,
      experiences: ["Auxiliar de Escritorio e Caixa no Mercadinho Sao Cristovao."],
      skills: "Excel, Atendimento ao Cliente, Rotinas Administrativas",
    },
    {
      profile: profileSeverino,
      user: candidateUser2,
      resume: { headline: profileSeverino.professionalHeadline, summary: profileSeverino.summary },
      experiences: ["Motorista Entregador na Distribuidora de Agua & Gas Arcoverde."],
      skills: "Direcao Defensiva, Entregas, CNH B",
    },
    {
      profile: profileCamila,
      user: candidateCamila,
      resume: resumeCamila,
      experiences: ["Atendimento no comercio local de Arcoverde."],
      skills: "Atendimento, Organizacao, Pontualidade",
    },
    {
      profile: profileJoao,
      user: candidateJoao,
      resume: resumeJoao,
      experiences: ["Conferencia de carga e organizacao de estoque."],
      skills: "Logistica, Conferencia, Organizacao",
    },
    {
      profile: profileFernanda,
      user: candidateFernanda,
      resume: resumeFernanda,
      experiences: ["Rotinas de escritorio e atendimento telefonico."],
      skills: "Excel, Atendimento telefonico, Organizacao",
    },
  ];

  const educationLabels = {
    FUNDAMENTAL: "Ensino Fundamental",
    MEDIO: "Ensino Medio",
    TECNICO: "Ensino Tecnico",
    SUPERIOR: "Ensino Superior",
    POS: "Pos-graduacao",
  };

  for (const item of pdfCandidates) {
    const buffer = resumePdfBuffer({
      name: item.profile.fullName,
      headline: item.resume.headline || item.profile.professionalHeadline,
      city: item.profile.city,
      state: item.profile.state,
      phone: item.profile.phone,
      email: item.user.email,
      summary: item.resume.summary || item.profile.summary,
      education: educationLabels[item.profile.educationLevel] || item.profile.educationLevel,
      experiences: item.experiences,
      skills: item.skills,
    });
    const fileName = `curriculo-${item.profile.fullName.split(" ")[0].toLowerCase()}.pdf`;
    const fileKey = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}`;
    fs.writeFileSync(path.join(uploadsDir, fileKey), buffer);
    await prisma.candidateDocument.create({
      data: {
        candidateId: item.profile.id,
        title: "Curriculo",
        fileKey,
        fileName,
        fileSize: buffer.length,
        mimeType: "application/pdf",
        documentType: "RESUME",
        uploadedById: item.user.id,
      },
    });
  }

  console.log("✅ Arquivos PDF de currículo anexados.");

  // 7. Cursos de Qualificação Gratuitos e Parceiros
  const provPrefeitura = await prisma.courseProvider.create({
    data: { name: "Prefeitura de Arcoverde / Sala do Empreendedor" },
  });
  const provSebrae = await prisma.courseProvider.create({
    data: { name: "Sebrae Pernambuco" },
  });
  const provSenai = await prisma.courseProvider.create({
    data: { name: "Senai Arcoverde" },
  });

  await prisma.course.create({
    data: {
      title: "Oficina: Postura Profissional e Preparação para Entrevistas",
      slug: "postura-profissional-preparacao-entrevistas",
      providerId: provPrefeitura.id,
      description: "Treinamento prático presencial com dinâmicas de entrevista, simulação de perguntas e orientações para a Feira de Empregabilidade.",
      targetAudience: "Jovens em busca do primeiro emprego e profissionais em recolocação",
      modality: "PRESENCIAL",
      location: "Auditório da Sala do Empreendedor - Arcoverde",
      hours: 8,
      vacancies: 40,
      externalUrl: "https://docs.google.com/forms/d/e/demo-inscricao-arcoverde/viewform",
      enrollmentEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      status: "ACTIVE",
      clicksCount: 42,
    },
  });

  await prisma.course.create({
    data: {
      title: "Marketing Digital e Vendas no WhatsApp para Pequenos Negócios",
      slug: "marketing-digital-vendas-whatsapp-sebrae",
      providerId: provSebrae.id,
      description: "Aprenda a utilizar o WhatsApp Business e as redes sociais para divulgar produtos, atender com agilidade e aumentar suas vendas.",
      targetAudience: "Microempreendedores, autônomos e atendentes de lojas",
      modality: "ONLINE",
      hours: 15,
      externalUrl: "https://sebrae.com.br/sites/PortalSebrae/cursosonline",
      enrollmentEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      status: "ACTIVE",
      clicksCount: 78,
    },
  });

  await prisma.course.create({
    data: {
      title: "Fundamentos de Armazenagem e Operação Logística",
      slug: "fundamentos-armazenagem-logistica-senai",
      providerId: provSenai.id,
      description: "Curso gratuito com noções de controle de estoque, armazenagem de mercadorias e segurança operacional.",
      targetAudience: "Interessados em atuar no setor de logística e distribuição",
      modality: "PRESENCIAL",
      location: "Unidade Senai Arcoverde",
      hours: 40,
      vacancies: 25,
      externalUrl: "https://pe.senai.br/cursos-gratuitos",
      enrollmentEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 20),
      status: "ACTIVE",
      clicksCount: 31,
    },
  });

  console.log("✅ Cursos criados.");

  // 8. Artigos Editoriais / Dicas de Empregabilidade
  const catDicas = await prisma.contentCategory.create({
    data: { name: "Orientação e Currículo", slug: "orientacao-curriculo", order: 1 },
  });
  const catEntrevista = await prisma.contentCategory.create({
    data: { name: "Entrevistas e Seleção", slug: "entrevistas-selecao", order: 2 },
  });
  const catEventos = await prisma.contentCategory.create({
    data: { name: "Feira de Empregabilidade", slug: "feira-empregabilidade", order: 3 },
  });

  await prisma.article.create({
    data: {
      title: "Como preparar um currículo claro e objetivo para vagas em Arcoverde",
      slug: "como-preparar-curriculo-claro-objetivo-arcoverde",
      summary: "Confira o passo a passo para destacar suas experiências, cursos e contatos de forma profissional e direta.",
      content: `Montar um currículo eficiente não precisa ser complicado. Os recrutadores das empresas de Arcoverde e região valorizam principalmente a clareza das informações e a facilidade de contato.\n\n![Atendimento presencial para montar o currículo na Sala do Empreendedor.](/articles/inline-atendimento.jpg)\n\n### Dados de contato atualizados\nCertifique-se de que seu telefone e WhatsApp estão corretos. Muitas oportunidades são perdidas porque a empresa não consegue falar com o candidato.\n\n### Destaque suas habilidades\nMesmo que você não tenha carteira assinada anterior, liste trabalhos autônomos, projetos comunitários e cursos de capacitação realizados.\n\n### Use o Emprega Arcoverde\nAo manter seu perfil preenchido na plataforma, seu currículo fica disponível para triagem imediata das empresas locais e você pode atualizá-lo sempre que fizer um novo curso.`,
      coverImageUrl: "/articles/cover-curriculo.jpg",
      categoryId: catDicas.id,
      authorName: "Equipe Emprega Arcoverde",
      readTimeMinutes: 3,
      publishedAt: new Date(),
    },
  });

  await prisma.article.create({
    data: {
      title: "Feira de Empregabilidade de Arcoverde: Oportunidades que Transformam",
      slug: "feira-de-empregabilidade-arcoverde-guia-completo",
      summary: "Saiba tudo sobre o grande evento de conexão entre trabalhadores, empresas locais e cursos gratuitos de capacitação.",
      content: `A **Feira de Empregabilidade de Arcoverde** é uma realização conjunta da Prefeitura de Arcoverde e da Associação Comercial de Arcoverde (ACA), unindo forças para dinamizar a economia local e gerar oportunidades reais de trabalho e renda.\n\n### O que você encontrará no evento\n- Estandes de empresas contratantes recebendo currículos\n- Balcão de atendimento assistido para cadastro digital\n- Inscrições em cursos gratuitos do Sistema S (Senai, Senac, Sebrae)\n- Palestras rápidas de orientação vocacional`,
      coverImageUrl: "/articles/cover-feira.jpg",
      categoryId: catEventos.id,
      authorName: "Comissão Organizadora ACA / Prefeitura",
      readTimeMinutes: 4,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Artigos editoriais criados.");

  // 9. Links Úteis do Cidadão e Trabalhador
  await prisma.usefulLink.createMany({
    data: [
      {
        title: "Carteira de Trabalho Digital",
        description: "Acesse seu documento oficial de trabalho, contratos ativos e histórico pelo portal Gov.br.",
        url: "https://www.gov.br/pt-br/temas/carteira-de-trabalho-digital",
        category: "Trabalhador",
        order: 1,
      },
      {
        title: "Portal do Empreendedor (MEI)",
        description: "Emissão de DAS, abertura de MEI e regularização de atividades na Sala do Empreendedor.",
        url: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
        category: "Empreendedor",
        order: 2,
      },
      {
        title: "Seguro-Desemprego (Gov.br)",
        description: "Solicite o benefício do seguro-desemprego de forma 100% online sem filas.",
        url: "https://www.gov.br/pt-br/servicos/solicitar-o-seguro-desemprego",
        category: "Trabalhador",
        order: 3,
      },
      {
        title: "Portal Oficial da Prefeitura de Arcoverde",
        description: "Notícias, serviços municipais, editais e informações sobre secretarias.",
        url: "https://arcoverde.pe.gov.br",
        category: "Governo",
        order: 4,
      },
      {
        title: "Associação Comercial de Arcoverde (ACA)",
        description: "Apoio ao comércio, capacitação empresarial e fortalecimento do mercado local.",
        url: "https://acaarcoverde.com.br",
        category: "Governo",
        order: 5,
      },
    ],
  });

  // 10. Trilha de Auditoria Inicial
  await prisma.auditLog.create({
    data: {
      userId: adminAca.id,
      action: "SYSTEM_INITIALIZED",
      resourceType: "System",
      details: JSON.stringify({ message: "Seed de demonstração e parâmetros iniciais carregados com sucesso." }),
    },
  });

  console.log("🎉 Seed do Emprega Arcoverde finalizado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
