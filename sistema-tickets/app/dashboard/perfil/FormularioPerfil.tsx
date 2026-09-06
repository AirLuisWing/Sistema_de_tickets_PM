"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react"
import { actualizarPerfil } from "@/actions/profile"

export default function FormularioPerfil({ areaActual }: { areaActual: string }) {
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  // 1. Convertimos el input a un "Componente Controlado" con useState
  const [valorArea, setValorArea] = useState(areaActual || "")

  // 2. Si la base de datos se actualiza por detrás, refrescamos el input
  useEffect(() => {
    setValorArea(areaActual || "")
  }, [areaActual])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setExito(null)
    setCargando(true)

    const formData = new FormData(e.currentTarget)
    const respuesta = await actualizarPerfil(formData)

    if (respuesta?.error) {
      setError(respuesta.error)
    } else if (respuesta?.success) {
      setExito(respuesta.success)
    }
    setCargando(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md flex items-start gap-2 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
          <p>{error}</p>
        </div>
      )}

      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-md flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
          <p className="font-medium">{exito}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="area">Área / Departamento Actual</Label>
        <Input 
          id="area" 
          name="area" 
          // 3. Usamos 'value' y 'onChange' en lugar de 'defaultValue'
          value={valorArea} 
          onChange={(e) => setValorArea(e.target.value)}
          placeholder="Ej. Centro C4, Monitoreo, etc." 
          required 
        />
      </div>

      <Button type="submit" disabled={cargando} className="w-full sm:w-auto mt-4 bg-blue-800 hover:bg-blue-900 text-white shadow-sm">
        {cargando ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
        ) : (
          <><Save className="mr-2 h-4 w-4" /> Guardar Cambios</>
        )}
      </Button>
    </form>
  )
}