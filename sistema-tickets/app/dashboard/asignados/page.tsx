import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import TablaAsignados from "./TablaAsignados"

export const dynamic = 'force-dynamic'

export default async function AsignadosPage() {
  const sesion = await obtenerSesion()

  if (!sesion) {
    redirect("/")
  }

  if (sesion.rol === "UsuarioFinal") {
    redirect("/dashboard/tickets")
  }

  const esTecnico = sesion.rol === "Tecnico"
  
  const ticketsAsignados = await prisma.ticket.findMany({
    where: esTecnico 
      ? { tecnicos: { some: { id: sesion.userId } } } 
      : { tecnicos: { some: {} } }, 
    include: { 
      solicitante: true, 
      tecnicos: true 
    },
    orderBy: { fechaCreacion: 'desc' }
  })

  const ticketsFormateados = JSON.parse(JSON.stringify(ticketsAsignados))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tickets Asignados</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {esTecnico 
            ? "Listado de incidencias delegadas a tu usuario para resolución."
            : "Vista global de reportes bajo supervisión técnica."}
        </p>
      </div>

      <TablaAsignados tickets={ticketsFormateados} />
    </div>
  )
}