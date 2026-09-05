"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react"
import { cambiarPassword } from "@/app/actions"

export default function FormularioPassword() {
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // ==========================================
    // RED DE SEGURIDAD INTERCEPTADA
    // ==========================================
    if (!window.confirm("¿Estás absolutamente seguro de que deseas cambiar tu contraseña? Si la olvidas, perderás tu acceso y deberás solicitar a un Administrador que restablezca tu cuenta manualmente.")) {
      return // Si el usuario da clic en "Cancelar", la función se detiene aquí.
    }

    setError(null)
    setExito(null)
    setCargando(true)

    const formData = new FormData(e.currentTarget)
    const respuesta = await cambiarPassword(formData)

    if (respuesta?.error) {
      setError(respuesta.error)
    } else if (respuesta?.success) {
      setExito(respuesta.success)
      // Limpiar el formulario
      ;(e.target as HTMLFormElement).reset()
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
        <Label htmlFor="passwordActual">Contraseña Actual</Label>
        <Input id="passwordActual" name="passwordActual" type="password" required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="passwordNueva">Nueva Contraseña</Label>
          <Input id="passwordNueva" name="passwordNueva" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="passwordConfirmar">Confirmar Nueva Contraseña</Label>
          <Input id="passwordConfirmar" name="passwordConfirmar" type="password" required />
        </div>
      </div>

      <Button type="submit" disabled={cargando} className="w-full sm:w-auto mt-4 bg-slate-900 hover:bg-slate-800 dark:bg-blue-700 dark:hover:bg-blue-600 dark:disabled:bg-slate-800 dark:disabled:text-slate-500">
        {cargando ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
        ) : (
          <><KeyRound className="mr-2 h-4 w-4" /> Actualizar Contraseña</>
        )}
      </Button>
    </form>
  )
}