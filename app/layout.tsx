import type { Metadata, Viewport } from "next"; // Afegim Viewport
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Biblioteca CCC',
  description: 'El nostre club de lectura privat',
  icons: {
    icon: '/icon.png', // El fitxer que has posat a la carpeta public o app
    apple: '/icon.png', // Això farà que es vegi bé si el guarden a l'inici de l'iPhone
  },
};

// AQUESTA ÉS LA CLAU PER AL MÒBIL:
// Evita que l'usuari pugui fer "zoom" accidental i força que l'ample sigui el del dispositiu
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ca" // Canviem a català ja que som la CCC!
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {/* 1. Eliminem marges i paddings del body.
          2. Fem que ocupi el 100% de l'amplada (w-screen) i el mínim de l'alçada (min-h-screen).
          3. overflow-x-hidden evita que la pantalla "balli" cap als costats.
      */}
      <body className="min-h-screen w-full m-0 p-0 bg-gray-50 overflow-x-hidden flex flex-col">
        {children}
      </body>
    </html>
  );
}