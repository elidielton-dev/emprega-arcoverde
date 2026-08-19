const test = require("node:test");
const assert = require("node:assert");

function sanitizeJobForPublic(job) {
  if (job.isConfidential) {
    return {
      ...job,
      company: {
        name: "Empresa Confidencial",
        tradeName: "Empresa Confidencial",
        city: job.city,
        state: job.state,
      },
    };
  }
  return job;
}

test("Sigilo de vaga confidencial: oculta nome real da empresa", () => {
  const confidentialJob = {
    id: "job-123",
    title: "Gerente Regional",
    isConfidential: true,
    city: "Arcoverde",
    state: "PE",
    company: {
      name: "Empresa Super Secreta SA",
      tradeName: "Grupo Secreto",
      cnpj: "00.000.000/0001-00",
    },
  };

  const publicData = sanitizeJobForPublic(confidentialJob);

  assert.strictEqual(publicData.company.name, "Empresa Confidencial");
  assert.strictEqual(publicData.company.tradeName, "Empresa Confidencial");
  assert.strictEqual(publicData.company.cnpj, undefined);
  assert.strictEqual(publicData.title, "Gerente Regional");
});
