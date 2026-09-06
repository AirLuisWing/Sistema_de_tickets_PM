import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Briefcase, ShieldCheck, User as UserIcon, CheckCircle2, Clock } from "lucide-react"
import FormularioPassword from "./FormularioPassword"
import FormularioPerfil from "./FormularioPerfil"
import AvatarEditable from "./AvatarEditable"

export const dynamic = 'force-dynamic'

export default async function PerfilPage() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect("/")

  const usuario = await prisma.usuario.findUnique({ where: { id: sesion.userId } })
  if (!usuario) return <div className="p-8 text-center text-red-600">Error: Usuario no encontrado.</div>

  const iniciales = usuario.nombre.substring(0, 2).toUpperCase()
  const esTecnico = usuario.rol === "Tecnico"
  const esUsuarioFinal = usuario.rol === "UsuarioFinal"

  let estadisticas = { resueltos: 0, pendientes: 0, totalTramitados: 0 }

  if (esTecnico) {
    estadisticas.resueltos = await prisma.ticket.count({
      where: { tecnicos: { some: { id: usuario.id } }, estado: "Resuelto" }
    })
    estadisticas.pendientes = await prisma.ticket.count({
      where: { tecnicos: { some: { id: usuario.id } }, estado: { not: "Resuelto" } }
    })
  } else if (esUsuarioFinal || usuario.rol === "Administrador" || usuario.rol === "Supervisor") {
    estadisticas.totalTramitados = await prisma.ticket.count({
      where: { solicitanteId: usuario.id }
    })
    estadisticas.resueltos = await prisma.ticket.count({
      where: { solicitanteId: usuario.id, estado: "Resuelto" }
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Consulta tu información corporativa y gestiona tus credenciales de acceso.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-blue-800 shadow-sm dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
              
              <AvatarEditable urlFoto={usuario.fotoPerfil} iniciales={iniciales} />
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{usuario.nombre}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 mt-2 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                {usuario.rol}
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-t-4 border-t-emerald-600 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
            <CardHeader className="pb-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <CardTitle className="text-lg dark:text-slate-200">Tus Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {esTecnico ? (
                <>
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-500 font-bold">
                      <CheckCircle2 className="h-5 w-5" /> Tickets Resueltos
                    </div>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{estadisticas.resueltos}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-900/10 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-500 font-bold">
                      <Clock className="h-5 w-5" /> Tickets Pendientes
                    </div>
                    <span className="text-xl font-black text-orange-700 dark:text-orange-400">{estadisticas.pendientes}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-500 font-bold">
                      <CheckCircle2 className="h-5 w-5" /> Reportes Creados
                    </div>
                    <span className="text-xl font-black text-blue-700 dark:text-blue-400">{estadisticas.totalTramitados}</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-500 font-bold">
                      <CheckCircle2 className="h-5 w-5" /> Solucionados
                    </div>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">{estadisticas.resueltos}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-3 border-b dark:border-slate-800">
              <CardTitle className="text-lg dark:text-slate-200">Información Operativa</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase">Correo Institucional</p>
                  <p className="font-medium text-slate-900 dark:text-slate-300 truncate">{usuario.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 shrink-0">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase">Área / Departamento</p>
                  <p className="font-medium text-slate-900 dark:text-slate-300">{usuario.area || "No asignada"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-md text-slate-600 dark:text-slate-400 shrink-0">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-500 text-xs font-semibold uppercase">ID de Sistema</p>
                  <p className="font-medium text-slate-900 dark:text-slate-300">USR-{usuario.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 pb-4">
              <CardTitle className="dark:text-slate-200">Datos Generales</CardTitle>
              <CardDescription className="dark:text-slate-400">Actualiza tu área o departamento de adscripción en caso de rotación o cambio de funciones.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioPerfil areaActual={usuario.area || ""} />
            </CardContent>
          </Card>

          <Card className="shadow-sm h-full dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 pb-4">
              <CardTitle className="dark:text-slate-200">Seguridad de la Cuenta</CardTitle>
              <CardDescription className="dark:text-slate-400">Actualiza tu contraseña de acceso al sistema de tickets.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormularioPassword />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}