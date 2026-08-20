import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { PublicChrome } from "@/components/layout/PublicChrome";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Emprega Arcoverde | Portal Público de Empregabilidade e Qualificação",
  description:
    "Conectando talentos, empresas locais, a ACA e a Sala do Empreendedor em Arcoverde - PE. Vagas de emprego, cursos gratuitos e apoio na Feira de Empregabilidade.",
  keywords: [
    "Emprego Arcoverde",
    "Vagas Arcoverde",
    "Feira de Empregabilidade",
    "Sala do Empreendedor",
    "ACA Arcoverde",
    "Cursos Gratuitos Arcoverde",
    "Currículo Arcoverde",
  ],
  icons: {
    icon: "/brand/logo-emprega.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body className="min-h-screen flex flex-col bg-[#F4F5F7] text-[#1A1A1A] font-sans selection:bg-[#E65100] selection:text-white">
        <PublicChrome
          user={session ? { name: session.name, email: session.email, role: session.role } : null}
        >
          {children}
        </PublicChrome>
      </body>
    </html>
  );
}
