"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function BotonExportar() {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-md print:hidden dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 dark:border-slate-700"
    >
      <Printer className="mr-2 h-4 w-4" /> 
      Generar Reporte PDF
    </Button>
  )
}