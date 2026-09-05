import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SeguridadCrearLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion()
  
  // CANDADO DE SEGURIDAD MÁXIMA (URL)
  if (!sesion || sesion.rol !== "Administrador") {
    redirect("/dashboard/tickets")
  }

  return <>{children}</>
}