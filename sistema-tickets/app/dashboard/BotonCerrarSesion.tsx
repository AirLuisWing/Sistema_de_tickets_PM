"use client"

import { LogOut } from "lucide-react"
import { cerrarSesion } from "@/app/aaaactions"

export default function BotonCerrarSesion() {
  return (
    <form 
      action={cerrarSesion} 
      className="w-full mt-auto"
      onSubmit={(e) => {
        if (!window.confirm("¿Estás seguro de que deseas cerrar sesión y salir del sistema?")) {
          e.preventDefault()
        }
      }}
    >
      <button 
        type="submit" 
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium border border-transparent hover:border-red-500/20"
      >
        <LogOut className="h-5 w-5" />
        <span>Cerrar Sesión</span>
      </button>
    </form>
  )
}