/** Janela de edição direta da empresa (ERS RF024 / RN033): 12 horas após o cadastro. */
export const COMPANY_JOB_EDIT_WINDOW_MS = 12 * 60 * 60 * 1000;

export function isWithinCompanyEditWindow(createdAt: Date, now = new Date()): boolean {
  return now.getTime() - createdAt.getTime() <= COMPANY_JOB_EDIT_WINDOW_MS;
}
