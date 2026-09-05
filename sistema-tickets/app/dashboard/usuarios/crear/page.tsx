"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldAlert, ShieldCheck, User, Wrench, AlertCircle } from "lucide-react"
import { registrarUsuario } from "@/app/actions" 

export default function CrearUsuarioPage() {
  const [mensajeError, setMensajeError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setMensajeError(null)
    const respuesta = await registrarUsuario(formData)
    
    if (respuesta?.error) {
      setMensajeError(respuesta.error)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      
      <div className="mb-6">
        <Link 
          href="/dashboard/usuarios"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 h-10 px-4 py-2 transition-colors"
        >
          ← Volver al directorio
        </Link>
      </div>

      <Card className="shadow-md border-t-4 border-t-blue-800 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
        <CardHeader className="pb-4 border-b bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
          <CardTitle className="text-2xl text-slate-900 dark:text-white">Alta de Nuevo Personal</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Registra un nuevo usuario en el sistema y define su nivel de acceso operativo.
          </CardDescription>
        </CardHeader>
        
        <form action={handleSubmit}>
          <CardContent className="space-y-6 pt-6">
            
            {mensajeError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400 p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">No se pudo registrar el usuario</p>
                  <p className="text-sm mt-1">{mensajeError}</p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="font-semibold text-slate-700 dark:text-slate-300">Nombre Completo</Label>
                <Input id="nombre" name="nombre" placeholder="Ej. Juan Pérez López" required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area" className="font-semibold text-slate-700 dark:text-slate-300">Área / Departamento</Label>
                <Input id="area" name="area" placeholder="Ej. Centro C4, Monitoreo..." required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300">Correo Electrónico / Usuario</Label>
                <Input id="email" name="email" type="email" placeholder="usuario@policiamorelia.gob.mx" required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-semibold text-slate-700 dark:text-slate-300">Contraseña Temporal</Label>
                <Input id="password" name="password" type="password" placeholder="••••••••" required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-600" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label className="font-semibold text-slate-700 dark:text-slate-200 text-base mb-4 block">Nivel de Acceso (Rol)</Label>
              <div className="space-y-3">
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Administrador" className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" required />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100"><ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-500" /> Administrador</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestión total del sistema. Configuración de parámetros, usuarios, reportes y supervisión global.</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Supervisor" className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100"><ShieldCheck className="h-4 w-4 text-orange-500 dark:text-orange-400" /> Supervisor / Coordinador</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Supervisa al equipo, asigna tickets, monitorea tiempos (SLA), genera reportes y aprueba cierres.</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Tecnico" className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100"><Wrench className="h-4 w-4 text-blue-600 dark:text-blue-500" /> Agente de Soporte (Técnico)</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Personal técnico. Atiende y resuelve tickets, actualiza estados y documenta las soluciones.</p>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900 bg-slate-50/50">
                  <input type="radio" name="rol" value="UsuarioFinal" className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" defaultChecked />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100"><User className="h-4 w-4 text-slate-600 dark:text-slate-400" /> Usuario Final (Cliente/Empleado)</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Solo puede reportar incidencias, consultar el estado de sus propios tickets y confirmar resoluciones.</p>
                  </div>
                </label>
                
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 py-4 px-6 border-t dark:border-slate-800">
            <Button type="submit" className="w-full font-bold bg-blue-800 hover:bg-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 text-white shadow-sm">
              Registrar Usuario
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}