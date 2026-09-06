"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { getColorEstado, getColorPrioridad, cn } from "@/lib/utils"

export default function TablaAsignados({ tickets = [] }: { tickets: any[] }) {
  const [busqueda, setBusqueda] = useState("")
  const [filtroEstado, setFiltroEstado] = useState("Todos")
  
  const [paginaActual, setPaginaActual] = useState(1)
  const [itemsPorPagina, setItemsPorPagina] = useState(10)
  
  const router = useRouter()

  const ticketsFiltrados = (tickets || []).filter(ticket => {
    if (!ticket) return false;

    const cumpleEstado = filtroEstado === "Todos" || ticket.estado === filtroEstado
    const termino = busqueda.toLowerCase().trim()
    
    if (termino === "") return cumpleEstado

    const folioStr = ticket.id ? ticket.id.toString() : ""
    const tituloStr = (ticket.titulo || "").toLowerCase()
    const descStr = (ticket.descripcion || "").toLowerCase()
    const categoriaStr = (ticket.categoria || "").toLowerCase()
    const solicitanteStr = (ticket.solicitante?.nombre || "").toLowerCase()

    const cumpleBusqueda = 
      folioStr.includes(termino) || 
      tituloStr.includes(termino) ||
      descStr.includes(termino) || 
      categoriaStr.includes(termino) || 
      solicitanteStr.includes(termino)

    return cumpleEstado && cumpleBusqueda
  })

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado, itemsPorPagina])

  const totalPaginas = Math.max(1, Math.ceil(ticketsFiltrados.length / itemsPorPagina))
  const ticketsPaginados = ticketsFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  )

  const getBotonFiltroClass = (estadoFiltro: string, colorClass: string) => {
    if (filtroEstado === estadoFiltro) {
      return cn("font-bold border-transparent shadow-sm", colorClass)
    }
    return "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
  }

  // 🧠 ALGORITMO DE PAGINACIÓN INTELIGENTE
  const generarPaginas = () => {
    if (totalPaginas <= 7) return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    if (paginaActual <= 3) return [1, 2, 3, 4, '...', totalPaginas]
    if (paginaActual >= totalPaginas - 2) return [1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas]
    return [1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas]
  }

  return (
    <Card className="shadow-md border-t-4 border-t-blue-800 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
      <CardHeader className="pb-4 space-y-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <CardTitle className="dark:text-white">Bandeja de Trabajo</CardTitle>
            <CardDescription className="dark:text-slate-400">
              Mostrando {ticketsFiltrados.length} ticket(s) en tu carga de trabajo.
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
              <Input 
                type="text"
                placeholder="Buscar folio, fecha, usuario..."
                className="pl-9 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 dark:text-white dark:placeholder-slate-500 focus-visible:ring-blue-800"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Todos")} className={getBotonFiltroClass("Todos", "bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-200 dark:text-slate-900")}>Todos</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Nuevo")} className={getBotonFiltroClass("Nuevo", getColorEstado("Nuevo"))}>Nuevos</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("En proceso")} className={getBotonFiltroClass("En proceso", getColorEstado("En proceso"))}>En proceso</Button>
              <Button variant="outline" size="sm" onClick={() => setFiltroEstado("Resuelto")} className={getBotonFiltroClass("Resuelto", getColorEstado("Resuelto"))}>Resueltos</Button>
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
                    No tienes tickets asignados con ese criterio.
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

        {totalPaginas > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <span>Mostrar:</span>
              <select 
                value={itemsPorPagina} 
                onChange={(e) => setItemsPorPagina(Number(e.target.value))}
                className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option className="dark:bg-slate-900 dark:text-slate-200" value={10}>10</option>
                <option className="dark:bg-slate-900 dark:text-slate-200" value={25}>25</option>
                <option className="dark:bg-slate-900 dark:text-slate-200" value={50}>50</option>
              </select>
              <span>registros</span>
            </div>

            <div className="flex items-center gap-1 flex-wrap justify-center">
              <Button variant="outline" size="icon" onClick={() => setPaginaActual(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="h-8 w-8 dark:border-slate-700 dark:hover:bg-slate-800">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* RENDERIZADO LIMPIO CON ELIPSIS */}
              {generarPaginas().map((num, index) => (
                num === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-slate-400 dark:text-slate-500 select-none">...</span>
                ) : (
                  <Button 
                    key={`pag-${num}`} 
                    variant={paginaActual === num ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setPaginaActual(num as number)}
                    className={`h-8 w-8 ${paginaActual === num ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'dark:border-slate-700 dark:text-slate-300'}`}
                  >
                    {num}
                  </Button>
                )
              ))}

              <Button variant="outline" size="icon" onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="h-8 w-8 dark:border-slate-700 dark:hover:bg-slate-800">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}