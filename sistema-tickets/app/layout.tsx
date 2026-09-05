import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider" // <-- IMPORTAMOS EL PROVEEDOR

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Tickets - Policía Morelia",
  description: "Mesa de ayuda y soporte técnico",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Agregamos suppressHydrationWarning para evitar errores visuales iniciales de Next.js
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        {/* ENVOLVEMOS LA APP (Soporta variables del sistema y clase "dark") */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}