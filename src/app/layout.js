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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Batch Watermark Studio | Procesamiento 100% Client-Side",
  description:
    "Aplica marcas de agua a lotes de imágenes y carpetas de forma segura, privada y 100% local en tu navegador sin enviar datos a ningún servidor.",
  keywords: [
    "watermark",
    "marca de agua",
    "batch processing",
    "lotes",
    "client-side",
    "privacidad",
    "canvas",
  ],
  authors: [{ name: "Batch Watermark Studio Team" }],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
