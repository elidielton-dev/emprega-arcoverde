export function whatsappLink(phoneDigits: string, message: string) {
  const phone = phoneDigits.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function companyInterestMessage() {
  return "Olá. Sou de uma empresa de Arcoverde e quero cadastro no Emprega Arcoverde. Podem me orientar, por favor?";
}

export function getCompanyContactChannels() {
  return {
    acaPhone: process.env.NEXT_PUBLIC_WHATSAPP_ACA || "558738211234",
    prefeituraPhone: process.env.NEXT_PUBLIC_WHATSAPP_PREFEITURA || "558738219000",
  };
}
