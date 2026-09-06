"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function ControlesPaginacion({ 
  paginaActual, 
  totalPaginas, 
  rutaBase 
}: { 
  paginaActual: number; 
  totalPaginas: number; 
  rutaBase: string;
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const limiteActual = Number(searchParams.get("limite")) || 10

  const cambiarPagina = (nuevaPagina: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("pagina", nuevaPagina.toString())
    router.push(`${rutaBase}?${params.toString()}`)
  }

  const cambiarLimite = (nuevoLimite: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limite", nuevoLimite.toString())
    params.set("pagina", "1") 
    router.push(`${rutaBase}?${params.toString()}`)
  }

  if (totalPaginas <= 0) return null

  // 🧠 ALGORITMO DE PAGINACIÓN INTELIGENTE (Puntos suspensivos)
  const generarPaginas = () => {
    if (totalPaginas <= 7) {
      return Array.from({ length: totalPaginas }, (_, i) => i + 1)
    }
    if (paginaActual <= 3) {
      return [1, 2, 3, 4, '...', totalPaginas]
    }
    if (paginaActual >= totalPaginas - 2) {
      return [1, '...', totalPaginas - 3, totalPaginas - 2, totalPaginas - 1, totalPaginas]
    }
    return [1, '...', paginaActual - 1, paginaActual, paginaActual + 1, '...', totalPaginas]
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 gap-4 px-4 sm:px-6 pb-2">
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 font-medium">
        <span>Mostrar:</span>
        <select 
          value={limiteActual} 
          onChange={(e) => cambiarLimite(Number(e.target.value))}
          className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
        >
          <option className="dark:bg-slate-900 dark:text-slate-200" value={10}>10</option>
          <option className="dark:bg-slate-900 dark:text-slate-200" value={25}>25</option>
          <option className="dark:bg-slate-900 dark:text-slate-200" value={50}>50</option>
        </select>
        <span>registros</span>
      </div>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        <Button variant="outline" size="icon" onClick={() => cambiarPagina(Math.max(1, paginaActual - 1))} disabled={paginaActual === 1} className="h-8 w-8 dark:border-slate-700 dark:hover:bg-slate-800">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* RENDERIZADO LIMPIO CON ELIPSIS */}
        {generarPaginas().map((num, index) => (
          num === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-slate-400 dark:text-slate-500 select-none">
              ...
            </span>
          ) : (
            <Button 
              key={`pag-${num}`} 
              variant={paginaActual === num ? "default" : "outline"} 
              size="sm" 
              onClick={() => cambiarPagina(num as number)}
              className={`h-8 w-8 ${paginaActual === num ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'dark:border-slate-700 dark:text-slate-300'}`}
            >
              {num}
            </Button>
          )
        ))}

        <Button variant="outline" size="icon" onClick={() => cambiarPagina(Math.min(totalPaginas, paginaActual + 1))} disabled={paginaActual === totalPaginas} className="h-8 w-8 dark:border-slate-700 dark:hover:bg-slate-800">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}