import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, AlertTriangle, CheckCircle, TicketIcon } from "lucide-react"
import GraficaTickets from "./GraficaTickets"
import UltimosTickets from "./UltimosTickets"
import FiltroDashboard from "./FiltroDashboard"

export const dynamic = 'force-dynamic'

export default async function DashboardPrincipalPage({ searchParams }: { searchParams: Promise<{ filtro?: string, fecha?: string }> }) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")
  
  // 🛡️ CORRECCIÓN REDIRECCIÓN: El usuario final va directo a sus tickets.
  // Nota: Las funciones de redirección (redirect) sí necesitan el basePath manualmente.
  if (sesion.rol === "UsuarioFinal") {
    redirect("/tickets/dashboard/tickets")
  }
  
  const resolvedParams = await searchParams
  const filtro = resolvedParams.filtro || "mes"
  const fechaEspecifica = resolvedParams.fecha

  let whereClause: Prisma.TicketWhereInput = {}
  let textoFiltro = filtro

  if (fechaEspecifica) {
    if (fechaEspecifica.length === 10) { 
      const inicioDia = new Date(`${fechaEspecifica}T00:00:00`)
      const finDia = new Date(`${fechaEspecifica}T23:59:59`)
      whereClause = { fechaCreacion: { gte: inicioDia, lte: finDia } }
      textoFiltro = fechaEspecifica
    } else if (fechaEspecifica.includes('-W')) {
      const [year, week] = fechaEspecifica.split('-W')
      const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
      const dow = simple.getDay()
      const inicioSemana = new Date(simple)
      inicioSemana.setDate(simple.getDate() - dow + (dow === 0 ? -6 : 1)) 
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      finSemana.setHours(23,59,59)
      whereClause = { fechaCreacion: { gte: inicioSemana, lte: finSemana } }
      textoFiltro = `Semana ${week}/${year}`
    } else if (fechaEspecifica.length === 7) { 
      const [year, month] = fechaEspecifica.split('-')
      const inicioMes = new Date(parseInt(year), parseInt(month) - 1, 1)
      const finMes = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      whereClause = { fechaCreacion: { gte: inicioMes, lte: finMes } }
      textoFiltro = `${month}/${year}`
    } else if (fechaEspecifica.length === 4) { 
      const inicioAno = new Date(parseInt(fechaEspecifica), 0, 1)
      const finAno = new Date(parseInt(fechaEspecifica), 11, 31, 23, 59, 59)
      whereClause = { fechaCreacion: { gte: inicioAno, lte: finAno } }
      textoFiltro = fechaEspecifica
    }
  } else {
    let fechaInicio = new Date()
    fechaInicio.setHours(0, 0, 0, 0)

    if (filtro === "hoy") {
    } else if (filtro === "semana") {
      const dia = fechaInicio.getDay()
      const diff = fechaInicio.getDate() - dia + (dia === 0 ? -6 : 1)
      fechaInicio.setDate(diff)
    } else if (filtro === "mes") {
      fechaInicio.setDate(1)
    } else if (filtro === "año") {
      fechaInicio.setMonth(0, 1)
    } else {
      fechaInicio = new Date("2000-01-01")
    }
    whereClause = { fechaCreacion: { gte: fechaInicio } }
  }

  const ticketsAbiertos = await prisma.ticket.count({ where: { ...whereClause, estado: 'Nuevo' } })
  const ticketsEnProceso = await prisma.ticket.count({ where: { ...whereClause, estado: 'En proceso' } })
  const ticketsResueltos = await prisma.ticket.count({ where: { ...whereClause, estado: 'Resuelto' } })
  
  const ticketsBaja = await prisma.ticket.count({ where: { ...whereClause, prioridad: 'Baja' } })
  const ticketsMedia = await prisma.ticket.count({ where: { ...whereClause, prioridad: 'Media' } })
  const ticketsAlta = await prisma.ticket.count({ where: { ...whereClause, prioridad: 'Alta' } })
  const ticketsCriticos = await prisma.ticket.count({ where: { ...whereClause, prioridad: 'Critica' } })

  const ultimosTickets = await prisma.ticket.findMany({
    where: whereClause,
    take: 10,
    orderBy: { fechaCreacion: 'desc' },
    include: { solicitante: true }
  })

  const datosEstados = [
    { nombre: 'Abiertos', total: ticketsAbiertos, color: '#3b82f6' },
    { nombre: 'En Proceso', total: ticketsEnProceso, color: '#eab308' },
    { nombre: 'Resueltos', total: ticketsResueltos, color: '#22c55e' },
  ]

  const datosPrioridad = [
    { nombre: 'Baja', total: ticketsBaja, color: '#22c55e' },
    { nombre: 'Media', total: ticketsMedia, color: '#eab308' },
    { nombre: 'Alta', total: ticketsAlta, color: '#f97316' },
    { nombre: 'Crítica', total: ticketsCriticos, color: '#ef4444' },
  ]

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bienvenido al panel de TICs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Resumen general del estado de los servicios.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">Filtrar por:</span>
          <FiltroDashboard filtroActual={filtro} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-t-4 border-t-blue-500 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Comparativa de Estados</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <GraficaTickets data={datosEstados} />
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-slate-800 dark:border-t-slate-500 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Carga de Trabajo por Prioridad</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <GraficaTickets data={datosPrioridad} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Tickets Abiertos</CardTitle>
            <TicketIcon className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{ticketsAbiertos}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">En Proceso</CardTitle>
            <Activity className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{ticketsEnProceso}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Resueltos <span className="text-xs font-normal text-slate-400 dark:text-slate-500">({textoFiltro})</span>
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{ticketsResueltos}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-400">Críticos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{ticketsCriticos}</div>
          </CardContent>
        </Card>
      </div>

      <UltimosTickets tickets={ultimosTickets} />
    </div>
  )
}