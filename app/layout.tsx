import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MantenimientoVehicular — Sistema de Gestión",
  description:
    "Sistema de gestión de mantenimiento preventivo y finanzas para unidades de transporte. Control de cambios de aceite, gastos en repuestos e ingresos.",
  keywords: ["mantenimiento vehicular", "cambio de aceite", "gestión de flota", "finanzas"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-background antialiased">
        {children}
      </body>
    </html>
  );
}
