"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, Loader2 } from "lucide-react"
import { iniciarSesion } from "@/actions/auth" 

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const formData = new FormData(e.currentTarget)
    const respuesta = await iniciarSesion(formData)
    
    // Si hay error lo mostramos. Si es correcto, el Server Action nos redirigirá automáticamente.
    if (respuesta?.error) {
      setError(respuesta.error)
      setCargando(false)
    } 
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat transition-colors"
      style={{ backgroundImage: "url('/tickets/fondo-c4.jpg')" }}
    >
      
      {/* Filtro oscuro (overlay) */}
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 z-0"></div>
      
      {/* Tarjeta del Login */}
      <Card className="w-full max-w-md bg-white dark:bg-slate-900 dark:border dark:border-slate-800 shadow-2xl border-none rounded-2xl overflow-hidden relative z-10 transition-colors">
        <CardHeader className="pb-2 pt-10">
          
          <div className="flex justify-center items-center gap-6 mb-6">
            <img 
              src="/tickets/logo-tics.png" 
              alt="Escudo Policía Morelia" 
              className="h-20 w-auto object-contain" 
            />
            
            <div className="h-14 w-px bg-slate-200 dark:bg-slate-800"></div>
            
            <img 
              src="/tickets/tics_logo.png" 
              alt="Logo TICs" 
              /* AQUÍ ESTÁ LA MAGIA: En modo oscuro le pone un fondo blanco sutil */
              className="h-16 w-auto object-contain transition-all duration-300 dark:bg-white/95 dark:p-1.5 dark:rounded-xl dark:shadow-sm" 
            />
          </div>

          <h1 className="text-3xl font-black text-slate-900 dark:text-white text-center tracking-tight">
            Departamento de TICs
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center text-sm mt-2">
            Sistema de Tickets - Policía Morelia.<br/>
            Ingresa tus credenciales para continuar.
          </p>
        </CardHeader>
        
        <CardContent className="px-8 pb-10 pt-4">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 p-3 rounded-lg flex items-start gap-2 text-sm animate-in fade-in zoom-in duration-200">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-slate-700 dark:text-slate-300">Usuario</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="usuario@..." 
                required 
                className="h-12 border-slate-300 dark:border-slate-700 focus-visible:ring-blue-800 bg-white/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 transition-colors"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-slate-700 dark:text-slate-300">Contraseña</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="h-12 border-slate-300 dark:border-slate-700 focus-visible:ring-blue-800 bg-white/50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 dark:text-white dark:placeholder:text-slate-600 transition-colors"
                autoComplete="current-password"
              />
            </div>

            <Button 
              type="submit" 
              disabled={cargando}
              className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-md mt-2 transition-all"
            >
              {cargando ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      
    </div>
  )
}