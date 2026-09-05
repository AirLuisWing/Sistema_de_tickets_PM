"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export default function BotonImprimir() {
  // Dispara la ventana de impresión automáticamente al abrir la página
  useEffect(() => {
    setTimeout(() => {
      window.print()
    }, 500) // Pequeño retraso para asegurar que los datos cargaron
  }, [])

  return (
    <Button 
      onClick={() => window.print()} 
      className="fixed bottom-8 right-8 bg-blue-800 hover:bg-blue-900 text-white shadow-xl print:hidden rounded-full px-6 py-6"
    >
      <Printer className="mr-2 h-5 w-5" />
      Imprimir Acta
    </Button>
  )
}