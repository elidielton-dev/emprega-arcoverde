import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
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
        {/*
          THESIS: A home é uma ferramenta de busca de vaga, no ritmo de um portal de emprego.
          OWN-WORLD: Fundo cinza, cards brancos, títulos na laranja da logo como o verde do Glassdoor. Ação preta.
          STORY: A pessoa lê o título, busca e vê vagas.
          FIRST VIEWPORT: Header branco; card de busca; título laranja da marca; vagas abaixo.
          FORM: Estrutura de portal de emprego; cor da logo só no destaque tipográfico.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
        */}
        <Navbar user={session ? { name: session.name, email: session.email, role: session.role } : null} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
