"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"

export default function FormAccion({ 
  action, 
  children, 
  className 
}: { 
  action: (formData: FormData) => Promise<any>, 
  children: React.ReactNode,
  className?: string
}) {
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    try {
      const resultado = await action(formData)
      if (resultado && resultado.error) {
        setError(resultado.error)
      }
    } catch (err: any) {
      // EXTREMADAMENTE IMPORTANTE: Next.js usa "NEXT_REDIRECT" para refrescar la pantalla.
      // Si interceptamos eso, la página se queda congelada. Lo dejamos pasar.
      if (err?.message?.includes("NEXT_REDIRECT") || err?.digest?.includes("NEXT_REDIRECT")) {
        throw err
      }
      setError(err.message || "Ocurrió un error inesperado al procesar la solicitud.")
    }
  }

  return (
    <form action={handleSubmit} className={className}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-center gap-3 text-sm shadow-sm mb-4 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="font-bold leading-tight">{error}</p>
        </div>
      )}
      {children}
    </form>
  )
}