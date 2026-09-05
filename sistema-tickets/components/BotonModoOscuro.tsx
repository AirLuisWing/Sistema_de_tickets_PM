"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export default function BotonModoOscuro() {
  const { theme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  // Evitamos errores de hidratación asegurando que cargue primero en el cliente
  useEffect(() => {
    setMontado(true)
  }, [])

  if (!montado) return <div className="h-9 w-9"></div> // Espacio vacío mientras carga

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 border-slate-200 bg-white hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800 relative flex items-center justify-center overflow-hidden"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Alternar tema"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-slate-600 dark:text-slate-400 absolute" />
      <Moon className="h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-400 dark:text-slate-300 absolute" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  )
}