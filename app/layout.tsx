import type { Metadata, Viewport } from "next";
import { Syne, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { MusicPlayer } from "@/components/MusicPlayer";
import { ZodiOracle } from "@/components/ZodiOracle";
import "./globals.css";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap"
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "ZODI — Oráculo Astral con Humor Ácido | Horóscopo, Tarot y Numerología",
  description: "Horóscopo diario, tarot, numerología, carta natal y comunidad mística con estética cyberpunk. Crea tu perfil astral gratis y recibe lecturas con personalidad.",
  applicationName: "ZODI",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ZODI"
  },
  openGraph: {
    title: "ZODI — Oráculo Astral con Humor Ácido",
    description: "Horóscopo, tarot, numerología y comunidad mística. Tu perfil astral personalizado con lecturas directas, cyberpunk y sin postureo espiritual.",
    images: ["/zodi-landpage.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#060608",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

import { CookieBanner } from "@/components/public/CookieBanner";
import { SplashScreen } from "@/components/SplashScreen";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${syne.variable} ${jakarta.variable} ${mono.variable}`}>
      <body>
        <SplashScreen />
        {children}
        <ZodiOracle />
        <MusicPlayer />
        <CookieBanner />
      </body>
    </html>
  );
}
