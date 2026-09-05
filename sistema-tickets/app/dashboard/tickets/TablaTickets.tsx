"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { getColorEstado, getColorPrioridad, cn } from "@/lib/utils"

export default function TablaTickets({ tickets = [], vistaGlobal = false }: { tickets: any[], vistaGlobal?: boolean }) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("Todos")
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 10
  
  const router = useRouter()

  const ticketsFiltrados = (tickets || []).filter(ticket => {
    if (!ticket) return false;

    const cumpleEstado = 
      filtroEstado === "Todos" || 
      (filtroEstado === "Asignados" && ticket.tecnicos && ticket.tecnicos.length > 0) ||
      (filtroEstado === "Sin asignar" && (!ticket.tecnicos || ticket.tecnicos.length === 0)) ||
      ticket.estado === filtroEstado

    const termino = busqueda.toLowerCase().trim()
    
    if (termino === "") return cumpleEstado

    const folioStr = ticket.id ? ticket.id.toString() : ""
    const tituloStr = (ticket.titulo || "").toLowerCase()
    const descStr = (ticket.descripcion || "").toLowerCase()
    const categoriaStr = (ticket.categoria || "").toLowerCase()
    const solicitanteStr = (ticket.solicitante?.nombre || "").toLowerCase()

    let fechaISO = ""
    let fechaLocal = ""
    try {
      if (ticket.fechaCreacion) {
        const dateObj = new Date(ticket.fechaCreacion)
        if (!isNaN(dateObj.getTime())) { 
          fechaISO = dateObj.toISOString().split('T')[0].toLowerCase() 
          fechaLocal = dateObj.toLocaleDateString().toLowerCase()
        }
      }
    } catch (error) {}

    const cumpleBusqueda = 
      folioStr.includes(termino) || 
      folioStr === termino.replace(/\D/g, '') ||
      fechaISO.includes(termino) || 
      fechaLocal.includes(termino) || 
      tituloStr.includes(termino) ||
      descStr.includes(termino) || 
      categoriaStr.includes(termino) || 
      solicitanteStr.includes(termino)

    return cumpleEstado && cumpleBusqueda
  })

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(ticketsFiltrados.length / ITEMS_POR_PAGINA))
  const ticketsPaginados = ticketsFiltrados.slice(
    (paginaActual - 1) * ITEMS_POR_PAGINA,
    paginaActual * ITEMS_POR_PAGINA
  )

  const getBotonFiltroClass = (estadoFiltro: string, colorClass: string) => {
    if (filtroEstado === estadoFiltro) {
      return cn("font-bold border-transparent shadow-sm", colorClass)
    }
    return "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
  }

  const exportarExcel = () => {
    if (ticketsFiltrados.length === 0) {
      alert("No hay datos para exportar con los filtros actuales.")
      return
    }

    const encabezados = ["Folio", "Fecha", "Solicitante", "Asunto", "Categoria", "Prioridad", "Estado", "Tecnicos Asignados"]

    const filas = ticketsFiltrados.map(t => {
      const folio = t.folio || `TIC-${t.id}`
      const fecha = t.fechaCreacion ? new Date(t.fechaCreacion).toLocaleDateString('es-MX') : 'Sin fecha'
      const solicitante = t.solicitante?.nombre || 'N/A'
      
      const asunto = `"${(t.titulo || '').replace(/"/g, '""')}"`
      const categoria = `"${(t.categoria || '').replace(/"/g, '""')}"`
      const tecnicos = `"${t.tecnicos && t.tecnicos.length > 0 ? t.tecnicos.map((tec: any) => tec.nombre).join(', ') : 'Sin asignar'}"`

      return [folio, fecha, solicitante, asunto, categoria, t.prioridad, t.estado, tecnicos]
    })

    const contenidoCSV = [
      encabezados.join(","),
      ...filas.map(fila => fila.join(","))
    ].join("\n")

    const blob = new Blob(["\uFEFF" + contenidoCSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    
    const fechaArchivo = new Date().toISOString().split('T')[0]
    link.download = `Reporte_Tickets_${fechaArchivo}.csv`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card className="shadow-md border-t-4 border-t-blue-800 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <CardTitle className="dark:text-white">{vistaGlobal ? "Directorio Global" : "Historial de Reportes"}</CardTitle>
            <CardDescription className="dark:text-slate-400">
              Mostrando {ticketsFiltrados.length} ticket(s) en total.
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input 
                type="text"
                placeholder="Buscar folio, fecha, usuario..."
                className="pl-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 focus-visible:ring-blue-800 dark:focus-visible:ring-blue-600"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Todos")} className={getBotonFiltroClass("Todos", "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white")}>Todos</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Nuevo")} className={getBotonFiltroClass("Nuevo", getColorEstado("Nuevo"))}>Nuevos</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("En proceso")} className={getBotonFiltroClass("En proceso", getColorEstado("En proceso"))}>En proceso</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Resuelto")} className={getBotonFiltroClass("Resuelto", getColorEstado("Resuelto"))}>Resueltos</Button>
              
              {vistaGlobal && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Asignados")} className={getBotonFiltroClass("Asignados", "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800")}>Asignados</Button>
                  <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Sin asignar")} className={getBotonFiltroClass("Sin asignar", "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800")}>Sin Asignar</Button>
                  
                  <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1 hidden sm:block"></div>
                  <Button 
                    onClick={exportarExcel} 
                    size="sm" 
                    className="font-bold bg-green-600 hover:bg-green-700 text-white border-transparent shadow-sm dark:bg-green-700 dark:hover:bg-green-600"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-700 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-semibold">Folio</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Solicitante</th>
                <th className="px-6 py-4 font-semibold">Asunto / Problema</th>
                <th className="px-6 py-4 font-semibold">Prioridad</th>
                <th className="px-6 py-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ticketsPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 italic">
                    No se encontraron tickets con ese criterio.
                  </td>
                </tr>
              ) : (
                ticketsPaginados.map((ticket) => {
                  const colorPrioridad = getColorPrioridad(ticket.prioridad || "")
                  const colorEstado = getColorEstado(ticket.estado || "")

                  return (
                    <tr 
                      key={ticket.id} 
                      onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                      className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white">
                        {ticket.folio || `#TIC-${ticket.id?.toString().padStart(4, '0')}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-500 dark:text-slate-400" suppressHydrationWarning>
                        {ticket.fechaCreacion ? new Date(ticket.fechaCreacion).toLocaleDateString() : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        {ticket.solicitante?.nombre || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{ticket.titulo || 'Sin título'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[250px] mt-1">
                          {ticket.categoria} {ticket.descripcion ? `- ${ticket.descripcion}` : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-md text-xs font-bold border dark:bg-opacity-20", colorPrioridad)}>
                          {ticket.prioridad || 'Baja'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("px-3 py-1 rounded-full text-xs font-bold border shadow-sm dark:bg-opacity-20", colorEstado)}>
                          {ticket.estado || 'Nuevo'}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Página <span className="font-bold text-slate-900 dark:text-white">{paginaActual}</span> de <span className="font-bold text-slate-900 dark:text-white">{totalPaginas}</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:bg-transparent">
                <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="font-bold dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:bg-transparent">
                Siguiente <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}