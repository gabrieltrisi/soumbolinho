import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { CriancasProvider } from "./providers";
import TopNav from "@/components/TopNav";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "só um bolinho — Check-in da Brinquedoteca",
  description: "Controle de entrada da brinquedoteca do Só um Bolinho.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CriancasProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
        </CriancasProvider>
      </body>
    </html>
  );
}
