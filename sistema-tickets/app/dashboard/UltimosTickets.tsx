"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UltimosTickets({ tickets }: { tickets: any[] }) {
  const [filtroUrgencia, setFiltroUrgencia] = useState("Todos")
  const router = useRouter()

  const ticketsFiltrados = filtroUrgencia === "Todos" 
    ? tickets 
    : tickets.filter(t => t.prioridad === filtroUrgencia)

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'Critica': return 'bg-red-600 text-white dark:bg-red-900/40 dark:text-red-400 dark:border dark:border-red-800'
      case 'Alta': return 'bg-orange-500 text-white dark:bg-orange-900/40 dark:text-orange-400 dark:border dark:border-orange-800'
      case 'Media': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 dark:border dark:border-blue-800'
      case 'Baja': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border dark:border-slate-700'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Nuevo': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
      case 'En proceso': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
      case 'Resuelto': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
      default: return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    }
  }

  return (
    <Card className="shadow-sm border-t-0 mt-8 dark:bg-slate-900 dark:border-slate-800">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-slate-800 pb-4">
        <CardTitle className="text-xl text-slate-800 dark:text-slate-100">Últimos tickets reportados</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button variant={filtroUrgencia === "Todos" ? "default" : "outline"} size="sm" onClick={() => setFiltroUrgencia("Todos")} className="dark:border-slate-700 dark:text-slate-200 hover:bg-green-50 dark:border-green-900 dark:hover:bg-green-900/30 dark:text-green-400">Todos</Button>
          <Button variant={filtroUrgencia === "Critica" ? "default" : "outline"} size="sm" onClick={() => setFiltroUrgencia("Critica")} className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-900/30 dark:text-red-400">Críticos</Button>
          <Button variant={filtroUrgencia === "Alta" ? "default" : "outline"} size="sm" onClick={() => setFiltroUrgencia("Alta")} className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50 dark:border-orange-900 dark:hover:bg-orange-900/30 dark:text-orange-400">Altos</Button>
          <Button variant={filtroUrgencia === "Media" ? "default" : "outline"} size="sm" onClick={() => setFiltroUrgencia("Media")} className="text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-900/30 dark:text-blue-400">Medios</Button>
          <Button variant={filtroUrgencia === "Baja" ? "default" : "outline"} size="sm" onClick={() => setFiltroUrgencia("Baja")} className="text-slate-600 border-slate-200 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Bajos</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 font-medium border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Solicitante</th>
                <th className="px-6 py-4">Asunto / Categoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Prioridad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {ticketsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No hay tickets recientes.</td>
                </tr>
              ) : (
                ticketsFiltrados.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      #TK-{ticket.id.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(ticket.fechaCreacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {ticket.solicitante?.nombre || 'Desconocido'}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">{ticket.titulo}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{ticket.categoria} - {ticket.descripcion}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getEstadoColor(ticket.estado)}`}>
                        {ticket.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPrioridadColor(ticket.prioridad)}`}>
                        {ticket.prioridad}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}