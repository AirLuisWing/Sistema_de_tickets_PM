import { prisma } from "@/lib/prisma"
import { obtenerSesion } from "@/lib/session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Briefcase, ShieldCheck, User as UserIcon, CheckCircle2, Clock, FileText } from "lucide-react"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function PerfilUsuarioAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await obtenerSesion()
  
  // ELIMINADA VALIDACIÓN MANUAL DE ROL "Administrador" o "Supervisor" - El middleware ahora lo maneja

  const { id } = await params
  
  const usuario = await prisma.usuario.findUnique({
    where: { id: Number(id) }
  })

  if (!usuario) {
    return <div className="p-8 text-center text-red-600 dark:text-red-400 font-bold text-xl">El usuario no existe en la base de datos.</div>
  }

  const iniciales = usuario.nombre.substring(0, 2).toUpperCase()
  const esTecnico = usuario.rol === "Tecnico"
  const esUsuarioFinal = usuario.rol === "UsuarioFinal"

  let estadisticas = { resueltos: 0, pendientes: 0, totalTramitados: 0 }
  let ultimosTickets = []

  if (esTecnico) {
    estadisticas.resueltos = await prisma.ticket.count({ where: { tecnicos: { some: { id: usuario.id } }, estado: "Resuelto" } })
    estadisticas.pendientes = await prisma.ticket.count({ where: { tecnicos: { some: { id: usuario.id } }, estado: { not: "Resuelto" } } })
    
    ultimosTickets = await prisma.ticket.findMany({
      where: { tecnicos: { some: { id: usuario.id } } },
      orderBy: { fechaCreacion: 'desc' },
      take: 5
    })
  } else {
    estadisticas.totalTramitados = await prisma.ticket.count({ where: { solicitanteId: usuario.id } })
    estadisticas.resueltos = await prisma.ticket.count({ where: { solicitanteId: usuario.id, estado: "Resuelto" } })
    
    ultimosTickets = await prisma.ticket.findMany({
      where: { solicitanteId: usuario.id },
      orderBy: { fechaCreacion: 'desc' },
      take: 5
    })
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Expediente Operativo</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Vista de auditoría administrativa.</p>
        </div>
        <Link href="/dashboard/usuarios">
          <Button variant="outline" className="font-bold dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">← Volver al Directorio</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-slate-800 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800 shadow-sm">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
              <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-800 shadow-lg mb-4">
                <AvatarFallback className="bg-slate-800 text-white text-4xl font-bold">{iniciales}</AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">{usuario.nombre}</h2>
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-800 mt-3 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                <ShieldCheck className="h-4 w-4" /> {usuario.rol}
              </span>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-t-4 border-t-emerald-600 dark:bg-slate-900 dark:border-x-slate-800 dark:border-b-slate-800">
            <CardHeader className="pb-3 border-b bg-slate-50 dark:bg-slate-950 dark:border-slate-800">
              <CardTitle className="text-lg dark:text-slate-200">Indicadores de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              {esTecnico ? (
                <>
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-500 font-bold"><CheckCircle2 className="h-5 w-5" /> Tickets Resueltos</div>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{estadisticas.resueltos}</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
                    <div className="flex items-center gap-2 text-orange-800 dark:text-orange-500 font-bold"><Clock className="h-5 w-5" /> Tickets Pendientes</div>
                    <span className="text-2xl font-black text-orange-700 dark:text-orange-400">{estadisticas.pendientes}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 text-blue-800 dark:text-blue-500 font-bold"><FileText className="h-5 w-5" /> Reportes Creados</div>
                    <span className="text-2xl font-black text-blue-700 dark:text-blue-400">{estadisticas.totalTramitados}</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-500 font-bold"><CheckCircle2 className="h-5 w-5" /> Solucionados</div>
                    <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{estadisticas.resueltos}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          
          <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-4 border-b bg-slate-50/50 dark:bg-slate-950 dark:border-slate-800">
              <CardTitle className="text-lg dark:text-slate-200">Información Corporativa</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-slate-600 dark:text-slate-400"><Briefcase className="h-5 w-5" /></div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">Área / Departamento</p>
                  <p className="font-bold text-slate-900 dark:text-slate-200 text-base">{usuario.area || "No asignada"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-slate-600 dark:text-slate-400 shrink-0"><Mail className="h-5 w-5" /></div>
                <div className="overflow-hidden">
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">Correo Institucional</p>
                  <p className="font-bold text-slate-900 dark:text-slate-200 text-base truncate">{usuario.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-slate-600 dark:text-slate-400"><UserIcon className="h-5 w-5" /></div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">ID de Sistema</p>
                  <p className="font-bold text-slate-900 dark:text-slate-200 text-base">USR-{usuario.id.toString().padStart(4, '0')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <CardHeader className="pb-4 border-b bg-slate-50/50 dark:bg-slate-950 dark:border-slate-800">
              <CardTitle className="text-lg dark:text-slate-200">Última Actividad Operativa</CardTitle>
              <CardDescription className="dark:text-slate-400">Los últimos 5 reportes {esTecnico ? "asignados a" : "tramitados por"} este usuario.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {ultimosTickets.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 italic">No hay historial de tickets para mostrar.</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ultimosTickets.map(ticket => (
                    <Link key={ticket.id} href={`/dashboard/tickets/${ticket.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div>
                        <p className="font-black text-slate-900 dark:text-slate-100">{ticket.folio || `#TIC-${ticket.id}`}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{ticket.titulo}</p>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">{ticket.estado}</span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2">{new Date(ticket.fechaCreacion).toLocaleDateString()}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}