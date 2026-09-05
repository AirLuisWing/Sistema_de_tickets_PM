import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ==========================================
// SISTEMA DE COLORES PARA EL FRONT-END
// ==========================================

export function getColorEstado(estado: string) {
  switch (estado) {
    case 'Nuevo': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'En proceso': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Resuelto': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Cerrado': return 'bg-slate-200 text-slate-800 border-slate-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getColorPrioridad(prioridad: string) {
  switch (prioridad) {
    case 'Baja': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'Media': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'Alta': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Critica': return 'bg-red-100 text-red-800 border-red-200 animate-pulse'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getColorAsignacion(tieneTecnico: boolean) {
  return tieneTecnico 
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
    : 'bg-rose-50 text-rose-700 border-rose-200 border-dashed'
}