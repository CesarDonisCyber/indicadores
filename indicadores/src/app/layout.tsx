import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indicadores",
  description: "Indicadores de Ciberseguridad y Concientización",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
