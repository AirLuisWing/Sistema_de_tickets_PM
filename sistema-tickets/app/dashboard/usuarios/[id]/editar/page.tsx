import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ShieldAlert, ShieldCheck, User, Wrench } from "lucide-react"
import { actualizarUsuario } from "@/actions/users"
import { redirect } from "next/navigation"
import FormAccion from "@/components/FormAccion" 

export const dynamic = 'force-dynamic'

export default async function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion()
  
  // ELIMINADA VALIDACIÓN MANUAL DE ROL "Administrador" - El middleware ahora lo maneja

  const { id } = await params
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) }
  })

  if (!usuario) {
    redirect("/dashboard/usuarios")
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      
      <div className="mb-6">
        <Link href="/dashboard/usuarios">
          <Button variant="outline" className="dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            ← Volver al directorio
          </Button>
        </Link>
      </div>

      <Card className="shadow-md border-t-4 border-t-orange-500 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
        <CardHeader className="pb-4 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <CardTitle className="text-2xl text-slate-900 dark:text-white">Editar Usuario</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Modifica la información o el nivel de acceso de {usuario.nombre}.
          </CardDescription>
        </CardHeader>
        
        <FormAccion action={actualizarUsuario}>
          <input type="hidden" name="id" value={usuario.id} />

          <CardContent className="space-y-6 pt-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="font-semibold text-slate-700 dark:text-slate-300">Nombre Completo</Label>
                <Input id="nombre" name="nombre" defaultValue={usuario.nombre} required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="area" className="font-semibold text-slate-700 dark:text-slate-300">Área / Departamento</Label>
                <Input id="area" name="area" defaultValue={usuario.area || ""} required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email" className="font-semibold text-slate-700 dark:text-slate-300">Usuario</Label>
                <Input id="email" name="email" type="email" defaultValue={usuario.email} required className="dark:bg-slate-950 dark:border-slate-700 dark:text-white" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Label className="font-semibold text-slate-700 dark:text-slate-200 text-base mb-4 block">Nivel de Acceso (Rol)</Label>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Administrador" defaultChecked={usuario.rol === 'Administrador'} className="mt-1 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500" required />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                      <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-500" /> Administrador
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Supervisor" defaultChecked={usuario.rol === 'Supervisor'} className="mt-1 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                      <ShieldCheck className="h-4 w-4 text-orange-500 dark:text-orange-400" /> Supervisor / Coordinador
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="Tecnico" defaultChecked={usuario.rol === 'Tecnico'} className="mt-1 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                      <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-500" /> Agente de Soporte (Técnico)
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-slate-200 dark:border-slate-700 dark:bg-slate-900">
                  <input type="radio" name="rol" value="UsuarioFinal" defaultChecked={usuario.rol === 'UsuarioFinal'} className="mt-1 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500" />
                  <div>
                    <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-400" /> Usuario Final (Cliente/Empleado)
                    </div>
                  </div>
                </label>
              </div>
            </div>

          </CardContent>
          
          <CardFooter className="bg-slate-50 dark:bg-slate-900/50 py-4 px-6 border-t dark:border-slate-800">
            <Button type="submit" className="w-full font-bold bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white shadow-sm">
              Actualizar Usuario
            </Button>
          </CardFooter>
        </FormAccion>
      </Card>
    </div>
  )
}