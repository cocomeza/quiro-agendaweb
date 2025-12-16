import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "@/components/ToastProvider";

export const metadata: Metadata = {
  title: "Gestión de Turnos - QUIROPRAXIA RAMALLO",
  description: "Sistema de gestión de turnos para quiropraxia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}

