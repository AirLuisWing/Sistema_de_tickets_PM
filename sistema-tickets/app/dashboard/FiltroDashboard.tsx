"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

export default function FiltroDashboard({ filtroActual }: { filtroActual: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fechaUrl = searchParams.get('fecha') || ""
  
  const [modoEspecifico, setModoEspecifico] = useState<"dia"|"semana-exacta"|"mes"|"año">("dia")

  const manejarCambioFecha = (valor: string) => {
    if (valor) {
      router.push(`/dashboard?fecha=${valor}`)
    } else {
      router.push(`/dashboard?filtro=mes`)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
      
      <select 
        className="bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer outline-none transition-colors"
        value={modoEspecifico}
        onChange={(e) => {
          setModoEspecifico(e.target.value as any)
          manejarCambioFecha("") 
        }}
      >
        <option value="dia">Día exacto</option>
        <option value="semana-exacta">Semana específica</option>
        <option value="mes">Mes específico</option>
        <option value="año">Año específico</option>
      </select>

      {modoEspecifico === "dia" && (
        <input type="date" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer color-scheme-dark transition-colors" value={fechaUrl} onChange={(e) => manejarCambioFecha(e.target.value)} />
      )}
      {modoEspecifico === "semana-exacta" && (
        <input type="week" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer transition-colors" value={fechaUrl} onChange={(e) => manejarCambioFecha(e.target.value)} />
      )}
      {modoEspecifico === "mes" && (
        <input type="month" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-200 cursor-pointer transition-colors" value={fechaUrl} onChange={(e) => manejarCambioFecha(e.target.value)} />
      )}
      {modoEspecifico === "año" && (
        <input type="number" min="2020" max="2100" placeholder="Ej: 2026" className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700 dark:text-slate-200 transition-colors" value={fechaUrl} onChange={(e) => manejarCambioFecha(e.target.value)} />
      )}

      <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase hidden sm:inline">o rango</span>

      <div className="relative w-full sm:w-auto">
        <select 
          className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md py-1.5 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium cursor-pointer text-sm dark:text-slate-200 transition-colors"
          value={fechaUrl ? "" : filtroActual}
          onChange={(e) => { router.push(`/dashboard?filtro=${e.target.value}`) }}
        >
          <option value="" disabled className="hidden">Rango dinámico...</option>
          <option value="hoy">Hoy</option>
          <option value="semana">Esta Semana</option>
          <option value="mes">Este Mes (Actual)</option>
          <option value="año">Este Año (Actual)</option>
          <option value="todos">Histórico Total</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500 dark:text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  )
}