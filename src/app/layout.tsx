import type { Metadata } from "next";
import { JetBrains_Mono, Orbitron, Share_Tech_Mono } from "next/font/google";
import "@/styles/globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  variable: "--font-share-tech",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "HackQuest - Aprende Ciberseguridad Jugando",
  description:
    "La plataforma gamificada de ciberseguridad. Aprende hacking ético, compite en tiempo real y domina las técnicas más avanzadas del sector.",
  keywords: [
    "ciberseguridad",
    "hacking ético",
    "CTF",
    "aprendizaje",
    "gamificación",
    "pentesting",
  ],
  openGraph: {
    title: "HackQuest - Aprende Ciberseguridad Jugando",
    description: "Aprende Ciberseguridad. Compite. Domina.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${jetbrainsMono.variable} ${orbitron.variable} ${shareTechMono.variable}`}
    >
      <body className="bg-military-dark text-matrix-green font-mono antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
