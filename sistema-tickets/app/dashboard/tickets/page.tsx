import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import TablaTickets from "./TablaTickets"

export const dynamic = 'force-dynamic'

export default async function TicketsPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")

  // AHORA ESTA PANTALLA ES ESTRICTAMENTE "MIS TICKETS CREADOS" PARA TODOS
  const tickets = await prisma.ticket.findMany({
    where: { solicitanteId: sesion.userId },
    include: { solicitante: true, tecnicos: true }, 
    orderBy: { fechaCreacion: 'desc' }
  })

  const ticketsFormateados = JSON.parse(JSON.stringify(tickets))

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mis Solicitudes</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Historial de todas las solicitudes y reportes que has creado.
        </p>
      </div>

      <TablaTickets tickets={ticketsFormateados} />
    </div>
  )
}