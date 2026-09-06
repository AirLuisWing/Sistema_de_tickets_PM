import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SeguridadCrearLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion()
  
  // ELIMINADA VALIDACIÓN MANUAL DE ROL "Administrador" - El middleware ahora lo maneja

  return <>{children}</>
}