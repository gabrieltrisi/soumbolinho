import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { CriancasProvider } from "./providers";
import TopNav from "@/components/TopNav";
import PwaRegister from "@/components/PwaRegister";

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
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "só um bolinho",
    statusBarStyle: "default",
  },
  other: {
    // meta legada que o iOS (iPad Safari) usa para abrir em tela cheia
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8859E",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CriancasProvider>
          <TopNav />
          <main className="flex-1">{children}</main>
        </CriancasProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
