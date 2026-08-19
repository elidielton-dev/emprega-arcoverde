import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Informe um e-mail válido").toLowerCase().trim(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["CANDIDATE", "COMPANY_MEMBER"]).default("CANDIDATE"),
  acceptTerms: z.boolean().refine((v) => v === true, "Você deve aceitar os termos de uso e privacidade"),
});

export const LoginSchema = z.object({
  email: z.string().email("Informe um e-mail válido").toLowerCase().trim(),
  password: z.string().min(1, "Informe sua senha"),
});

export const JobSchema = z.object({
  title: z.string().min(3, "O título da vaga é obrigatório"),
  categoryId: z.string().min(1, "Selecione uma área/categoria"),
  summary: z.string().min(10, "Informe um resumo claro da vaga"),
  description: z.string().min(20, "Informe a descrição completa da vaga"),
  contractType: z.enum(["CLT", "PJ", "ESTAGIO", "TEMPORARIO", "APRENDIZ"]),
  workplaceType: z.enum(["PRESENCIAL", "HIBRIDO", "REMOTO"]),
  city: z.string().default("Arcoverde"),
  state: z.string().default("PE"),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  hideSalary: z.boolean().default(true),
  vacanciesCount: z.number().min(1).default(1),
  educationLevel: z.enum(["FUNDAMENTAL", "MEDIO", "TECNICO", "SUPERIOR", "POS"]).default("MEDIO"),
  experienceRequired: z.string().optional(),
  driverLicense: z.string().default("NENHUMA"),
  requirements: z.string().min(5, "Informe os requisitos mínimos"),
  skillsText: z.string().optional(),
  isConfidential: z.boolean().default(false),
  applicationDeadline: z.string().optional(),
});

export const CandidateProfileSchema = z.object({
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  city: z.string().min(2, "Cidade é obrigatória").default("Arcoverde"),
  state: z.string().default("PE"),
  neighborhood: z.string().optional(),
  educationLevel: z.enum(["FUNDAMENTAL", "MEDIO", "TECNICO", "SUPERIOR", "POS"]).default("MEDIO"),
  driverLicense: z.string().default("NENHUMA"),
  professionalHeadline: z.string().optional(),
  summary: z.string().optional(),
  availability: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  emailConsent: z.boolean().default(true),
  whatsappConsent: z.boolean().default(false),
});

export const AssistedServiceSchema = z.object({
  fullName: z.string().min(3, "Nome completo do candidato é obrigatório"),
  email: z.string().email("E-mail válido para identificação"),
  phone: z.string().min(8, "Telefone para contato"),
  city: z.string().default("Arcoverde"),
  educationLevel: z.string().default("MEDIO"),
  driverLicense: z.string().default("NENHUMA"),
  professionalHeadline: z.string().optional(),
  summary: z.string().optional(),
  skills: z.string().optional(),
  assistedUnit: z.string().min(2, "Unidade de atendimento (e.g. Sala do Empreendedor / ACA)"),
  assistedNotes: z.string().optional(),
  consentGiven: z.boolean().refine((v) => v === true, "É obrigatório registrar o consentimento presencial do cidadão"),
});
