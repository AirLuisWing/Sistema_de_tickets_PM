import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { obtenerSesion } from "@/lib/session"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, Activity, User, Ticket as TicketIcon, LogIn, Settings, Clock } from "lucide-react"
import FiltroBitacora from "./FiltroBitacora"
import AutoRefresh from "@/components/AutoRefresh"
import ControlesPaginacion from "@/components/ControlesPaginacion" // <-- IMPORTAMOS EL NUEVO COMPONENTE

export const dynamic = 'force-dynamic'

export default async function BitacoraPage({ searchParams }: { searchParams: Promise<{ filtro?: string, fecha?: string, pagina?: string, limite?: string }> }) {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")

  const resolvedParams = await searchParams
  const filtro = resolvedParams.filtro || "mes"
  const fechaEspecifica = resolvedParams.fecha
  const paginaActual = Number(resolvedParams.pagina) || 1
  
  // CAPTURAMOS EL LÍMITE DESDE LA URL (Por defecto 10)
  const ITEMS_POR_PAGINA = Number(resolvedParams.limite) || 10

  let whereClause: Prisma.BitacoraWhereInput = {}

  if (fechaEspecifica) {
    if (fechaEspecifica.length === 10) { 
      whereClause = { fecha: { gte: new Date(`${fechaEspecifica}T00:00:00`), lte: new Date(`${fechaEspecifica}T23:59:59`) } }
    } else if (fechaEspecifica.includes('-W')) {
      const [year, week] = fechaEspecifica.split('-W')
      const simple = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7)
      const dow = simple.getDay()
      const inicioSemana = new Date(simple)
      inicioSemana.setDate(simple.getDate() - dow + (dow === 0 ? -6 : 1)) 
      const finSemana = new Date(inicioSemana)
      finSemana.setDate(inicioSemana.getDate() + 6)
      finSemana.setHours(23,59,59)
      whereClause = { fecha: { gte: inicioSemana, lte: finSemana } }
    } else if (fechaEspecifica.length === 7) { 
      const [year, month] = fechaEspecifica.split('-')
      whereClause = { fecha: { gte: new Date(parseInt(year), parseInt(month) - 1, 1), lte: new Date(parseInt(year), parseInt(month), 0, 23, 59, 59) } }
    } else if (fechaEspecifica.length === 4) { 
      whereClause = { fecha: { gte: new Date(parseInt(fechaEspecifica), 0, 1), lte: new Date(parseInt(fechaEspecifica), 11, 31, 23, 59, 59) } }
    }
  } else {
    let fechaInicio = new Date()
    fechaInicio.setHours(0, 0, 0, 0)
    if (filtro === "hoy") {}
    else if (filtro === "semana") {
      const dia = fechaInicio.getDay()
      fechaInicio.setDate(fechaInicio.getDate() - dia + (dia === 0 ? -6 : 1))
    }
    else if (filtro === "mes") { fechaInicio.setDate(1) }
    else if (filtro === "año") { fechaInicio.setMonth(0, 1) }
    else { fechaInicio = new Date("2000-01-01") }
    whereClause = { fecha: { gte: fechaInicio } }
  }

  const totalRegistros = await prisma.bitacora.count({ where: whereClause })
  const totalPaginas = Math.ceil(totalRegistros / ITEMS_POR_PAGINA)

  const registros = await prisma.bitacora.findMany({
    where: whereClause,
    include: { usuario: true },
    orderBy: { fecha: 'desc' },
    skip: (paginaActual - 1) * ITEMS_POR_PAGINA,
    take: ITEMS_POR_PAGINA
  })

  const getModuloIcon = (modulo: string) => {
    switch (modulo) {
      case 'Autenticación': return <LogIn className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      case 'Tickets': return <TicketIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      case 'Directorio': return <User className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      case 'Perfil': return <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
      default: return <Activity className="h-4 w-4 text-slate-600 dark:text-slate-400" />
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <AutoRefresh milisegundos={10000} />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <ShieldAlert className="h-8 w-8 text-red-700 dark:text-red-500" /> Bitácora de Auditoría
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Registro inalterable de la actividad global del sistema.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">Filtro de Tiempo:</span>
          <FiltroBitacora filtroActual={filtro} /> 
        </div>
      </div>

      <Card className="shadow-md border-t-4 border-t-red-700 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
        <CardHeader className="pb-4 bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-800">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg dark:text-slate-200">Registro de Eventos</CardTitle>
            <CardDescription className="dark:text-slate-400">Mostrando {registros.length} de {totalRegistros} eventos.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-black">Fecha y Hora</th>
                  <th className="px-6 py-4 font-black">Usuario Responsable</th>
                  <th className="px-6 py-4 font-black">Módulo</th>
                  <th className="px-6 py-4 font-black">Acción Realizada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {registros.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-500 italic">No hay registros en este periodo.</td></tr>
                ) : (
                  registros.map((registro) => (
                    <tr key={registro.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                          <Clock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          {new Date(registro.fecha).toLocaleString('es-MX', { 
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">{registro.usuario.nombre}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">{registro.usuario.rol}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md w-max border border-slate-200 dark:border-slate-700 shadow-sm font-semibold dark:text-slate-300">
                          {getModuloIcon(registro.modulo)} {registro.modulo}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 dark:text-slate-200 uppercase text-xs mb-1">{registro.accion}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 leading-relaxed">{registro.detalles}</p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* INYECTAMOS LOS CONTROLES DINÁMICOS AQUÍ */}
          <ControlesPaginacion 
            paginaActual={paginaActual} 
            totalPaginas={totalPaginas} 
            rutaBase="/dashboard/bitacora" 
          />

        </CardContent>
      </Card>
    </div>
  )
}