/**
 * Cria entrevistas de teste reais para a empresa demo (comercio).
 * Uso: node prisma/seed-interviews.js
 * Não apaga o banco — só agenda/reagenda entrevistas nas candidaturas existentes.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function atDayHour(base, dayOffset, hour, minute = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  const companyUser = await prisma.user.findUnique({
    where: { email: "empresa.comercio@demo.com" },
    include: { companyMemberships: { include: { company: true } } },
  });

  if (!companyUser?.companyMemberships?.[0]) {
    throw new Error(
      "Empresa demo não encontrada (empresa.comercio@demo.com). Rode o seed principal primeiro."
    );
  }

  const company = companyUser.companyMemberships[0].company;
  console.log(`Empresa: ${company.tradeName || company.name}`);

  const applications = await prisma.application.findMany({
    where: { job: { companyId: company.id } },
    include: {
      candidate: { select: { fullName: true } },
      job: { select: { title: true } },
      interview: true,
    },
    orderBy: { matchScore: "desc" },
    take: 8,
  });

  if (applications.length === 0) {
    throw new Error("Nenhuma candidatura na empresa demo. Rode o seed principal.");
  }

  const now = new Date();
  const plans = [
    {
      dayOffset: 0,
      hour: 10,
      minute: 0,
      modality: "PRESENCIAL",
      location: "Sala do RH — Loja Centro, Arcoverde",
      interviewer: "Roberto Silva",
      instructions: "Levar documento com foto e currículo impresso.",
    },
    {
      dayOffset: 0,
      hour: 15,
      minute: 30,
      modality: "ONLINE",
      location: "https://meet.google.com/emprega-demo-1",
      interviewer: "Roberto Silva",
      instructions: "Entrar 5 minutos antes. Câmera ligada.",
    },
    {
      dayOffset: 1,
      hour: 9,
      minute: 0,
      modality: "PRESENCIAL",
      location: "ACA — sala de entrevistas",
      interviewer: "Ana Paula (RH)",
      instructions: "Recepção no térreo.",
    },
    {
      dayOffset: 2,
      hour: 14,
      minute: 0,
      modality: "HIBRIDO",
      location: "Escritório + link backup: meet.google.com/emprega-demo-2",
      interviewer: "Roberto Silva",
      instructions: "Preferência presencial; online se chover.",
    },
    {
      dayOffset: -1,
      hour: 11,
      minute: 0,
      modality: "PRESENCIAL",
      location: "Sala do RH",
      interviewer: "Ana Paula (RH)",
      instructions: "Entrevista já realizada — aguarda feedback.",
      pastPending: true,
    },
    {
      dayOffset: 3,
      hour: 16,
      minute: 0,
      modality: "ONLINE",
      location: "https://meet.google.com/emprega-demo-3",
      interviewer: "Roberto Silva",
      instructions: "Entrevista técnica rápida (30 min).",
    },
  ];

  let created = 0;
  for (let i = 0; i < Math.min(plans.length, applications.length); i++) {
    const app = applications[i];
    const plan = plans[i];
    const scheduledAt = atDayHour(now, plan.dayOffset, plan.hour, plan.minute);

    await prisma.interview.upsert({
      where: { applicationId: app.id },
      update: {
        scheduledAt,
        location: plan.location,
        instructions: plan.instructions,
        modality: plan.modality,
        interviewer: plan.interviewer,
        status: "SCHEDULED",
        feedback: null,
        rating: null,
        completedAt: null,
      },
      create: {
        applicationId: app.id,
        scheduledAt,
        location: plan.location,
        instructions: plan.instructions,
        modality: plan.modality,
        interviewer: plan.interviewer,
        status: "SCHEDULED",
      },
    });

    await prisma.application.update({
      where: { id: app.id },
      data: { status: "INTERVIEW_SCHEDULED" },
    });

    await prisma.applicationStatusHistory.create({
      data: {
        applicationId: app.id,
        status: "INTERVIEW_SCHEDULED",
        notes: `Entrevista teste: ${scheduledAt.toLocaleString("pt-BR")} (${plan.modality})`,
        changedById: companyUser.id,
      },
    });

    created += 1;
    console.log(
      `✓ ${app.candidate.fullName} — ${app.job.title} — ${scheduledAt.toLocaleString("pt-BR")} — ${plan.modality}`
    );
  }

  console.log(`\n${created} entrevistas de teste agendadas.`);
  console.log("Abra /empresa/entrevistas com empresa.comercio@demo.com / senha123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
