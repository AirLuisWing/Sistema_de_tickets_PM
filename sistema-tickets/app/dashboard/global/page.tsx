import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import TablaTickets from "../tickets/TablaTickets"

export const dynamic = 'force-dynamic'

export default async function PanelGlobalPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")

  // 🛡️ CORRECCIÓN DATA LEAK: Traemos los tickets asegurando no incluir contraseñas
  const tickets = await prisma.ticket.findMany({
    include: { 
      solicitante: { select: { id: true, nombre: true, area: true, email: true } }, 
      tecnicos: { select: { id: true, nombre: true, area: true } } 
    },
    orderBy: { fechaCreacion: 'desc' }
  })

  const ticketsFormateados = JSON.parse(JSON.stringify(tickets))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Directorio Global de Tickets</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Gestión centralizada de todas las incidencias y solicitudes operativas.
        </p>
      </div>

      <TablaTickets tickets={ticketsFormateados} vistaGlobal={true} />
    </div>
  )
}